import { supabase } from '@/lib/supabase'
import type { Song, SongWithTags, ArtistWithPosition } from '@/types/database'

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

function transformSong(song: any): SongWithTags {
  return {
    ...song,
    tags: song.tags?.map((st: any) => st.tag).filter(Boolean) ?? [],
    lists: song.lists?.map((li: any) => li.list).filter(Boolean) ?? [],
    artists: (song.artists?.map((sa: any) => ({
      ...sa.artist,
      position: sa.position,
    })).sort((a: any, b: any) => a.position - b.position) ?? []) as ArtistWithPosition[],
  }
}

export async function fetchSongs(projectId: string): Promise<SongWithTags[]> {
  const { data, error } = await supabase
    .from('songs')
    .select(SONG_SELECT)
    .eq('project_id', projectId)
    .order('title', { ascending: true })
  if (error) throw error
  return (data || []).map(transformSong)
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
  return {
    ...data,
    tags: data.tags?.map((st: any) => st.tag) ?? [],
    lists: [],
    artists: (data.artists?.map((sa: any) => ({
      ...sa.artist,
      position: sa.position,
    })).sort((a: any, b: any) => a.position - b.position) ?? []) as ArtistWithPosition[],
  }
}

export async function insertSong(songData: Partial<Song>, userId: string): Promise<Song> {
  const { data, error } = await supabase
    .from('songs')
    .insert({ ...songData, created_by: userId, updated_by: userId } as any)
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

export async function fetchSongTags(songId: string) {
  const { data, error } = await supabase
    .from('songs')
    .select('tags:song_tags(tag:tags(*))')
    .eq('id', songId)
    .single()
  if (error) throw error
  return data.tags?.map((st: any) => st.tag).filter(Boolean) ?? []
}

export async function fetchSongLists(songId: string) {
  const { data, error } = await supabase
    .from('songs')
    .select('lists:list_items(list:lists(*))')
    .eq('id', songId)
    .single()
  if (error) throw error
  return data.lists?.map((li: any) => li.list).filter(Boolean) ?? []
}

export async function fetchSongArtists(songId: string): Promise<ArtistWithPosition[]> {
  const { data, error } = await supabase
    .from('songs')
    .select('artists:song_artists(position, artist:artists(*))')
    .eq('id', songId)
    .single()
  if (error) throw error
  return (data.artists?.map((sa: any) => ({
    ...sa.artist,
    position: sa.position,
  })).sort((a: any, b: any) => a.position - b.position) ?? []) as ArtistWithPosition[]
}
