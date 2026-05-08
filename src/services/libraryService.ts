import { supabase } from '@/lib/supabase'
import type { LibrarySong, LibrarySongWithDetails, Note, SongV2, ArtistV2, Tag, List } from '@/types/database'

interface RawArtistV2Join { position: number; artist: ArtistV2 | null }
interface RawSongV2Row extends SongV2 { artists: RawArtistV2Join[] }
interface RawTagJoin { tag: Tag | null }
interface RawListJoin { list: List | null }
interface RawLibrarySongRow extends LibrarySong {
  song: RawSongV2Row | null
  tags: RawTagJoin[]
  notes: unknown[]
  lists: RawListJoin[]
}

function mapArtistsV2(rows: RawArtistV2Join[]): Array<ArtistV2 & { position: number }> {
  return rows
    .filter((sa): sa is { position: number; artist: ArtistV2 } => sa.artist != null)
    .map((sa) => ({ ...sa.artist, position: sa.position }))
    .sort((a, b) => a.position - b.position)
}

function transformLibrarySong(ls: RawLibrarySongRow): LibrarySongWithDetails {
  return {
    ...ls,
    song: {
      ...ls.song!,
      artists: mapArtistsV2(ls.song?.artists ?? []),
    },
    tags: ls.tags.map((lst) => lst.tag).filter((t): t is Tag => t != null),
    notes: (ls.notes ?? []) as unknown as Note[],
    lists: ls.lists.map((li) => li.list).filter((l): l is List => l != null),
  }
}

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

  return transformLibrarySong(data as unknown as RawLibrarySongRow)
}

const LIBRARY_SONG_SELECT = `
  *,
  song:songs_v2!library_songs_song_id_fkey(
    id,
    title,
    artists:song_artists_v2(
      position,
      artist:artists_v2(
        id,
        name
      )
    )
  ),
  tags:library_song_tags(
    tag:tags(
      id,
      name
    )
  ),
  lists:list_items(
    list:lists(
      id,
      name
    )
  )
`

export async function fetchLibrarySongs(projectId: string): Promise<LibrarySongWithDetails[]> {
  const { data, error } = await supabase
    .from('library_songs')
    .select(LIBRARY_SONG_SELECT)
    .eq('project_id', projectId)
    .order('added_at', { ascending: false })
  if (error) throw error
  return (data || []).map((row) => transformLibrarySong(row as unknown as RawLibrarySongRow))
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
  const { error: rpcError } = await supabase.rpc('increment_song_popularity', { song_id: songId })
  if (rpcError) throw rpcError
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
