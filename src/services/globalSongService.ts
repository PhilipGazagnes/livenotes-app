import { supabase } from '@/lib/supabase'
import type { SongV2, SongV2WithArtists, ArtistV2 } from '@/types/database'

interface RawSongArtistJoin {
  position: number
  artist: ArtistV2 | null
}

function mapArtists(rows: RawSongArtistJoin[]): (ArtistV2 & { position: number })[] {
  return rows
    .map(sa => (sa.artist ? { ...sa.artist, position: sa.position } : null))
    .filter((a): a is ArtistV2 & { position: number } => a !== null)
    .sort((a, b) => a.position - b.position)
}

export async function searchSongs(query: string): Promise<SongV2WithArtists[]> {
  const fingerprint = query.toLowerCase().replace(/[^a-z0-9]/g, '')
  const { data, error } = await supabase
    .from('songs_v2')
    .select(`
      *,
      artists:song_artists_v2(
        position,
        artist:artists_v2(*)
      )
    `)
    .or(`title.ilike.%${query}%,fingerprint.eq.${fingerprint}`)
    .order('popularity_score', { ascending: false })
    .limit(20)
  if (error) throw error
  return (data || []).map(song => ({
    ...song,
    artists: mapArtists((song.artists ?? []) as RawSongArtistJoin[]),
  }))
}

export async function createSong(title: string, artistIds: string[], userId: string): Promise<SongV2> {
  const { data: song, error: songError } = await supabase
    .from('songs_v2')
    .insert({ title, created_by: userId })
    .select()
    .single()
  if (songError) throw songError

  if (artistIds.length > 0) {
    const { error: linkError } = await supabase
      .from('song_artists_v2')
      .insert(artistIds.map((artistId, index) => ({
        song_id: song.id,
        artist_id: artistId,
        position: index + 1,
      })))
    if (linkError) throw linkError
  }

  return song
}

export async function getSongById(songId: string): Promise<SongV2WithArtists | null> {
  const { data, error } = await supabase
    .from('songs_v2')
    .select(`
      *,
      artists:song_artists_v2(
        position,
        artist:artists_v2(*)
      )
    `)
    .eq('id', songId)
    .single()
  if (error) throw error
  if (!data) return null
  return {
    ...data,
    artists: mapArtists((data.artists ?? []) as RawSongArtistJoin[]),
  }
}

export async function searchArtists(query: string): Promise<ArtistV2[]> {
  const { data, error } = await supabase
    .from('artists_v2')
    .select('id, name, fingerprint, is_verified, verified_by, verified_at, bio, image_url, external_links, created_by, created_at, updated_at, merged_into_id, merge_reason')
    .ilike('name', `%${query}%`)
    .order('name')
    .limit(20)
  if (error) throw error
  return data || []
}

export async function createArtist(name: string, userId: string): Promise<ArtistV2> {
  const { data, error } = await supabase
    .from('artists_v2')
    .insert({ name, created_by: userId })
    .select()
    .single()
  if (error) throw error
  return data
}
