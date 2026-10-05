import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProjectStatus } from '@livenotes/shared/offline'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))

const remote = {
  fetchLibrarySongAggregates: vi.fn(),
  fetchListAggregates: vi.fn(),
  fetchProjectTags: vi.fn(),
  fetchProjectRow: vi.fn(),
  fetchProjectStatus: vi.fn(),
}
vi.mock('@livenotes/shared/offline', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@livenotes/shared/offline')>()
  return {
    ...actual,
    fetchLibrarySongAggregates: (...a: unknown[]) => remote.fetchLibrarySongAggregates(...a),
    fetchListAggregates: (...a: unknown[]) => remote.fetchListAggregates(...a),
    fetchProjectTags: (...a: unknown[]) => remote.fetchProjectTags(...a),
    fetchProjectRow: (...a: unknown[]) => remote.fetchProjectRow(...a),
    fetchProjectStatus: (...a: unknown[]) => remote.fetchProjectStatus(...a),
  }
})

const offlineData = {
  getOfflineActiveProjectId: vi.fn(() => 'p1'),
  getOfflineUserId: vi.fn(() => 'u1'),
  patchLocalCopy: vi.fn(),
  markLocalCopyOutdated: vi.fn(),
}
vi.mock('../offlineData', () => offlineData)
vi.mock('../projectStatus', () => ({ setProjectStatus: vi.fn() }))

const { commitWrite, setWriteGuard, onWriteCommitted, EditNotAllowedError } = await import('../projectWrites')

function status(editorId: string | null, version = 8): ProjectStatus {
  return {
    version,
    lastChangedAt: null,
    lastChangedBy: null,
    editor: editorId ? { userId: editorId, name: 'X', since: null, expiresInSeconds: 900 } : null,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  remote.fetchLibrarySongAggregates.mockResolvedValue([])
  remote.fetchListAggregates.mockResolvedValue([])
  remote.fetchProjectStatus.mockResolvedValue(status('u1'))
  setWriteGuard(() => {})
  onWriteCommitted(() => {})
})

describe('commitWrite (ADR-012)', () => {
  it('refuses before writing when the guard says no', async () => {
    setWriteGuard(() => { throw new EditNotAllowedError('Start editing first') })
    const write = vi.fn()
    await expect(commitWrite(write, {})).rejects.toThrow('Start editing first')
    expect(write).not.toHaveBeenCalled()
  })

  it('a refused write leaves the local copy untouched', async () => {
    await expect(commitWrite(() => Promise.reject(new Error('RLS')), {})).rejects.toThrow('RLS')
    expect(offlineData.patchLocalCopy).not.toHaveBeenCalled()
    expect(offlineData.markLocalCopyOutdated).not.toHaveBeenCalled()
  })

  it('patches the copy with the re-read rows and the new version', async () => {
    const ls = { id: 'ls1', song: null, tags: [], notes: [] }
    remote.fetchLibrarySongAggregates.mockResolvedValue([ls])
    const committed = vi.fn()
    onWriteCommitted(committed)

    await expect(commitWrite(async () => 'ok', { librarySongIds: ['ls1', 'ls2'] })).resolves.toBe('ok')

    expect(committed).toHaveBeenCalledTimes(1)
    expect(remote.fetchLibrarySongAggregates).toHaveBeenCalledWith({}, ['ls1', 'ls2'])
    expect(offlineData.patchLocalCopy).toHaveBeenCalledWith('p1', expect.objectContaining({
      librarySongs: [ls],
      // ls2 was not returned: it no longer exists
      removedLibrarySongIds: ['ls2'],
      version: 8,
    }))
  })

  it('derives the refresh from the write result', async () => {
    await commitWrite(async () => ({ id: 'l9' }), list => ({ listIds: [list.id] }))
    expect(remote.fetchListAggregates).toHaveBeenCalledWith({}, ['l9'])
  })

  it('marks the copy outdated when we no longer hold the editing flag', async () => {
    remote.fetchProjectStatus.mockResolvedValue(status('u2'))
    await commitWrite(async () => 'ok', { librarySongIds: ['ls1'] })
    expect(offlineData.patchLocalCopy).not.toHaveBeenCalled()
    expect(offlineData.markLocalCopyOutdated).toHaveBeenCalledWith('p1')
  })

  it('marks the copy outdated when re-reading fails, but the write still succeeds', async () => {
    remote.fetchLibrarySongAggregates.mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(commitWrite(async () => 'ok', { librarySongIds: ['ls1'] })).resolves.toBe('ok')
    expect(offlineData.markLocalCopyOutdated).toHaveBeenCalledWith('p1')
  })
})
