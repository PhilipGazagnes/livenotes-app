import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { parseEditFlagResult, type EditFlagResult } from '@livenotes/shared/offline'
import { supabase } from '@/lib/supabase'
import { localVersion } from '@/lib/offline/offlineData'
import {
  checkProjectStatus,
  isLocalCopyOutdated,
  projectStatus,
  projectStatusReceivedAt,
  setProjectStatus,
} from '@/lib/offline/projectStatus'
import { EditNotAllowedError, onWriteCommitted, setWriteGuard } from '@/lib/offline/projectWrites'
import { I18N } from '@/constants/i18n'
import { logger } from '@/utils/logger'
import { useAuthStore } from './auth'
import { useUiStore } from './ui'

/** Server-side expiry of the editing flag without a write (project_edit_ttl) */
export const EDIT_FLAG_TTL_MS = 15 * 60 * 1000
/** "Keep editing?" shows this long before the flag expires */
export const KEEP_EDITING_PROMPT_MS = 30 * 1000

export type EditBlockReason = 'offline' | 'locked' | 'outdated' | 'not-editing'

type FlagRpc = 'start_project_editing' | 'renew_project_editing' | 'stop_project_editing' | 'release_project_editing'

async function callFlagRpc(fn: FlagRpc, args: Record<string, unknown>): Promise<EditFlagResult> {
  const { data, error } = await (supabase.rpc as unknown as (
    name: string,
    params: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: unknown }>)(fn, args)
  if (error) throw error
  return parseEditFlagResult(data)
}

/**
 * Project edit mode (ADR-011, ADR-013): one member at a time holds the
 * project's editing flag. Viewing is the default; editing is deliberate.
 */
