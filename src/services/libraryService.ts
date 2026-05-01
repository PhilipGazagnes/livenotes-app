import { supabase } from '@/lib/supabase'
import type { LibrarySong, LibrarySongWithDetails, Note } from '@/types/database'

export async function fetchLibrarySongWithDetails(id: string): Promise<LibrarySongWithDetails> {
  const { data, error } = await supabase
    .from('library_songs')
    .select(`
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
      notes:notes(*),
      lists:list_items(
        list:lists(*)
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  if (!data) throw new Error('Library song not found')

  return {
    ...data,
    song: {
      ...data.song,
      artists: data.song.artists
        ?.map((sa: any) => ({
          ...sa.artist,
          position: sa.position,
        }))
        .filter(Boolean)
        .sort((a: any, b: any) => a.position - b.position) ?? [],
    },
    tags: data.tags?.map((lst: any) => lst.tag).filter(Boolean) ?? [],
    notes: (data.notes ?? []) as unknown as Note[],
    lists: data.lists?.map((li: any) => li.list).filter(Boolean) ?? [],
  }
}

const LIBRARY_SONG_SELECT = `
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
  notes:notes(
    id,
    type,
    title,
    content,
    data,
    created_at,
    updated_at,
    display_order,
    is_public,
    is_shareable
  ),
  lists:list_items(
    list:lists(*)
  )
`

function transformLibrarySong(ls: any): LibrarySongWithDetails {
  return {
    ...ls,
    song: {
      ...ls.song,
      artists: ls.song.artists
        ?.map((sa: any) => ({ ...sa.artist, position: sa.position }))
        .filter(Boolean)
        .sort((a: any, b: any) => a.position - b.position) ?? [],
    },
    tags: ls.tags?.map((lst: any) => lst.tag).filter(Boolean) ?? [],
    notes: (ls.notes ?? []) as unknown as Note[],
    lists: ls.lists?.map((li: any) => li.list).filter(Boolean) ?? [],
  }
}

export async function fetchLibrarySongs(projectId: string): Promise<LibrarySongWithDetails[]> {
  const { data, error } = await supabase
    .from('library_songs')
    .select(LIBRARY_SONG_SELECT)
    .eq('project_id', projectId)
    .order('added_at', { ascending: false })
  if (error) throw error
  return (data || []).map(transformLibrarySong)
}

export async function addToLibrary(
  projectId: string,
  songId: string,
  userId: string
): Promise<LibrarySong> {
  const { data, error } = await supabase
    .from('library_songs')
    .insert({ project_id: projectId, song_id: songId, added_by: userId })
    .select()
    .single()
  if (error) throw error
  await (supabase as any).rpc('increment_song_popularity', { song_id: songId })
  return data
}

export async function removeFromLibrary(librarySongId: string): Promise<void> {
  const { error } = await supabase
    .from('library_songs')
    .delete()
    .eq('id', librarySongId)
  if (error) throw error
}

export async function updateLibrarySong(
  librarySongId: string,
  updates: { custom_title?: string; custom_notes?: string }
): Promise<void> {
  const { error } = await supabase
    .from('library_songs')
    .update(updates)
    .eq('id', librarySongId)
  if (error) throw error
}
