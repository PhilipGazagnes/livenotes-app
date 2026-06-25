import { supabase } from '@/lib/supabase'
import type { Artist, ArtistV2, ArtistWithCount } from '@/types/database'

interface RawArtistV2Field {
  id: string
  name: string
  created_at: string | null
  updated_at: string | null
}
interface RawSongArtistV2Row {
  artist_id: string
  artists_v2: RawArtistV2Field | null
}
interface RawSongV2ForCount {
  id: string
  song_artists_v2: RawSongArtistV2Row[]
}
interface RawLibrarySongForCount {
  id: string
  song_id: string
  songs_v2: RawSongV2ForCount | null
}

export async function fetchArtists(projectId: string): Promise<Artist[]> {
  const { data, error } = await supabase
    .from('artists')
    .select('id, project_id, name, created_at, updated_at')
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
  const rows = (librarySongs as unknown as RawLibrarySongForCount[]) ?? []
  rows.forEach((librarySong) => {
    const songArtists = librarySong.songs_v2?.song_artists_v2 ?? []
    songArtists.forEach((sa) => {
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
    .select('id, name, fingerprint, is_verified, verified_by, verified_at, bio, image_url, external_links, created_by, created_at, updated_at, merged_into_id, merge_reason')
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

export async function bulkDeleteArtistSongs(artistIds: string[], projectId: string): Promise<void> {
  const { data: songArtists } = await supabase
    .from('song_artists_v2')
    .select('song_id')
    .in('artist_id', artistIds)

  const songIds = [...new Set((songArtists ?? []).map((sa: { song_id: string }) => sa.song_id))]
  if (songIds.length === 0) return

  const { data: libSongs } = await supabase
    .from('library_songs')
    .select('id')
    .eq('project_id', projectId)
    .in('song_id', songIds)

  const libraryIds = (libSongs ?? []).map((ls: { id: string }) => ls.id)
  if (libraryIds.length === 0) return

  const { error } = await supabase.from('library_songs').delete().in('id', libraryIds)
  if (error) throw error
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
