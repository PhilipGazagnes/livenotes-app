import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase'
import type {
  ArtistV2,
  LibrarySong,
  LibrarySongTag,
  List,
  ListItem,
  Note,
  Project,
  ProjectRole,
  SongArtistV2,
  SongV2,
  Tag,
} from '../types'
import { SNAPSHOT_SCHEMA_VERSION, type ProjectSnapshot } from './snapshot'
import { fetchProjectStatus } from './status'

export type LivenotesClient = SupabaseClient<Database>

export interface SyncProgress {
  step: string
  current: number
  total: number
}

/** Page size for paged reads (PostgREST caps responses at 1,000 rows by default). */
export const SNAPSHOT_PAGE_SIZE = 500

export const PROJECT_COLUMNS =
  'id, name, slug, owner_id, created_at, updated_at, description, thumbnail_url, contact_enabled, contact_info'

export const LIBRARY_SELECT = `
  *,
  song:songs!library_songs_song_id_fkey(
    *,
    song_artists:song_artists(
      *,
      artist:artists(*)
    )
  ),
  tags:library_song_tags(*),
  notes(*)
`

export interface RawSongArtist extends SongArtistV2 { artist: ArtistV2 | null }
export interface RawSong extends SongV2 { song_artists: RawSongArtist[] | null }
export interface RawLibrarySong extends LibrarySong {
  song: RawSong | null
  tags: LibrarySongTag[] | null
  notes: Note[] | null
}
export interface RawList extends List { items: ListItem[] | null }

/** Error raised by a sync step, naming the step that failed. */
export class SnapshotSyncError extends Error {
  constructor(public readonly step: string, public readonly original: unknown) {
    const detail = original instanceof Error
      ? original.message
      : typeof original === 'object' && original !== null && 'message' in original
        ? String((original as { message: unknown }).message)
        : String(original)
    super(`Sync failed while loading ${step}: ${detail}`)
    this.name = 'SnapshotSyncError'
  }
}

type PageResult<T> = { data: T[] | null; error: unknown }

async function fetchAllPages<T>(
  step: string,
  fetchPage: (from: number, to: number) => PromiseLike<PageResult<T>>,
  onPage?: (page: number) => void,
): Promise<T[]> {
  const rows: T[] = []
  for (let page = 0; ; page++) {
    onPage?.(page + 1)
    const from = page * SNAPSHOT_PAGE_SIZE
    const { data, error } = await fetchPage(from, from + SNAPSHOT_PAGE_SIZE - 1)
    if (error) throw new SnapshotSyncError(step, error)
    const batch = data ?? []
    rows.push(...batch)
    if (batch.length < SNAPSHOT_PAGE_SIZE) return rows
  }
}

/**
 * Download everything needed to read a project offline.
 *
 * All-or-nothing: any failed request rejects with SnapshotSyncError and no
 * partial snapshot is returned, so the caller keeps its previous snapshot.
 */
export async function fetchProjectSnapshot(
  client: LivenotesClient,
  projectId: string,
  userId: string,
  onProgress?: (progress: SyncProgress) => void,
): Promise<ProjectSnapshot> {
  const TOTAL_STEPS = 4
  const report = (step: string, current: number) => onProgress?.({ step, current, total: TOTAL_STEPS })

  report('Project', 1)
  // The version is read before the data: a change made during the download
  // leaves the copy at an older version, so the staleness check catches it.
  const [status, projectRes, roleRes] = await Promise.all([
    fetchProjectStatus(client, projectId).catch(err => { throw new SnapshotSyncError('project version', err) }),
    client.from('projects').select(PROJECT_COLUMNS).eq('id', projectId).maybeSingle(),
    client.from('project_memberships').select('role').eq('project_id', projectId).eq('user_id', userId).maybeSingle(),
  ])
  if (projectRes.error) throw new SnapshotSyncError('project', projectRes.error)
  if (roleRes.error) throw new SnapshotSyncError('project role', roleRes.error)

  report('Library', 2)
  const rawLibrary = await fetchAllPages<RawLibrarySong>('library', (from, to) =>
    client
      .from('library_songs')
      .select(LIBRARY_SELECT)
      .eq('project_id', projectId)
      .order('id')
      .range(from, to) as unknown as PromiseLike<PageResult<RawLibrarySong>>
  )

  report('Tags', 3)
  const tags = await fetchAllPages<Tag>('tags', (from, to) =>
    client
      .from('tags')
      .select('id, project_id, name, created_at')
      .eq('project_id', projectId)
      .order('id')
      .range(from, to) as unknown as PromiseLike<PageResult<Tag>>
  )

  report('Setlists', 4)
  const rawLists = await fetchAllPages<RawList>('setlists', (from, to) =>
    client
      .from('lists')
      .select('*, items:list_items(*)')
      .eq('project_id', projectId)
      .order('id')
      .range(from, to) as unknown as PromiseLike<PageResult<RawList>>
  )

  return buildSnapshot({
    projectId,
    version: status?.version ?? 0,
    project: (projectRes.data as unknown as Project | null) ?? null,
    role: ((roleRes.data as { role: string } | null)?.role as ProjectRole | undefined) ?? null,
    rawLibrary,
    tags,
    rawLists,
  })
}

