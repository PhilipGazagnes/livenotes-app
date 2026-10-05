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

/**
 * Bump when the snapshot shape changes. Snapshots with another version are
 * ignored (treated as missing) and replaced by the next sync.
 */
export const SNAPSHOT_SCHEMA_VERSION = 2

/**
 * Complete local copy of one project's data: raw rows of the Supabase tables,
 * not API responses. Read shapes are rebuilt from it by `queries.ts`.
 */
export interface ProjectSnapshot {
  projectId: string
  schemaVersion: number
  /** ISO timestamp of the successful sync that produced this snapshot */
  syncedAt: string
  /**
   * Server project version this copy matches (ADR-010). Read before the data
   * during a sync, and advanced by the user's own writes (ADR-012).
   * -1 marks a copy known to be out of date (a local patch failed).
   */
  version: number
  project: Project | null
  role: ProjectRole | null
  librarySongs: LibrarySong[]
  songs: SongV2[]
  songArtists: SongArtistV2[]
  artists: ArtistV2[]
  librarySongTags: LibrarySongTag[]
  notes: Note[]
  tags: Tag[]
  lists: List[]
  listItems: ListItem[]
}
