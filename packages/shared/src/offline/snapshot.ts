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
export const SNAPSHOT_SCHEMA_VERSION = 1

/**
 * Complete local copy of one project's data: raw rows of the Supabase tables,
 * not API responses. Read shapes are rebuilt from it by `queries.ts`.
 */
export interface ProjectSnapshot {
  projectId: string
  schemaVersion: number
  /** ISO timestamp of the successful sync that produced this snapshot */
  syncedAt: string
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
