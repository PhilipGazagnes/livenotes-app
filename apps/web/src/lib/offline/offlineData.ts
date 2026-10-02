import { ref } from 'vue'
import {
  DexieSnapshotStore,
  deleteOtherUsersDatabases,
  fetchProjectSnapshot,
  isNetworkError,
  OfflineDataUnavailableError,
  withNetworkTimeout,
  type ProjectSnapshot,
  type SnapshotStore,
  type SyncProgress,
} from '@livenotes/shared/offline'
import { supabase } from '@/lib/supabase'
import { logger } from '@/utils/logger'
import { isOfflineMode, onDataWritten } from './offlineState'

/**
 * Offline data layer (web): one local snapshot per project in IndexedDB.
 * See livenotes-documentation/app/offline-data-layer-spec.md.
 *
 * - `readThrough` serves reads from the network when possible, from the
 *   snapshot when offline or when the network fails.
 * - `syncProject` replaces the snapshot atomically (all-or-nothing).
 * - Writes are online-only; each successful write schedules a re-sync.
 */

/** Online reads give up after this long when a snapshot can answer instead (venue "lie-fi"). */
export const REMOTE_READ_TIMEOUT_MS = 8_000
/** Auto-sync when the snapshot is older than this. */
export const AUTO_SYNC_MAX_AGE_MS = 10 * 60 * 1000
/** Debounce between a write and the background re-sync. */
export const DIRTY_RESYNC_DELAY_MS = 4_000

const LEGACY_LAST_SYNCED_PREFIX = 'livenotes-last-synced-'

let createStore: (userId: string) => SnapshotStore = userId => new DexieSnapshotStore(userId)

let currentUserId: string | null = null
let store: SnapshotStore | null = null
let activeProjectId: string | null = null
const snapshots = new Map<string, ProjectSnapshot>()
const pendingLoads = new Map<string, Promise<ProjectSnapshot | null>>()
const pendingSyncs = new Map<string, Promise<ProjectSnapshot>>()
let dirtyTimer: ReturnType<typeof setTimeout> | null = null
// Whether automatic syncs (on open, reconnect, after writes) may run for the
// active project. Manual sync is always allowed.
let autoSyncAllowed: () => boolean = () => true

/** Set the rule for automatic syncs, e.g. never for the shared community project. */
export function setAutoSyncPolicy(policy: () => boolean): void {
  autoSyncAllowed = policy
}

// Reactive state for the UI (refers to the active project)
export const isSyncing = ref(false)
export const syncProgress = ref<SyncProgress | null>(null)
export const lastSyncedAt = ref<Date | null>(null)
export const lastSyncError = ref<string | null>(null)

function refreshLastSynced(snapshot: ProjectSnapshot | null): void {
  lastSyncedAt.value = snapshot ? new Date(snapshot.syncedAt) : null
}

/** Switch the local database to `userId` (null when signed out). */
export function setOfflineUser(userId: string | null): void {
  if (userId === currentUserId) return
  store?.close()
  snapshots.clear()
  pendingLoads.clear()
  refreshLastSynced(null)
  currentUserId = userId
  store = userId ? createStore(userId) : null
  if (userId) {
    // Data of a previous user must not stay readable on this device
    deleteOtherUsersDatabases(userId).catch(err => logger.warn('Could not delete other users offline data', err))
    removeLegacyLastSyncedKeys()
  }
}

export function setOfflineActiveProject(projectId: string | null): void {
  if (projectId === activeProjectId) return
  activeProjectId = projectId
  refreshLastSynced(null)
  if (projectId) {
    getSnapshot(projectId)
      .then(snapshot => { if (activeProjectId === projectId) refreshLastSynced(snapshot) })
      .catch(err => logger.warn('Could not load offline snapshot', err))
  }
}

/** Sign-out: delete every offline database on this device. */
export async function clearOfflineData(): Promise<void> {
  const previous = store
  store = null
  currentUserId = null
  activeProjectId = null
  snapshots.clear()
  pendingLoads.clear()
  refreshLastSynced(null)
  if (dirtyTimer) clearTimeout(dirtyTimer)
  dirtyTimer = null
  removeLegacyLastSyncedKeys()
  try {
    await previous?.destroy()
    await deleteOtherUsersDatabases()
  } catch (err) {
    logger.error('Failed to delete offline data', err)
  }
}

function removeLegacyLastSyncedKeys(): void {
  try {
    Object.keys(localStorage)
      .filter(key => key.startsWith(LEGACY_LAST_SYNCED_PREFIX))
      .forEach(key => localStorage.removeItem(key))
  } catch {
    // storage unavailable: nothing to clean
  }
}

/** Snapshot of a project, from memory or IndexedDB. Null when never synced. */
export async function getSnapshot(projectId: string | null = activeProjectId): Promise<ProjectSnapshot | null> {
  if (!projectId || !store) return null
  const cached = snapshots.get(projectId)
  if (cached) return cached
  const pending = pendingLoads.get(projectId)
  if (pending) return pending

  const owner = store
  const load = owner.load(projectId)
    .then(snapshot => {
      if (snapshot && store === owner) snapshots.set(projectId, snapshot)
      return snapshot
    })
    .catch(err => {
      logger.error('Failed to read offline snapshot', err)
      return null
    })
    .finally(() => pendingLoads.delete(projectId))
  pendingLoads.set(projectId, load)
  return load
}

