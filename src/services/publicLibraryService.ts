import { supabase } from '@/lib/supabase'
import type { PublicLibrary, PublicLibraryWithTags, LibrarySongWithDetails, Note } from '@/types/database'

// Supabase TypeScript types are generated from the deployed schema.
// public_libraries / public_library_tags don't exist there yet (pending migration),
// so we use an untyped client reference for those tables only.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as any

// ── Management (authenticated) ──────────────────────────────────────────────

type PartialTag = { id: string; name: string; project_id: string; created_at: string | null }
interface LibraryRow extends PublicLibrary {
  tags: { tag: PartialTag | null }[]
}

export async function fetchPublicLibraries(projectId: string): Promise<PublicLibraryWithTags[]> {
  const { data, error } = await db
    .from('public_libraries')
    .select(`*, tags:public_library_tags(tag:tags(id, name))`)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return ((data as LibraryRow[]) || []).map((row) => ({
    ...row,
    tags: row.tags.map(t => t.tag).filter((t): t is PartialTag => t !== null),
  }))
}

export async function createPublicLibrary(
  projectId: string,
  name: string,
  slug: string,
  userId: string,
  extra: { header_image_mobile?: string | null; header_image_desktop?: string | null } = {}
): Promise<PublicLibrary> {
  const { data, error } = await db
    .from('public_libraries')
    .insert({ project_id: projectId, name, slug, created_by: userId, ...extra })
    .select()
    .single()
  if (error) throw error
  return data as PublicLibrary
}

export async function updatePublicLibrary(
  id: string,
  updates: { name?: string; slug?: string; is_active?: boolean; header_image_mobile?: string | null; header_image_desktop?: string | null }
): Promise<void> {
  const { error } = await db.from('public_libraries').update(updates).eq('id', id)
  if (error) throw error
}

export async function deletePublicLibrary(id: string): Promise<void> {
  const { error } = await db.from('public_libraries').delete().eq('id', id)
  if (error) throw error
}

export async function setPublicLibraryTags(libraryId: string, tagIds: string[]): Promise<void> {
  const { error: deleteError } = await db
    .from('public_library_tags')
    .delete()
    .eq('public_library_id', libraryId)
  if (deleteError) throw deleteError

  if (tagIds.length === 0) return

  const { error: insertError } = await db
    .from('public_library_tags')
    .insert(tagIds.map((tag_id: string) => ({ public_library_id: libraryId, tag_id })))
  if (insertError) throw insertError
}

// ── Public (unauthenticated) ─────────────────────────────────────────────────

const PUBLIC_LIBRARY_SONG_SELECT = `
  id,
  song_id,
  project_id,
  added_at,
  added_by,
  custom_title,
  custom_notes,
  song:songs_v2!library_songs_song_id_fkey(
    id,
    title,
    artists:song_artists_v2(
      position,
      artist:artists_v2(id, name)
    )
  ),
  tags:library_song_tags(
    tag:tags(id, name)
  )
`

export async function fetchPublicLibraryBySlug(
  projectSlug: string,
  librarySlug: string
): Promise<PublicLibraryWithTags | null> {
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id')
    .eq('slug', projectSlug)
    .single()
  if (projectError || !project) return null

  const { data: library, error: libraryError } = await db
    .from('public_libraries')
    .select(`*, tags:public_library_tags(tag:tags(id, name))`)
    .eq('project_id', project.id)
    .eq('slug', librarySlug)
    .eq('is_active', true)
    .single()
  if (libraryError || !library) return null

  const row = library as LibraryRow
  return {
    ...row,
    tags: row.tags.map(t => t.tag).filter((t): t is PartialTag => t !== null),
  }
}

export async function fetchPublicLibrarySongs(
  projectId: string,
  tagIds: string[]
): Promise<LibrarySongWithDetails[]> {
  if (tagIds.length === 0) return []

  const { data: taggedSongIds, error: tagError } = await supabase
    .from('library_song_tags')
    .select('library_song_id')
    .in('tag_id', tagIds)
  if (tagError) throw tagError

  const songIds = [...new Set((taggedSongIds || []).map(r => r.library_song_id))]
  if (songIds.length === 0) return []

  const { data, error } = await supabase
    .from('library_songs')
    .select(PUBLIC_LIBRARY_SONG_SELECT)
    .eq('project_id', projectId)
    .in('id', songIds)
  if (error) throw error

  interface SongRow {
    song?: {
      id: string
      title: string
      artists: Array<{ artist: { id: string; name: string } | null; position: number }>
    }
    tags: Array<{ tag: PartialTag | null }>
    [key: string]: unknown
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data as unknown as SongRow[]) || []).map((row) => ({
    ...row,
    song: {
      ...row.song,
      artists: (row.song?.artists || [])
        .filter((sa) => sa.artist != null)
        .map((sa) => ({ ...sa.artist!, position: sa.position }))
        .sort((a, b) => a.position - b.position),
    },
    tags: (row.tags || []).map((t) => t.tag).filter((t): t is PartialTag => t !== null),
    notes: [],
    lists: [],
  })) as unknown as LibrarySongWithDetails[]
}

export async function fetchFirstLyricsNote(librarySongId: string): Promise<Note | null> {
  const { data, error } = await supabase
    .from('notes')
    .select('id, type, title, content, data, display_order')
    .eq('library_song_id', librarySongId)
    .in('type', ['songcode', 'lyrics'])
    .order('display_order', { ascending: true })
    .limit(1)
    .single()
  if (error) return null
  return data as Note
}
