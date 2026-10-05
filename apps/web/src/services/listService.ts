import { supabase } from '@/lib/supabase'
import type { List, ListWithItems } from '@livenotes/shared/types'
import {
  selectListItemCount,
  selectLists,
  selectListSongCounts,
  selectListWithItems,
} from '@livenotes/shared/offline'
import { readLocal } from '@/lib/offline/offlineData'
import { commitWrite } from '@/lib/offline/projectWrites'

export function fetchLists(projectId: string): Promise<List[]> {
  return readLocal(selectLists, { projectId })
}

export function fetchListWithItems(listId: string): Promise<ListWithItems | null> {
  return readLocal(snapshot => {
    const list = selectListWithItems(snapshot, listId)
    if (!list) throw new Error('This setlist is not in the local copy. Sync and try again.')
    return list
  })
}

export function insertList(
  projectId: string,
  name: string,
  description: string | undefined,
  userId: string
): Promise<List> {
  return commitWrite(
    async () => {
      const { data, error } = await supabase
        .from('lists')
        .insert({
          project_id: projectId,
          name: name.trim(),
          description: description?.trim(),
          created_by: userId,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    list => ({ listIds: [list.id] }),
  )
}

export function updateList(
  listId: string,
  updates: Partial<Pick<List, 'name' | 'description'>>
): Promise<List> {
  const clean: Partial<Pick<List, 'name' | 'description'>> = {}
  if (updates.name !== undefined) clean.name = updates.name.trim()
  if (updates.description !== undefined) clean.description = updates.description?.trim() ?? null

  return commitWrite(
    async () => {
      const { data, error } = await supabase
        .from('lists')
        .update(clean)
        .eq('id', listId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    { listIds: [listId] },
  )
}

export function deleteList(listId: string): Promise<void> {
  return bulkDeleteLists([listId])
}

export function bulkDeleteLists(listIds: string[]): Promise<void> {
  return commitWrite(
    async () => {
      const { error } = await supabase.from('lists').delete().in('id', listIds)
      if (error) throw error
    },
    { removedListIds: listIds },
  )
}

export async function fetchListMaxPosition(listId: string): Promise<number> {
  const { data, error } = await supabase
    .from('list_items')
    .select('position')
    .eq('list_id', listId)
    .order('position', { ascending: false })
    .limit(1)
  if (error) throw error
  return data.length > 0 ? data[0].position + 1 : 0
}

export async function fetchExistingLibrarySongIdsInList(listId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('list_items')
    .select('library_song_id')
    .eq('list_id', listId)
    .not('library_song_id', 'is', null)
  if (error) throw error
  return new Set((data ?? []).map((row: { library_song_id: string | null }) => row.library_song_id).filter((id): id is string => id !== null))
}

/** Append library songs to a setlist, starting at `startPosition`. */
export function insertLibrarySongsToList(
  listId: string,
  librarySongIds: string[],
  startPosition: number
): Promise<void> {
  return commitWrite(
    async () => {
      const { error } = await supabase
        .from('list_items')
        .insert(librarySongIds.map((librarySongId, i) => ({
          list_id: listId,
          library_song_id: librarySongId,
          position: startPosition + i,
          type: 'song',
        })))
      if (error) throw error
    },
    { listIds: [listId] },
  )
}

export function deleteLibrarySongFromList(listId: string, librarySongId: string): Promise<void> {
  return commitWrite(
    async () => {
      const { error } = await supabase
        .from('list_items')
        .delete()
        .eq('list_id', listId)
        .eq('library_song_id', librarySongId)
      if (error) throw error
    },
    { listIds: [listId] },
  )
}

export function fetchListItemCount(listId: string): Promise<number> {
  return readLocal(snapshot => selectListItemCount(snapshot, listId))
}

export function fetchListSongCounts(listIds: string[]): Promise<Map<string, number>> {
  return readLocal(snapshot => selectListSongCounts(snapshot, listIds))
}

export function reorderListItems(listId: string, itemPositions: { id: string; position: number }[]): Promise<void> {
  return commitWrite(
    async () => {
      const { error } = await supabase.rpc('update_list_item_positions', {
        item_positions: itemPositions,
      })
      if (error) throw error
    },
    { listIds: [listId] },
  )
}