/** Flatten the embedded responses into raw table rows (deduplicating shared rows). */
export function buildSnapshot(input: {
  projectId: string
  version?: number
  project: Project | null
  role: ProjectRole | null
  rawLibrary: RawLibrarySong[]
  tags: Tag[]
  rawLists: RawList[]
  syncedAt?: string
}): ProjectSnapshot {
  const songs = new Map<string, SongV2>()
  const songArtists = new Map<string, SongArtistV2>()
  const artists = new Map<string, ArtistV2>()
  const librarySongs: LibrarySong[] = []
  const librarySongTags: LibrarySongTag[] = []
  const notes: Note[] = []

  for (const { song, tags: lsTags, notes: lsNotes, ...librarySong } of input.rawLibrary) {
    librarySongs.push(librarySong)
    librarySongTags.push(...(lsTags ?? []))
    notes.push(...(lsNotes ?? []))
    if (!song) continue
    const { song_artists, ...songRow } = song
    songs.set(songRow.id, songRow)
    for (const { artist, ...songArtist } of song_artists ?? []) {
      songArtists.set(songArtist.id, songArtist)
      if (artist) artists.set(artist.id, artist)
    }
  }

  const lists: List[] = []
  const listItems: ListItem[] = []
  for (const { items, ...list } of input.rawLists) {
    lists.push(list)
    listItems.push(...(items ?? []))
  }

  return {
    projectId: input.projectId,
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    syncedAt: input.syncedAt ?? new Date().toISOString(),
    version: input.version ?? 0,
    project: input.project,
    role: input.role,
    librarySongs,
    songs: [...songs.values()],
    songArtists: [...songArtists.values()],
    artists: [...artists.values()],
    librarySongTags,
    notes,
    tags: input.tags,
    lists,
    listItems,
  }
}

// ---------------------------------------------------------------------------
// Aggregates re-read after a write, to patch the local copy (ADR-012)
// ---------------------------------------------------------------------------

/** Library songs with their song card, artists, tags and notes. Missing ids were deleted. */
export async function fetchLibrarySongAggregates(client: LivenotesClient, ids: string[]): Promise<RawLibrarySong[]> {
  if (!ids.length) return []
  const { data, error } = await client.from('library_songs').select(LIBRARY_SELECT).in('id', ids)
  if (error) throw error
  return (data ?? []) as unknown as RawLibrarySong[]
}

/** Setlists with all their items. Missing ids were deleted. */
export async function fetchListAggregates(client: LivenotesClient, ids: string[]): Promise<RawList[]> {
  if (!ids.length) return []
  const { data, error } = await client.from('lists').select('*, items:list_items(*)').in('id', ids)
  if (error) throw error
  return (data ?? []) as unknown as RawList[]
}

export async function fetchProjectTags(client: LivenotesClient, projectId: string): Promise<Tag[]> {
  const { data, error } = await client.from('tags').select('id, project_id, name, created_at').eq('project_id', projectId)
  if (error) throw error
  return (data ?? []) as Tag[]
}

export async function fetchProjectRow(client: LivenotesClient, projectId: string): Promise<Project | null> {
  const { data, error } = await client.from('projects').select(PROJECT_COLUMNS).eq('id', projectId).maybeSingle()
  if (error) throw error
  return (data as unknown as Project | null) ?? null
}
