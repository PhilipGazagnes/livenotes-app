import { supabase } from '@/lib/supabase'
import type { List, ListWithItems } from '@/types/database'

const LIST_COLUMNS = 'id, project_id, name, description, created_at, updated_at, created_by'

export async function fetchLists(projectId: string): Promise<List[]> {
  const { data, error } = await supabase
    .from('lists')
    .select(LIST_COLUMNS)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchListWithItems(listId: string): Promise<ListWithItems | null> {
  const { data: listData, error: listError } = await supabase
    .from('lists')
    .select(LIST_COLUMNS)
    .eq('id', listId)
    .single()
  if (listError) throw listError

  const { data: itemsData, error: itemsError } = await supabase
    .from('list_items')
    .select(`
      *,
      library_song:library_songs!list_items_library_song_id_fkey(
        *,
        song:songs_v2!library_songs_song_id_fkey(
          *,
          artists:song_artists_v2(
            position,
            artist:artists_v2(*)
          )
        ),
        tags:library_song_tags(
          tag:tags(*)
        ),
        lists:list_items(
          list:lists(*)
        )
      )
    `)
    .eq('list_id', listId)
    .order('position', { ascending: true })
  if (itemsError) throw itemsError

  const transformedItems = itemsData?.map(item => ({
    ...item,
    song: item.library_song?.song ? {
      ...item.library_song.song,
      artists: item.library_song.song.artists
        ?.map((sa: any) => ({ ...sa.artist, position: sa.position }))
        .sort((a: any, b: any) => a.position - b.position) ?? [],
      tags: item.library_song.tags?.map((lst: any) => lst.tag).filter(Boolean) ?? [],
      lists: item.library_song.lists?.map((li: any) => li.list).filter(Boolean) ?? [],
    } : null,
  })) || []

  return {
    ...listData,
    items: transformedItems as unknown as ListWithItems['items'],
  }
}

export async function insertList(
  projectId: string,
  name: string,
  description: string | undefined,
  userId: string
): Promise<List> {
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
}

export async function updateList(
  listId: string,
  updates: Partial<Pick<List, 'name' | 'description'>>
): Promise<List> {
  const clean: Partial<Pick<List, 'name' | 'description'>> = {}
  if (updates.name !== undefined) clean.name = updates.name.trim()
  if (updates.description !== undefined) clean.description = updates.description?.trim() ?? null

  const { data, error } = await supabase
    .from('lists')
    .update(clean)
    .eq('id', listId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteList(listId: string): Promise<void> {
  const { error } = await supabase.from('lists').delete().eq('id', listId)
  if (error) throw error
}

export async function bulkDeleteLists(listIds: string[]): Promise<void> {
  const { error } = await supabase.from('lists').delete().in('id', listIds)
  if (error) throw error
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

export async function insertLibrarySongToList(
  listId: string,
  librarySongId: string,
  position: number
): Promise<void> {
  const { error } = await supabase
    .from('list_items')
    .insert({ list_id: listId, library_song_id: librarySongId, position, type: 'song' })
  if (error) throw error
}

export async function insertSongToList(
  listId: string,
  songId: string,
  position: number
): Promise<void> {
  const { error } = await supabase
    .from('list_items')
    .insert({ list_id: listId, song_id: songId, position })
  if (error) throw error
}

export async function deleteLibrarySongFromList(listId: string, librarySongId: string): Promise<void> {
  const { error } = await supabase
    .from('list_items')
    .delete()
    .eq('list_id', listId)
    .eq('library_song_id', librarySongId)
  if (error) throw error
}

export async function deleteSongFromList(listId: string, songId: string): Promise<void> {
  const { error } = await supabase
    .from('list_items')
    .delete()
    .eq('list_id', listId)
    .eq('song_id', songId)
  if (error) throw error
}

export async function reorderListItems(itemPositions: { id: string; position: number }[]): Promise<void> {
  const { error } = await supabase.rpc('update_list_item_positions', {
    item_positions: itemPositions,
  })
  if (error) throw error
}
