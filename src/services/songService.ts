import { supabase } from '@/lib/supabase'
import type { TablesInsert } from '@/types/supabase'
import type { Song, SongWithTags, Tag, List, Artist, ArtistWithPosition } from '@/types/database'

const SONG_SELECT = `
  *,
  tags:song_tags(
    tag:tags(*)
  ),
  lists:list_items(
    list:lists(*)
  ),
  artists:song_artists(
    position,
    artist:artists(*)
  )
`

interface RawTagJoin { tag: Tag | null }
interface RawListJoin { list: List | null }
interface RawArtistJoin { position: number; artist: Artist | null }

interface RawSongRow extends Song {
  tags: RawTagJoin[]
  lists: RawListJoin[]
  artists: RawArtistJoin[]
}

interface RawSongDetailRow extends Song {
  tags: RawTagJoin[]
  artists: RawArtistJoin[]
}

function mapArtists(rows: RawArtistJoin[]): ArtistWithPosition[] {
  return rows
    .filter((sa): sa is { position: number; artist: Artist } => sa.artist != null)
    .map((sa) => ({ ...sa.artist, position: sa.position }))
    .sort((a, b) => a.position - b.position) as ArtistWithPosition[]
}

function transformSong(song: RawSongRow): SongWithTags {
  return {
    ...song,
    tags: song.tags.map((st) => st.tag).filter((t): t is Tag => t != null),
    lists: song.lists.map((li) => li.list).filter((l): l is List => l != null),
    artists: mapArtists(song.artists),
  }
}

export async function fetchSongs(projectId: string): Promise<SongWithTags[]> {
  const { data, error } = await supabase
    .from('songs')
    .select(SONG_SELECT)
    .eq('project_id', projectId)
    .order('title', { ascending: true })
  if (error) throw error
  return (data || []).map((row) => transformSong(row as unknown as RawSongRow))
}

export async function fetchSongById(songId: string): Promise<SongWithTags | null> {
  const { data, error } = await supabase
    .from('songs')
    .select(`
      *,
      tags:song_tags(
        tag:tags(*)
      ),
      artists:song_artists(
        position,
        artist:artists(*)
      )
    `)
    .eq('id', songId)
    .single()
  if (error) throw error
  const row = data as unknown as RawSongDetailRow
  return {
    ...row,
    tags: row.tags.map((st) => st.tag).filter((t): t is Tag => t != null),
    lists: [],
    artists: mapArtists(row.artists),
  }
}

export async function insertSong(songData: Partial<Song>, userId: string): Promise<Song> {
  const { data, error } = await supabase
    .from('songs')
    .insert({ ...songData, created_by: userId, updated_by: userId } as TablesInsert<'songs'>)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function insertSongTags(songId: string, tagIds: string[]): Promise<void> {
  const { error } = await supabase
    .from('song_tags')
    .insert(tagIds.map(tagId => ({ song_id: songId, tag_id: tagId })))
  if (error) throw error
}

export async function replaceSongTags(songId: string, tagIds: string[]): Promise<void> {
  await supabase.from('song_tags').delete().eq('song_id', songId)
  if (tagIds.length > 0) {
    const { error } = await supabase
      .from('song_tags')
      .insert(tagIds.map(tagId => ({ song_id: songId, tag_id: tagId })))
    if (error) throw error
  }
}

export async function insertSongArtists(songId: string, artistIds: string[]): Promise<void> {
  const { error } = await supabase
    .from('song_artists')
    .insert(artistIds.map((artistId, index) => ({
      song_id: songId,
      artist_id: artistId,
      position: index + 1,
    })))
  if (error) throw error
}

export async function replaceSongArtists(songId: string, artistIds: string[]): Promise<void> {
  await supabase.from('song_artists').delete().eq('song_id', songId)
  if (artistIds.length > 0) {
    const { error } = await supabase
      .from('song_artists')
      .insert(artistIds.map((artistId, index) => ({
        song_id: songId,
        artist_id: artistId,
        position: index + 1,
      })))
    if (error) throw error
  }
}

export async function updateSong(songId: string, songData: Partial<Song>, userId: string): Promise<Song> {
  const { data, error } = await supabase
    .from('songs')
    .update({ ...songData, updated_by: userId })
    .eq('id', songId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteSong(songId: string): Promise<void> {
  const { error } = await supabase.from('songs').delete().eq('id', songId)
  if (error) throw error
}

export async function bulkDeleteSongs(songIds: string[]): Promise<void> {
  const { error } = await supabase.from('songs').delete().in('id', songIds)
  if (error) throw error
}

export async function fetchSongTags(songId: string): Promise<Tag[]> {
  const { data, error } = await supabase
    .from('songs')
    .select('tags:song_tags(tag:tags(*))')
    .eq('id', songId)
    .single()
  if (error) throw error
  const row = data as unknown as { tags: RawTagJoin[] }
  return row.tags.map((st) => st.tag).filter((t): t is Tag => t != null)
}

export async function fetchSongLists(songId: string): Promise<List[]> {
  const { data, error } = await supabase
    .from('songs')
    .select('lists:list_items(list:lists(*))')
    .eq('id', songId)
    .single()
  if (error) throw error
  const row = data as unknown as { lists: RawListJoin[] }
  return row.lists.map((li) => li.list).filter((l): l is List => l != null)
}

export async function fetchSongArtists(songId: string): Promise<ArtistWithPosition[]> {
  const { data, error } = await supabase
    .from('songs')
    .select('artists:song_artists(position, artist:artists(*))')
    .eq('id', songId)
    .single()
  if (error) throw error
  const row = data as unknown as { artists: RawArtistJoin[] }
  return mapArtists(row.artists)
}
