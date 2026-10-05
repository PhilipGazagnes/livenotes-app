import { computed, ref } from 'vue'
import { fetchProjectStatus, type ProjectStatus } from '@livenotes/shared/offline'
import { supabase } from '@/lib/supabase'
import { logger } from '@/utils/logger'
import { isOfflineMode } from './offlineState'
import { getOfflineActiveProjectId, localVersion } from './offlineData'

/**
 * Server status of the active project (ADR-010, ADR-011): its version and who
 * holds the editing flag. Checking is informative only: it never changes the
 * local copy.
 */

/** Minimum time between two automatic checks (navigation, focus). */
export const STATUS_CHECK_INTERVAL_MS = 30_000

export const projectStatus = ref<ProjectStatus | null>(null)
/** Date.now() when `projectStatus` was received (for the flag's expiry) */
export const projectStatusReceivedAt = ref(0)

let statusProjectId: string | null = null
let lastCheckAt = 0
let pending: Promise<ProjectStatus | null> | null = null

/** The server has a different version than the local copy: a sync is needed. */
export const isLocalCopyOutdated = computed(() =>
  projectStatus.value !== null &&
  localVersion.value !== null &&
  projectStatus.value.version !== localVersion.value
)

/** Record a status received from the server (status check or editing-flag call). */
export function setProjectStatus(projectId: string, status: ProjectStatus | null): void {
  if (projectId !== getOfflineActiveProjectId()) return
  statusProjectId = projectId
  projectStatus.value = status
  projectStatusReceivedAt.value = Date.now()
}

/** Forget the status (active project changed, signed out). */
export function resetProjectStatus(): void {
  projectStatus.value = null
  projectStatusReceivedAt.value = 0
  statusProjectId = null
  lastCheckAt = 0
}

/**
 * Fetch the active project's status (one small request). Throttled unless
 * `force`; skipped offline. Failures keep the previous status.
 */
export function checkProjectStatus({ force = false } = {}): Promise<ProjectStatus | null> {
  const projectId = getOfflineActiveProjectId()
  if (!projectId || isOfflineMode()) return Promise.resolve(projectStatus.value)
  const fresh = statusProjectId === projectId && Date.now() - lastCheckAt < STATUS_CHECK_INTERVAL_MS
  if (!force && fresh) return Promise.resolve(projectStatus.value)
  if (pending) return pending

  lastCheckAt = Date.now()
  pending = fetchProjectStatus(supabase, projectId)
    .then(status => {
      setProjectStatus(projectId, status)
      return status
    })
    .catch(err => {
      logger.warn('Project status check failed', err)
      return projectStatus.value
    })
    .finally(() => { pending = null })
  return pending
}

let initialized = false

/** Check at app open (via the active project), on reconnect, when the app comes back to the foreground. */
export function initProjectStatusChecks(): void {
  if (initialized) return
  initialized = true
  window.addEventListener('online', () => { void checkProjectStatus({ force: true }) })
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void checkProjectStatus()
  })
}
