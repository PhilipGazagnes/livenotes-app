import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProjectSnapshot, SnapshotStore } from '@livenotes/shared/offline'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))

const fetchProjectSnapshot = vi.fn()
vi.mock('@livenotes/shared/offline', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@livenotes/shared/offline')>()
  return {
    ...actual,
    fetchProjectSnapshot: (...args: unknown[]) => fetchProjectSnapshot(...args),
  }
})

const { OfflineDataUnavailableError, SNAPSHOT_SCHEMA_VERSION } = await import('@livenotes/shared/offline')
const offline = await import('../offlineData')
const { setForceOffline } = await import('../offlineState')

/** In-memory SnapshotStore per user, shared across instances like a real DB. */
const databases = new Map<string, Map<string, ProjectSnapshot>>()
const destroyed: string[] = []
function memoryStore(userId: string): SnapshotStore {
  const db = () => {
    if (!databases.has(userId)) databases.set(userId, new Map())
    return databases.get(userId)!
  }
  return {
    load: async id => db().get(id) ?? null,
    save: async s => { db().set(s.projectId, s) },
    remove: async id => { db().delete(id) },
    stats: async () => ({ projects: db().size, bytes: 0 }),
    close: () => {},
    destroy: async () => { databases.delete(userId); destroyed.push(userId) },
  }
}

function snapshot(projectId: string, marker: string, version = 1): ProjectSnapshot {
  return {
    projectId, schemaVersion: SNAPSHOT_SCHEMA_VERSION, syncedAt: new Date().toISOString(), version,
    project: null, role: null, librarySongs: [], songs: [], songArtists: [], artists: [],
    librarySongTags: [], notes: [], tags: [{ id: marker, project_id: projectId, name: marker, created_at: null }],
    lists: [], listItems: [],
  }
}

const marker = (s: ProjectSnapshot) => s.tags[0].name

function goOnline(online: boolean) {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(online)
}

beforeEach(() => {
  databases.clear()
  destroyed.length = 0
  fetchProjectSnapshot.mockReset()
  offline.__setSnapshotStoreFactory(memoryStore)
  setForceOffline(false)
  goOnline(true)
  offline.setOfflineUser('u1')
  offline.setOfflineActiveProject('p1')
})

afterEach(() => {
  vi.restoreAllMocks()
  offline.setOfflineActiveProject(null)
  offline.setOfflineUser(null)
})

async function seed(projectId = 'p1', name = 'local', version = 1) {
  fetchProjectSnapshot.mockResolvedValueOnce(snapshot(projectId, name, version))
  await offline.syncProject(projectId)
}

describe('readLocal (ADR-009)', () => {
  it('reads the local copy without touching the network', async () => {
    await seed()
    await expect(offline.readLocal(marker)).resolves.toBe('local')
    expect(fetchProjectSnapshot).toHaveBeenCalledTimes(1)
  })

  it('without a copy, downloads the project first', async () => {
    fetchProjectSnapshot.mockResolvedValueOnce(snapshot('p1', 'downloaded'))
    await expect(offline.readLocal(marker)).resolves.toBe('downloaded')
    // the next read is local
    await expect(offline.readLocal(marker)).resolves.toBe('downloaded')
    expect(fetchProjectSnapshot).toHaveBeenCalledTimes(1)
  })

  it('offline without a copy: OfflineDataUnavailableError', async () => {
    goOnline(false)
    await expect(offline.readLocal(marker)).rejects.toBeInstanceOf(OfflineDataUnavailableError)
    expect(fetchProjectSnapshot).not.toHaveBeenCalled()
  })

  it('force offline counts as offline', async () => {
    setForceOffline(true)
    await expect(offline.readLocal(marker)).rejects.toBeInstanceOf(OfflineDataUnavailableError)
  })

  it('reads another project by id', async () => {
    await seed('p2', 'other')
    await expect(offline.readLocal(marker, { projectId: 'p2' })).resolves.toBe('other')
  })
})

describe('syncProject', () => {
  it('replaces the copy and exposes its version', async () => {
    await seed('p1', 'first', 4)
    expect(offline.localVersion.value).toBe(4)
    await seed('p1', 'second', 6)
    await expect(offline.readLocal(marker)).resolves.toBe('second')
    expect(offline.localVersion.value).toBe(6)
  })

  it('keeps the previous copy when a sync fails', async () => {
    await seed('p1', 'first')
    fetchProjectSnapshot.mockRejectedValueOnce(new Error('Sync failed while loading setlists'))
    await expect(offline.syncProject()).rejects.toThrow('setlists')
    expect(offline.lastSyncError.value).toContain('setlists')
    await expect(offline.readLocal(marker)).resolves.toBe('first')
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

describe('local patches (ADR-012)', () => {
  it('patchLocalCopy applies the change and the new version', async () => {
    await seed('p1', 'local', 3)
    await offline.patchLocalCopy('p1', { tags: [{ id: 't9', project_id: 'p1', name: 'new', created_at: null }], version: 4 })
    const tags = await offline.readLocal(s => s.tags.map(t => t.name))
    expect(tags).toEqual(['local', 'new'])
    expect(offline.localVersion.value).toBe(4)
    // persisted, not only in memory
    expect(databases.get('u1')!.get('p1')!.version).toBe(4)
  })

  it('markLocalCopyOutdated sets version -1', async () => {
    await seed('p1', 'local', 3)
    await offline.markLocalCopyOutdated('p1')
    expect(offline.localVersion.value).toBe(-1)
  })

  it('removeLocalCopy drops one project', async () => {
    await seed('p1')
    await seed('p2')
    await offline.removeLocalCopy('p1')
    expect(offline.localVersion.value).toBeNull()
    expect(databases.get('u1')!.has('p1')).toBe(false)
    expect(databases.get('u1')!.has('p2')).toBe(true)
  })
})

describe('users and local data (ADR-014)', () => {
  it('a different user does not see the previous user copy', async () => {
    await seed()
    offline.setOfflineUser('u2')
    goOnline(false)
    await expect(offline.readLocal(marker)).rejects.toBeInstanceOf(OfflineDataUnavailableError)
  })

  it('switching users keeps the previous user data on the device', async () => {
    await seed()
    offline.setOfflineUser('u2')
    offline.setOfflineUser('u1')
    goOnline(false)
    await expect(offline.readLocal(marker)).resolves.toBe('local')
    expect(destroyed).toEqual([])
  })

  it('deleteLocalData deletes only the current user data, and the store keeps working', async () => {
    await seed()
    offline.setOfflineUser('u2')
    await seed('p1', 'u2-copy')
    await offline.deleteLocalData()
    expect(destroyed).toEqual(['u2'])
    expect(offline.lastSyncedAt.value).toBeNull()
    await seed('p1', 'after')
    await expect(offline.readLocal(marker)).resolves.toBe('after')
    offline.setOfflineUser('u1')
    await expect(offline.readLocal(marker)).resolves.toBe('local')
  })

  it('removes legacy last-synced keys', async () => {
    offline.setOfflineUser(null)
    localStorage.setItem('livenotes-last-synced-p1', '2026-01-01')
    offline.setOfflineUser('u1')
    expect(localStorage.getItem('livenotes-last-synced-p1')).toBeNull()
  })
})
