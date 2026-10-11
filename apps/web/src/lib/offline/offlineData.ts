import { ref } from 'vue'
import {
  applySnapshotPatch,
  DexieSnapshotStore,
  fetchProjectSnapshot,
  OfflineDataUnavailableError,
  type ProjectSnapshot,
  type SnapshotPatch,
  type SnapshotStore,
  type SyncProgress,
} from '@livenotes/shared/offline'
import { supabase } from '@/lib/supabase'
import { logger } from '@/utils/logger'
import { isOfflineMode } from './offlineState'

/**
 * Local copy of each project (web: IndexedDB), the only source of project
 * reads. See livenotes-documentation/app/offline-data-layer-spec.md.
 *
 * - Reads always come from the local copy (ADR-009). Without a copy yet, the
 *   project is downloaded first.
 * - The Sync button is the only thing that refreshes a copy (ADR-010).
 * - Writes go to the server, then patch the copy (`projectWrites.ts`, ADR-012).
 * - Local data stays on logout; deleting it is a user action (ADR-014).
 */

const LEGACY_LAST_SYNCED_PREFIX = 'livenotes-last-synced-'

let createStore: (userId: string) => SnapshotStore = userId => new DexieSnapshotStore(userId)

let currentUserId: string | null = null
let store: SnapshotStore | null = null
let activeProjectId: string | null = null
const snapshots = new Map<string, ProjectSnapshot>()
const pendingLoads = new Map<string, Promise<ProjectSnapshot | null>>()
const pendingSyncs = new Map<string, Promise<ProjectSnapshot>>()

// Reactive state for the UI (refers to the active project)
export const isSyncing = ref(false)
export const syncProgress = ref<SyncProgress | null>(null)
export const lastSyncedAt = ref<Date | null>(null)
export const lastSyncError = ref<string | null>(null)
/** Server version the active project's copy matches; null without a copy */
export const localVersion = ref<number | null>(null)

function refreshActiveState(snapshot: ProjectSnapshot | null): void {
  lastSyncedAt.value = snapshot ? new Date(snapshot.syncedAt) : null
  localVersion.value = snapshot ? snapshot.version : null
}

export function getOfflineActiveProjectId(): string | null {
  return activeProjectId
}

export function getOfflineUserId(): string | null {
  return currentUserId
}

/** Switch the local database to `userId` (null when signed out). Other users' data is kept. */
export function setOfflineUser(userId: string | null): void {
  if (userId === currentUserId) return
  store?.close()
  snapshots.clear()
  pendingLoads.clear()
  refreshActiveState(null)
  currentUserId = userId
  store = userId ? createStore(userId) : null
  if (userId) removeLegacyLastSyncedKeys()
}

export function setOfflineActiveProject(projectId: string | null): void {
  if (projectId === activeProjectId) return
  activeProjectId = projectId
  refreshActiveState(null)
  if (projectId) {
    getSnapshot(projectId)
      // A copy downloaded meanwhile wins over the (possibly empty) result of this load
      .then(snapshot => { if (activeProjectId === projectId) refreshActiveState(snapshots.get(projectId) ?? snapshot) })
      .catch(err => logger.warn('Could not load the local copy', err))
  }
}

/** "Delete local data": remove this user's local copies on this device. */
export async function deleteLocalData(): Promise<void> {
  if (!store || !currentUserId) return
  const userId = currentUserId
  const previous = store
  store = null
  snapshots.clear()
  pendingLoads.clear()
  refreshActiveState(null)
  try {
    await previous.destroy()
  } catch (err) {
    logger.error('Failed to delete local data', err)
    throw err
  } finally {
    // Reopen an empty database for the same user (unless they switched meanwhile)
    if (currentUserId === userId && !store) store = createStore(userId)
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

/** Local copy of a project, from memory or IndexedDB. Null when never synced. */
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
      logger.error('Failed to read the local copy', err)
      return null
    })
    .finally(() => pendingLoads.delete(projectId))
  pendingLoads.set(projectId, load)
  return load
}

async function saveSnapshot(owner: SnapshotStore, snapshot: ProjectSnapshot): Promise<void> {
  await owner.save(snapshot)
  if (store !== owner) return
  snapshots.set(snapshot.projectId, snapshot)
  if (snapshot.projectId === activeProjectId) refreshActiveState(snapshot)
}

/**
 * Download the project and replace its local copy. Concurrent calls for the
 * same project share one sync. On failure the previous copy is kept.
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
      await saveSnapshot(owner, snapshot)
      if (isActive()) lastSyncError.value = null
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

/** Apply a change to a project's local copy (no-op without a copy). */
export async function patchLocalCopy(projectId: string, patch: SnapshotPatch): Promise<void> {
  const owner = store
  if (!owner) return
  const snapshot = await getSnapshot(projectId)
  if (!snapshot) return
  await saveSnapshot(owner, applySnapshotPatch(snapshot, patch))
}

/** Drop one project's local copy (e.g. the project was deleted). */
export async function removeLocalCopy(projectId: string): Promise<void> {
  snapshots.delete(projectId)
  if (projectId === activeProjectId) refreshActiveState(null)
  await store?.remove(projectId)
}

/** The copy is known to be behind the server (e.g. a patch failed): the staleness check will ask for a sync. */
export async function markLocalCopyOutdated(projectId: string): Promise<void> {
  await patchLocalCopy(projectId, { version: -1 }).catch(err => logger.error('Could not mark the local copy outdated', err))
}

export interface ReadLocalOptions {
  /** Project to read (defaults to the active project) */
  projectId?: string | null
}

/**
 * Read from the project's local copy (ADR-009). Without a copy yet, download
 * it first; offline without a copy, throw OfflineDataUnavailableError.
 */
export async function readLocal<T>(
  select: (snapshot: ProjectSnapshot) => T,
  options: ReadLocalOptions = {},
): Promise<T> {
  const projectId = options.projectId === undefined ? activeProjectId : options.projectId
  if (!projectId) throw new Error('No active project')

  const snapshot = await getSnapshot(projectId)
  if (snapshot) return select(snapshot)
  if (isOfflineMode()) throw new OfflineDataUnavailableError()
  return select(await syncProject(projectId))
}

/** Test hook: replace the storage adapter. */
export function __setSnapshotStoreFactory(factory: (userId: string) => SnapshotStore): void {
  createStore = factory
}
