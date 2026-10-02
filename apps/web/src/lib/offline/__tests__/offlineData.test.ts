import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProjectSnapshot, SnapshotStore } from '@livenotes/shared/offline'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))

const fetchProjectSnapshot = vi.fn()
vi.mock('@livenotes/shared/offline', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@livenotes/shared/offline')>()
  return {
    ...actual,
    fetchProjectSnapshot: (...args: unknown[]) => fetchProjectSnapshot(...args),
    deleteOtherUsersDatabases: vi.fn().mockResolvedValue(undefined),
  }
})

const { OfflineDataUnavailableError, SNAPSHOT_SCHEMA_VERSION } = await import('@livenotes/shared/offline')
const offline = await import('../offlineData')
const { setForceOffline } = await import('../offlineState')

/** In-memory SnapshotStore per user, shared across instances like a real DB. */
const databases = new Map<string, Map<string, ProjectSnapshot>>()
const destroyed: string[] = []
function memoryStore(userId: string): SnapshotStore {
  if (!databases.has(userId)) databases.set(userId, new Map())
  const db = () => databases.get(userId)!
  return {
    load: async id => db().get(id) ?? null,
    save: async s => { db().set(s.projectId, s) },
    remove: async id => { db().delete(id) },
    close: () => {},
    destroy: async () => { databases.delete(userId); destroyed.push(userId) },
  }
}

function snapshot(projectId: string, marker: string): ProjectSnapshot {
  return {
    projectId, schemaVersion: SNAPSHOT_SCHEMA_VERSION, syncedAt: new Date().toISOString(),
    project: null, role: null, librarySongs: [], songs: [], songArtists: [], artists: [],
    librarySongTags: [], notes: [], tags: [{ id: marker, project_id: projectId, name: marker, created_at: null }],
    lists: [], listItems: [],
  }
}

const marker = (s: ProjectSnapshot) => s.tags[0].name
const networkError = () => new TypeError('Failed to fetch')

function goOnline(online: boolean) {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(online)
}

beforeEach(async () => {
  databases.clear()
  destroyed.length = 0
  fetchProjectSnapshot.mockReset()
  offline.__setSnapshotStoreFactory(memoryStore)
  offline.setAutoSyncPolicy(() => true)
  setForceOffline(false)
  goOnline(true)
  offline.setOfflineUser('u1')
  offline.setOfflineActiveProject('p1')
})

afterEach(async () => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  await offline.clearOfflineData()
})

async function seed(projectId = 'p1', name = 'local') {
  fetchProjectSnapshot.mockResolvedValueOnce(snapshot(projectId, name))
  await offline.syncProject(projectId)
}

describe('readThrough', () => {
  it('online: returns the network result', async () => {
    await seed()
    const local = vi.fn()
    await expect(offline.readThrough(async () => 'remote', local)).resolves.toBe('remote')
    expect(local).not.toHaveBeenCalled()
  })

  it('offline: answers from the snapshot without calling the network', async () => {
    await seed()
    goOnline(false)
    const remote = vi.fn()
    await expect(offline.readThrough(remote, marker)).resolves.toBe('local')
    expect(remote).not.toHaveBeenCalled()
  })

  it('force offline mode behaves like offline', async () => {
    await seed()
    setForceOffline(true)
    const remote = vi.fn()
    await expect(offline.readThrough(remote, marker)).resolves.toBe('local')
    expect(remote).not.toHaveBeenCalled()
  })

  it('offline without snapshot: throws OfflineDataUnavailableError', async () => {
    goOnline(false)
    await expect(offline.readThrough(vi.fn(), marker)).rejects.toBeInstanceOf(OfflineDataUnavailableError)
  })

  it('network failure with a snapshot: falls back to the snapshot', async () => {
    await seed()
    await expect(offline.readThrough(() => Promise.reject(networkError()), marker)).resolves.toBe('local')
  })

  it('network failure without a snapshot: rethrows', async () => {
    await expect(offline.readThrough(() => Promise.reject(networkError()), marker)).rejects.toThrow('Failed to fetch')
  })

  it('server errors are never hidden, even with a snapshot', async () => {
    await seed()
    const rls = { message: 'permission denied for table tags', code: '42501' }
    await expect(offline.readThrough(() => Promise.reject(rls), marker)).rejects.toBe(rls)
  })

  it('slow network with a snapshot: answers from the snapshot after the timeout', async () => {
    await seed()
    vi.useFakeTimers()
    const never = new Promise<string>(() => {})
    const result = offline.readThrough(() => never, marker)
    await vi.advanceTimersByTimeAsync(offline.REMOTE_READ_TIMEOUT_MS)
    await expect(result).resolves.toBe('local')
  })

  it('uses the snapshot of the requested project', async () => {
    await seed('p1', 'one')
    await seed('p2', 'two')
    goOnline(false)
    await expect(offline.readThrough(vi.fn(), marker, { projectId: 'p2' })).resolves.toBe('two')
  })
})