/**
 * Download the project and replace its snapshot. Concurrent calls for the
 * same project share one sync. On failure the previous snapshot is kept.
 */
export function syncProject(projectId: string | null = activeProjectId): Promise<ProjectSnapshot> {
  if (!projectId) return Promise.reject(new Error('No active project to sync'))
  if (!store || !currentUserId) return Promise.reject(new Error('Not signed in'))
  if (isOfflineMode()) return Promise.reject(new OfflineDataUnavailableError('You are offline. Connect to sync.'))

  const pending = pendingSyncs.get(projectId)
  if (pending) return pending

  const owner = store
  const userId = currentUserId
  const isActive = () => projectId === activeProjectId
  if (isActive()) {
    isSyncing.value = true
    syncProgress.value = null
  }

  const sync = (async () => {
    try {
      const snapshot = await fetchProjectSnapshot(supabase, projectId, userId, progress => {
        if (isActive()) syncProgress.value = progress
      })
      if (store !== owner) throw new Error('Signed out during sync')
      await owner.save(snapshot)
      snapshots.set(projectId, snapshot)
      if (isActive()) {
        refreshLastSynced(snapshot)
        lastSyncError.value = null
      }
      return snapshot
    } catch (err) {
      if (isActive()) lastSyncError.value = err instanceof Error ? err.message : 'Sync failed'
      throw err
    } finally {
      pendingSyncs.delete(projectId)
      if (isActive()) {
        isSyncing.value = false
        syncProgress.value = null
      }
    }
  })()
  pendingSyncs.set(projectId, sync)
  return sync
}

/** Sync the active project in the background if it was never synced or is stale. */
export async function autoSyncIfStale(maxAgeMs = AUTO_SYNC_MAX_AGE_MS): Promise<void> {
  if (!activeProjectId || !store || isOfflineMode() || !autoSyncAllowed()) return
  const snapshot = await getSnapshot(activeProjectId)
  const age = snapshot ? Date.now() - new Date(snapshot.syncedAt).getTime() : Infinity
  if (age < maxAgeMs) return
  await syncProject(activeProjectId).catch(err => logger.warn('Background sync failed', err))
}

/** A write succeeded: refresh the snapshot shortly after (debounced). */
export function markSnapshotDirty(): void {
  if (!activeProjectId || !store) return
  if (dirtyTimer) clearTimeout(dirtyTimer)
  dirtyTimer = setTimeout(() => {
    dirtyTimer = null
    if (isOfflineMode() || !autoSyncAllowed()) return
    syncProject().catch(err => logger.warn('Background re-sync after write failed', err))
  }, DIRTY_RESYNC_DELAY_MS)
}

export interface ReadThroughOptions {
  /** Project whose snapshot answers offline (defaults to the active project) */
  projectId?: string | null
}

/**
 * Read from the network, fall back to the local snapshot.
 *
 * - Offline mode: answer from the snapshot, or throw OfflineDataUnavailableError.
 * - Online: run `remote`. On a network failure (or after REMOTE_READ_TIMEOUT_MS
 *   when a snapshot exists) answer from the snapshot instead.
 * - Server errors (RLS, validation…) are always rethrown, never hidden.
 */
export async function readThrough<T>(
  remote: () => Promise<T>,
  local: (snapshot: ProjectSnapshot) => T,
  options: ReadThroughOptions = {},
): Promise<T> {
  const projectId = options.projectId === undefined ? activeProjectId : options.projectId

  if (isOfflineMode()) {
    const snapshot = await getSnapshot(projectId)
    if (!snapshot) throw new OfflineDataUnavailableError()
    return local(snapshot)
  }

  // Start the network request first; the snapshot loads in parallel.
  // The no-op catch keeps an early (or post-timeout) rejection from being
  // reported as unhandled; the error is still handled below.
  const remotePromise = remote()
  remotePromise.catch(() => {})
  const snapshot = await getSnapshot(projectId)
  try {
    return snapshot ? await withNetworkTimeout(remotePromise, REMOTE_READ_TIMEOUT_MS) : await remotePromise
  } catch (err) {
    if (snapshot && isNetworkError(err)) {
      logger.warn('Network read failed, using offline snapshot', err)
      return local(snapshot)
    }
    throw err
  }
}

let initialized = false

/** Wire connectivity events. Call once at startup. */
export function initOfflineData(): void {
  if (initialized) return
  initialized = true
  onDataWritten(markSnapshotDirty)
  window.addEventListener('online', () => {
    autoSyncIfStale().catch(err => logger.warn('Auto-sync on reconnect failed', err))
  })
}

/** Test hook: replace the storage adapter. */
export function __setSnapshotStoreFactory(factory: (userId: string) => SnapshotStore): void {
  createStore = factory
}