export const useEditModeStore = defineStore('editMode', () => {
  const authStore = useAuthStore()
  const uiStore = useUiStore()

  /** Client-clock time at which our flag expires; null when we don't hold it */
  const deadline = ref<number | null>(null)
  /** Project whose flag we hold (to release it when switching projects) */
  let editingProjectId: string | null = null
  const showKeepEditing = ref(false)
  const isBusy = ref(false)

  const hasEditorRole = computed(() => authStore.isEditor)
  const editor = computed(() => projectStatus.value?.editor ?? null)
  const isEditing = computed(() => deadline.value !== null && editor.value?.userId === authStore.userId)
  /** Another member holding the flag */
  const otherEditor = computed(() =>
    editor.value && editor.value.userId !== authStore.userId ? editor.value : null
  )
  const otherEditorName = computed(() => otherEditor.value?.name || I18N.EDIT_MODE.SOMEONE)

  const blockReason = computed<EditBlockReason | null>(() => {
    if (!authStore.isOnline) return 'offline'
    if (otherEditor.value) return 'locked'
    if (isEditing.value) return null
    if (isLocalCopyOutdated.value) return 'outdated'
    return 'not-editing'
  })

  /** Role allows editing and editing is possible right now */
  const canEditNow = computed(() => hasEditorRole.value && blockReason.value === null)

  function blockMessage(reason: EditBlockReason | null = blockReason.value): string {
    switch (reason) {
      case 'offline': return I18N.EDIT_MODE.BLOCKED_OFFLINE
      case 'locked': return I18N.EDIT_MODE.BLOCKED_LOCKED(otherEditorName.value)
      case 'outdated': return I18N.EDIT_MODE.BLOCKED_OUTDATED
      case 'not-editing': return I18N.EDIT_MODE.BLOCKED_NOT_EDITING
      default: return ''
    }
  }

  /** Tapped a disabled edit control: say why. */
  function explainBlock(): void {
    if (blockReason.value) uiStore.showToast(blockMessage(), 'error')
  }

  /** Run an edit action, or explain why it isn't possible right now. */
  function runIfEditable(action: () => unknown): void {
    if (canEditNow.value) action()
    else explainBlock()
  }

  // Every project write checks this first (the server enforces it too)
  setWriteGuard(() => {
    if (!hasEditorRole.value) throw new EditNotAllowedError(I18N.EDIT_MODE.NOT_ALLOWED)
    if (blockReason.value) throw new EditNotAllowedError(blockMessage())
  })
  // A write by the holder refreshes the flag on the server: restart the countdown
  onWriteCommitted(() => {
    if (isEditing.value) deadline.value = Date.now() + EDIT_FLAG_TTL_MS
  })

  // Follow the server: we hold the flag only while the status says so
  watch([projectStatus, projectStatusReceivedAt], () => {
    const current = projectStatus.value?.editor
    if (current && current.userId === authStore.userId) {
      deadline.value = projectStatusReceivedAt.value + current.expiresInSeconds * 1000
      editingProjectId = authStore.activeProjectId
    } else {
      if (deadline.value !== null && projectStatus.value) uiStore.showToast(I18N.EDIT_MODE.LOST, 'error')
      deadline.value = null
    }
  })

  // Countdown: "Keep editing?" 30 s before the expiry, then stop
  let promptTimer: ReturnType<typeof setTimeout> | null = null
  let expiryTimer: ReturnType<typeof setTimeout> | null = null
  watch(deadline, value => {
    if (promptTimer) clearTimeout(promptTimer)
    if (expiryTimer) clearTimeout(expiryTimer)
    promptTimer = expiryTimer = null
    showKeepEditing.value = false
    if (value === null) return
    const remaining = value - Date.now()
    promptTimer = setTimeout(() => { showKeepEditing.value = true }, Math.max(0, remaining - KEEP_EDITING_PROMPT_MS))
    expiryTimer = setTimeout(onExpired, Math.max(0, remaining))
  })

  async function onExpired(): Promise<void> {
    showKeepEditing.value = false
    deadline.value = null
    editingProjectId = null
    uiStore.showToast(I18N.EDIT_MODE.EXPIRED, 'error', 5000)
    const projectId = authStore.activeProjectId
    if (projectId) {
      await callFlagRpc('stop_project_editing', { p_project_id: projectId }).catch(() => {})
    }
    await checkProjectStatus({ force: true })
  }

  async function startEditing(): Promise<void> {
    const projectId = authStore.activeProjectId
    if (!projectId || !hasEditorRole.value || isBusy.value) return
    if (!authStore.isOnline) return explainBlock()
    if (localVersion.value === null) {
      uiStore.showToast(I18N.EDIT_MODE.BLOCKED_OUTDATED, 'error')
      return
    }
    isBusy.value = true
    try {
      const result = await callFlagRpc('start_project_editing', {
        p_project_id: projectId,
        p_known_version: localVersion.value,
      })
      setProjectStatus(projectId, result.status)
      if (result.ok) {
        uiStore.showToast(I18N.EDIT_MODE.STARTED, 'success', 4000)
      } else if (result.reason === 'locked') {
        uiStore.showToast(blockMessage('locked'), 'error')
      } else if (result.reason === 'outdated') {
        uiStore.showToast(I18N.EDIT_MODE.BLOCKED_OUTDATED, 'error')
      } else {
        uiStore.showToast(I18N.EDIT_MODE.NOT_ALLOWED, 'error')
      }
    } catch (err) {
      logger.error('Start editing failed', err)
      uiStore.showErrorToast('start editing', err as Error)
    } finally {
      isBusy.value = false
    }
  }

  /** Release our flag. `projectId` defaults to the active project. */
  async function stopEditing({ projectId = authStore.activeProjectId, silent = false } = {}): Promise<void> {
    if (!projectId) return
    deadline.value = null
    if (editingProjectId === projectId) editingProjectId = null
    try {
      await callFlagRpc('stop_project_editing', { p_project_id: projectId })
      if (!silent) uiStore.showToast(I18N.EDIT_MODE.STOPPED, 'success')
    } catch (err) {
      // The flag expires on its own
      logger.warn('Stop editing failed', err)
    }
    if (projectId === authStore.activeProjectId) await checkProjectStatus({ force: true })
  }

  async function keepEditing(): Promise<void> {
    const projectId = authStore.activeProjectId
    showKeepEditing.value = false
    if (!projectId) return
    try {
      const result = await callFlagRpc('renew_project_editing', { p_project_id: projectId })
      setProjectStatus(projectId, result.status)
    } catch (err) {
      logger.error('Keep editing failed', err)
      uiStore.showErrorToast('keep editing', err as Error)
    }
  }

  /** Administrator: release another member's flag. */
  async function releaseEditing(): Promise<void> {
    const projectId = authStore.activeProjectId
    if (!projectId || !authStore.isAdmin) return
    try {
      const result = await callFlagRpc('release_project_editing', { p_project_id: projectId })
      if (result.ok) uiStore.showToast(I18N.EDIT_MODE.RELEASED, 'success')
      else uiStore.showToast(I18N.EDIT_MODE.NOT_ALLOWED, 'error')
    } catch (err) {
      logger.error('Release editing failed', err)
      uiStore.showErrorToast('release editing', err as Error)
    }
    await checkProjectStatus({ force: true })
  }

  // Leaving a project while editing it releases the flag
  watch(() => authStore.activeProjectId, next => {
    if (editingProjectId && editingProjectId !== next) {
      const previous = editingProjectId
      editingProjectId = null
      void callFlagRpc('stop_project_editing', { p_project_id: previous }).catch(() => {})
    }
  }, { flush: 'sync' })

  return {
    deadline,
    showKeepEditing,
    isBusy,
    hasEditorRole,
    editor,
    isEditing,
    otherEditor,
    otherEditorName,
    blockReason,
    canEditNow,
    blockMessage,
    explainBlock,
    runIfEditable,
    startEditing,
    stopEditing,
    keepEditing,
    releaseEditing,
  }
})
