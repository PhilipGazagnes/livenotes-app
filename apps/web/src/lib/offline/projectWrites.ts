import {
  fetchLibrarySongAggregates,
  fetchListAggregates,
  fetchProjectRow,
  fetchProjectStatus,
  fetchProjectTags,
  type SnapshotPatch,
} from '@livenotes/shared/offline'
import type { ArtistV2 } from '@livenotes/shared/types'
import { supabase } from '@/lib/supabase'
import { I18N } from '@/constants/i18n'
import { logger } from '@/utils/logger'
import {
  getOfflineActiveProjectId,
  getOfflineUserId,
  markLocalCopyOutdated,
  patchLocalCopy,
} from './offlineData'
import { setProjectStatus } from './projectStatus'

/**
 * Writes to the active project (ADR-012): the server first, then the local
 * copy is patched with the rows the server now holds, and moved to the
 * server's new version. A refused write leaves the copy untouched.
 */

/** What a write changed, so the matching rows can be re-read and patched locally. */
export interface LocalRefresh {
  librarySongIds?: string[]
  removedLibrarySongIds?: string[]
  listIds?: string[]
  removedListIds?: string[]
  /** Re-read the project's tags */
  tags?: boolean
  removedTagIds?: string[]
  /** Catalog artists changed by the write */
  artists?: ArtistV2[]
  /** Re-read the project row (settings) */
  project?: boolean
}

/** Thrown before a write the user can't make right now (ADR-011, ADR-013). */
export class EditNotAllowedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EditNotAllowedError'
  }
}

let writeGuard: () => void = () => {}
let writeCommitted: () => void = () => {}
let editingLost: () => void = () => {}

/** Rule checked before every project write (set by the edit-mode store). */
export function setWriteGuard(guard: () => void): void {
  writeGuard = guard
}

/** Called after every successful project write (edit activity). */
export function onWriteCommitted(listener: () => void): void {
  writeCommitted = listener
}

/** Called when a write is refused because the user no longer holds the editing flag. */
export function onEditingLost(listener: () => void): void {
  editingLost = listener
}

function unique(ids: string[] | undefined): string[] {
  return [...new Set(ids ?? [])]
}

/**
 * Run a write to the active project, then patch its local copy.
 * `refresh` describes the changed rows (or derives them from the write's result).
 */
export async function commitWrite<T>(
  write: () => Promise<T>,
  refresh: LocalRefresh | ((result: T) => LocalRefresh),
): Promise<T> {
  writeGuard()
  const projectId = getOfflineActiveProjectId()
  if (projectId) await ensureStillEditing(projectId)
  const result = await write()
  writeCommitted()
  if (projectId) await patchAfterWrite(projectId, typeof refresh === 'function' ? refresh(result) : refresh)
  return result
}

/**
 * The flag may have been released (admin, expiry) since the screen last
 * checked. The database would then silently ignore updates and deletes, so
 * check first and refuse the write instead of reporting a fake success.
 */
async function ensureStillEditing(projectId: string): Promise<void> {
  const status = await fetchProjectStatus(supabase, projectId)
  if (status?.editor?.userId === getOfflineUserId()) {
    setProjectStatus(projectId, status)
    return
  }
  editingLost()
  setProjectStatus(projectId, status)
  throw new EditNotAllowedError(I18N.EDIT_MODE.NOT_SAVED_LOST)
}

async function patchAfterWrite(projectId: string, refresh: LocalRefresh): Promise<void> {
  try {
    const librarySongIds = unique(refresh.librarySongIds)
    const listIds = unique(refresh.listIds)
    const [librarySongs, lists, tags, project, status] = await Promise.all([
      fetchLibrarySongAggregates(supabase, librarySongIds),
      fetchListAggregates(supabase, listIds),
      refresh.tags ? fetchProjectTags(supabase, projectId) : Promise.resolve(undefined),
      refresh.project ? fetchProjectRow(supabase, projectId) : Promise.resolve(undefined),
      fetchProjectStatus(supabase, projectId),
    ])
    setProjectStatus(projectId, status)

    // Only the flag holder can change the project, so while we hold it the
    // server's new version is our copy plus this write. Otherwise someone
    // else may have changed it too: ask for a sync instead.
    if (!status || status.editor?.userId !== getOfflineUserId()) {
      await markLocalCopyOutdated(projectId)
      return
    }

    const returnedLs = new Set(librarySongs.map(ls => ls.id))
    const returnedLists = new Set(lists.map(l => l.id))
    const patch: SnapshotPatch = {
      librarySongs,
      removedLibrarySongIds: [
        ...unique(refresh.removedLibrarySongIds),
        ...librarySongIds.filter(id => !returnedLs.has(id)),
      ],
      lists,
      removedListIds: [...unique(refresh.removedListIds), ...listIds.filter(id => !returnedLists.has(id))],
      tags,
      removedTagIds: refresh.removedTagIds,
      artists: refresh.artists,
      version: status.version,
    }
    if (project !== undefined) patch.project = project
    await patchLocalCopy(projectId, patch)
  } catch (err) {
    logger.error('Could not update the local copy after a write', err)
    await markLocalCopyOutdated(projectId)
  }
}
