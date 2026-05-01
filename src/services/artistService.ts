import { supabase } from '@/lib/supabase'
import type { Artist, ArtistV2, ArtistWithCount } from '@/types/database'

export async function fetchArtists(projectId: string): Promise<Artist[]> {
  const { data, error } = await supabase
    .from('artists')
    .select('*')
    .eq('project_id', projectId)
    .order('name', { ascending: true })
  if (error) throw error
  return data || []
}

export async function fetchArtistsWithCount(projectId: string): Promise<ArtistWithCount[]> {
  const { data: librarySongs, error } = await supabase
    .from('library_songs')
    .select(`
      id,
      song_id,
      songs_v2!inner(
        id,
        song_artists_v2!inner(
          artist_id,
          artists_v2!inner(
            id,
            name,
            created_at,
            updated_at
          )
        )
      )
    `)
    .eq('project_id', projectId)
  if (error) throw error

  const artistMap = new Map<string, ArtistWithCount>()
  librarySongs?.forEach((librarySong: any) => {
    const songArtists = librarySong.songs_v2?.song_artists_v2 || []
    songArtists.forEach((sa: any) => {
      const artist = sa.artists_v2
      if (artist) {
        if (artistMap.has(artist.id)) {
          artistMap.get(artist.id)!.song_count++
        } else {
          artistMap.set(artist.id, {
            id: artist.id,
            project_id: projectId,
            name: artist.name,
            created_at: artist.created_at,
            updated_at: artist.updated_at,
            song_count: 1,
          })
        }
      }
    })
  })
  return Array.from(artistMap.values()).sort((a, b) => a.name.localeCompare(b.name))
}

export async function findArtistByFingerprint(fingerprint: string): Promise<ArtistV2 | null> {
  const { data, error } = await supabase
    .from('artists_v2')
    .select('*')
    .eq('fingerprint', fingerprint)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function createArtistV2(name: string, fingerprint: string, userId: string): Promise<ArtistV2> {
  const { data, error } = await supabase
    .from('artists_v2')
    .insert({ name, fingerprint, created_by: userId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function fetchArtistCreatedBy(artistId: string): Promise<string> {
  const { data, error } = await supabase
    .from('artists_v2')
    .select('created_by')
    .eq('id', artistId)
    .single()
  if (error) throw error
  return data.created_by
}

export async function updateArtistV2(artistId: string, name: string, fingerprint: string): Promise<ArtistV2> {
  const { data, error } = await supabase
    .from('artists_v2')
    .update({ name, fingerprint, updated_at: new Date().toISOString() })
    .eq('id', artistId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function fetchUserProjectId(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('projects')
    .select('id')
    .eq('owner_id', userId)
    .single()
  return data?.id ?? null
}

export async function fetchProjectLibrarySongIds(projectId: string): Promise<string[]> {
  const { data } = await supabase
    .from('library_songs')
    .select('song_id')
    .eq('project_id', projectId)
  return (data || []).map(ls => ls.song_id)
}

export async function checkArtistUsedInSongs(artistId: string, songIds: string[]): Promise<boolean> {
  const { data, error } = await supabase
    .from('song_artists_v2')
    .select('id')
    .eq('artist_id', artistId)
    .in('song_id', songIds)
    .limit(1)
  if (error) throw error
  return (data?.length ?? 0) > 0
}