describe('syncProject', () => {
  it('keeps the previous snapshot when a sync fails', async () => {
    await seed('p1', 'first')
    fetchProjectSnapshot.mockRejectedValueOnce(new Error('Sync failed while loading setlists'))
    await expect(offline.syncProject()).rejects.toThrow('setlists')

    expect(offline.lastSyncError.value).toContain('setlists')
    goOnline(false)
    await expect(offline.readThrough(vi.fn(), marker)).resolves.toBe('first')
  })

  it('coalesces concurrent syncs of the same project', async () => {
    fetchProjectSnapshot.mockResolvedValue(snapshot('p1', 'x'))
    await Promise.all([offline.syncProject(), offline.syncProject()])
    expect(fetchProjectSnapshot).toHaveBeenCalledTimes(1)
  })

  it('refuses to sync offline', async () => {
    goOnline(false)
    await expect(offline.syncProject()).rejects.toBeInstanceOf(OfflineDataUnavailableError)
    expect(fetchProjectSnapshot).not.toHaveBeenCalled()
  })

  it('updates lastSyncedAt for the active project', async () => {
    expect(offline.lastSyncedAt.value).toBeNull()
    await seed()
    expect(offline.lastSyncedAt.value).toBeInstanceOf(Date)
  })
})

describe('autoSyncIfStale', () => {
  it('syncs when there is no snapshot', async () => {
    fetchProjectSnapshot.mockResolvedValue(snapshot('p1', 'x'))
    await offline.autoSyncIfStale()
    expect(fetchProjectSnapshot).toHaveBeenCalledTimes(1)
  })

  it('respects the auto-sync policy (e.g. community project)', async () => {
    offline.setAutoSyncPolicy(() => false)
    await offline.autoSyncIfStale()
    expect(fetchProjectSnapshot).not.toHaveBeenCalled()
  })

  it('skips a fresh snapshot', async () => {
    await seed()
    await offline.autoSyncIfStale()
    expect(fetchProjectSnapshot).toHaveBeenCalledTimes(1)
  })
})

describe('markSnapshotDirty', () => {
  it('does not re-sync after writes when the policy forbids it', async () => {
    vi.useFakeTimers()
    offline.setAutoSyncPolicy(() => false)
    offline.markSnapshotDirty()
    await vi.advanceTimersByTimeAsync(offline.DIRTY_RESYNC_DELAY_MS)
    expect(fetchProjectSnapshot).not.toHaveBeenCalled()
  })

  it('debounces writes into one background re-sync', async () => {
    vi.useFakeTimers()
    fetchProjectSnapshot.mockResolvedValue(snapshot('p1', 'x'))
    offline.markSnapshotDirty()
    offline.markSnapshotDirty()
    await vi.advanceTimersByTimeAsync(offline.DIRTY_RESYNC_DELAY_MS - 1)
    expect(fetchProjectSnapshot).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(fetchProjectSnapshot).toHaveBeenCalledTimes(1)
  })
})

describe('users and sign-out', () => {
  it('a different user does not see the previous user snapshot', async () => {
    await seed()
    offline.setOfflineUser('u2')
    offline.setOfflineActiveProject('p1')
    goOnline(false)
    await expect(offline.readThrough(vi.fn(), marker)).rejects.toBeInstanceOf(OfflineDataUnavailableError)
  })

  it('clearOfflineData deletes the user database', async () => {
    await seed()
    await offline.clearOfflineData()
    expect(destroyed).toContain('u1')
    expect(offline.lastSyncedAt.value).toBeNull()
  })

  it('removes legacy last-synced keys', async () => {
    localStorage.setItem('livenotes-last-synced-p1', '2026-01-01')
    await offline.clearOfflineData()
    expect(localStorage.getItem('livenotes-last-synced-p1')).toBeNull()
  })
})
