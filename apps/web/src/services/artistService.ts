import { supabase } from '@/lib/supabase'
import type { ArtistV2, ArtistWithCount } from '@livenotes/shared/types'
import { selectArtistsWithCount } from '@livenotes/shared/offline'
import { readLocal } from '@/lib/offline/offlineData'
import { commitWrite } from '@/lib/offline/projectWrites'
import { removeManyFromLibrary } from './libraryService'

export function fetchArtistsWithCount(projectId: string): Promise<ArtistWithCount[]> {
  return readLocal(selectArtistsWithCount, { projectId })
}

export async function findArtistByFingerprint(fingerprint: string): Promise<ArtistV2 | null> {
  const { data, error } = await supabase
    .from('artists')
    .select('id, name, fingerprint, is_verified, verified_by, verified_at, bio, image_url, external_links, created_by, created_at, updated_at, merged_into_id, merge_reason')
    .eq('fingerprint', fingerprint)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function createArtistV2(name: string, fingerprint: string, userId: string): Promise<ArtistV2> {
  const { data, error } = await supabase
    .from('artists')
    .insert({ name, fingerprint, created_by: userId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function fetchArtistCreatedBy(artistId: string): Promise<string> {
  const { data, error } = await supabase
    .from('artists')
    .select('created_by')
    .eq('id', artistId)
    .single()
  if (error) throw error
  return data.created_by
}

export function updateArtistV2(artistId: string, name: string, fingerprint: string): Promise<ArtistV2> {
  return commitWrite(
    async () => {
      const { data, error } = await supabase
        .from('artists')
        .update({ name, fingerprint, updated_at: new Date().toISOString() })
        .eq('id', artistId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    artist => ({ artists: [artist] }),
  )
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
    .from('song_artists')
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

  await removeManyFromLibrary(libraryIds)
}

export async function checkArtistUsedInSongs(artistId: string, songIds: string[]): Promise<boolean> {
  const { data, error } = await supabase
    .from('song_artists')
    .select('id')
    .eq('artist_id', artistId)
    .in('song_id', songIds)
    .limit(1)
  if (error) throw error
  return (data?.length ?? 0) > 0
}
