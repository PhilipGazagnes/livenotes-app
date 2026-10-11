import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { reactive, nextTick } from 'vue'
import type { ProjectStatus } from '@livenotes/shared/offline'

const rpc = vi.fn()
vi.mock('@/lib/supabase', () => ({ supabase: { rpc: (...a: unknown[]) => rpc(...a) } }))

// Auth store stand-in: only what the edit-mode store reads
const auth = reactive({
  userId: 'u1',
  activeProjectId: 'p1' as string | null,
  isOnline: true,
  isEditor: true,
  isAdmin: false,
})
vi.mock('../auth', () => ({ useAuthStore: () => auth }))

const toasts: string[] = []
vi.mock('../ui', () => ({
  useUiStore: () => ({
    showToast: (message: string) => { toasts.push(message) },
    showErrorToast: (op: string) => { toasts.push(`Failed to ${op}`) },
  }),
}))

const { localVersion, __setSnapshotStoreFactory, setOfflineActiveProject } = await import('@/lib/offline/offlineData')
const { setProjectStatus, resetProjectStatus } = await import('@/lib/offline/projectStatus')
const { commitWrite, EditNotAllowedError } = await import('@/lib/offline/projectWrites')
const { useEditModeStore, EDIT_FLAG_TTL_MS, KEEP_EDITING_PROMPT_MS } = await import('../editMode')

function status(editor: string | null, version = 5): ProjectStatus {
  return {
    version,
    lastChangedAt: null,
    lastChangedBy: null,
    editor: editor ? { userId: editor, name: editor === 'u1' ? 'Me' : 'Alex', since: null, expiresInSeconds: 900 } : null,
  }
}

beforeEach(async () => {
  setActivePinia(createPinia())
  __setSnapshotStoreFactory(() => ({
    load: async () => null, save: async () => {}, remove: async () => {}, close: () => {}, destroy: async () => {},
    stats: async () => ({ projects: 0, bytes: 0 }),
  }))
  setOfflineActiveProject('p1')
  // let the (empty) local copy finish loading before setting its version
  await new Promise(resolve => setTimeout(resolve))
  resetProjectStatus()
  localVersion.value = 5
  Object.assign(auth, { userId: 'u1', activeProjectId: 'p1', isOnline: true, isEditor: true, isAdmin: false })
  toasts.length = 0
  rpc.mockReset()
})

afterEach(() => {
  vi.useRealTimers()
  setOfflineActiveProject(null)
})

describe('blockReason (ADR-013)', () => {
  it('not editing by default (viewing mode)', () => {
    setProjectStatus('p1', status(null))
    const store = useEditModeStore()
    expect(store.blockReason).toBe('not-editing')
    expect(store.canEditNow).toBe(false)
  })

  it('offline comes first', () => {
    auth.isOnline = false
    setProjectStatus('p1', status('u2'))
    expect(useEditModeStore().blockReason).toBe('offline')
  })

  it('someone else holds the flag', () => {
    setProjectStatus('p1', status('u2'))
    const store = useEditModeStore()
    expect(store.blockReason).toBe('locked')
    expect(store.blockMessage()).toBe('Being edited by Alex')
  })

  it('outdated copy asks for a sync', () => {
    setProjectStatus('p1', status(null, 9))
    expect(useEditModeStore().blockReason).toBe('outdated')
  })

  it('holding the flag allows editing', async () => {
    const store = useEditModeStore()
    setProjectStatus('p1', status('u1'))
    await nextTick()
    expect(store.isEditing).toBe(true)
    expect(store.blockReason).toBeNull()
    expect(store.canEditNow).toBe(true)
  })

  it('viewers can never edit', async () => {
    auth.isEditor = false
    const store = useEditModeStore()
    setProjectStatus('p1', status('u1'))
    await nextTick()
    expect(store.canEditNow).toBe(false)
  })
})

describe('write guard', () => {
  it('blocks project writes when not editing, with the reason', async () => {
    useEditModeStore()
    setProjectStatus('p1', status(null))
    const write = vi.fn()
    const attempt = commitWrite(write, {})
    await expect(attempt).rejects.toBeInstanceOf(EditNotAllowedError)
    await expect(attempt).rejects.toThrow('Start editing first')
    expect(write).not.toHaveBeenCalled()
  })
})

describe('startEditing', () => {
  it('sends the local version and enters edit mode', async () => {
    rpc.mockResolvedValue({ data: { ok: true, status: { version: 5, last_changed_at: null, last_changed_by: null, editor: { user_id: 'u1', name: 'Me', since: null, expires_in_seconds: 900 } } }, error: null })
    const store = useEditModeStore()
    await store.startEditing()
    expect(rpc).toHaveBeenCalledWith('start_project_editing', { p_project_id: 'p1', p_known_version: 5 })
    await nextTick()
    expect(store.isEditing).toBe(true)
  })

  it('outdated copy: asks to sync first', async () => {
    rpc.mockResolvedValue({ data: { ok: false, reason: 'outdated', status: { version: 7, last_changed_at: null, last_changed_by: null, editor: null } }, error: null })
    const store = useEditModeStore()
    await store.startEditing()
    expect(store.isEditing).toBe(false)
    expect(toasts).toContain('Your copy is outdated. Sync first.')
  })

  it('locked: names who is editing', async () => {
    rpc.mockResolvedValue({ data: { ok: false, reason: 'locked', status: { version: 5, last_changed_at: null, last_changed_by: null, editor: { user_id: 'u2', name: 'Alex', since: null, expires_in_seconds: 300 } } }, error: null })
    const store = useEditModeStore()
    await store.startEditing()
    expect(toasts).toContain('Being edited by Alex')
  })
})

describe('inactivity (ADR-011)', () => {
  it('asks "Keep editing?" 30 s before the expiry, then stops', async () => {
    vi.useFakeTimers()
    rpc.mockResolvedValue({ data: { ok: true }, error: null })
    const store = useEditModeStore()
    setProjectStatus('p1', status('u1'))
    await nextTick()
    expect(store.isEditing).toBe(true)

    await vi.advanceTimersByTimeAsync(EDIT_FLAG_TTL_MS - KEEP_EDITING_PROMPT_MS)
    expect(store.showKeepEditing).toBe(true)

    await vi.advanceTimersByTimeAsync(KEEP_EDITING_PROMPT_MS)
    expect(store.showKeepEditing).toBe(false)
    expect(store.isEditing).toBe(false)
    expect(rpc).toHaveBeenCalledWith('stop_project_editing', { p_project_id: 'p1' })
  })

  it('a write restarts the countdown', async () => {
    vi.useFakeTimers()
    const store = useEditModeStore()
    setProjectStatus('p1', status('u1'))
    await nextTick()
    await vi.advanceTimersByTimeAsync(10 * 60 * 1000)
    await commitWrite(async () => 'ok', {}).catch(() => {})
    await nextTick()
    await vi.advanceTimersByTimeAsync(EDIT_FLAG_TTL_MS - KEEP_EDITING_PROMPT_MS - 1000)
    expect(store.showKeepEditing).toBe(false)
    expect(store.isEditing).toBe(true)
  })
})
