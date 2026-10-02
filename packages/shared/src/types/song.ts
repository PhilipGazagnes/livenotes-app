import type { Tag } from './tag'
import type { List } from './list'
import type { Note } from './note'
import type { LivenotesJson } from './note'

export interface Song {
  id: string
  project_id: string
  title: string
  artist: string | null
  notes: string | null
  livenotes_poc_id: string | null
  created_at: string | null
  updated_at: string | null
  created_by: string | null
  updated_by: string | null
}

export interface SongTag {
  id: string
  song_id: string
  tag_id: string
  created_at: string
}

export interface Artist {
  id: string
  project_id: string
  name: string
  created_at: string | null
  updated_at: string | null
}

export interface SongArtist {
  id: string
  song_id: string
  artist_id: string
  position: number
  created_at: string
}

export interface ArtistWithPosition extends Artist {
  position: number
}

export interface ArtistWithCount extends Artist {
  song_count: number
}

export interface SongWithTags extends Song {
  tags: Tag[]
  lists: List[]
  artists: ArtistWithPosition[]
}

export interface SongCode {
  song_id: string
  songcode: string | null
  songcode_updated_at: string | null
  songcode_updated_by: string | null
  livenotes_json: LivenotesJson | null
  livenotes_json_updated_at: string | null
  livenotes_json_updated_by: string | null
  created_at: string | null
}

export interface SongV2 {
  id: string
  title: string
  fingerprint: string | null
  is_verified: boolean | null
  verified_by: string | null
  verified_at: string | null
  created_by: string
  created_at: string | null
  updated_at: string | null
  popularity_score: number | null
  merged_into_id: string | null
  merge_reason: string | null
}

export interface ArtistV2 {
  id: string
  name: string
  fingerprint: string | null
  is_verified: boolean | null
  verified_by: string | null
  verified_at: string | null
  bio: string | null
  image_url: string | null
  external_links: unknown | null
  created_by: string
  created_at: string | null
  updated_at: string | null
  merged_into_id: string | null
  merge_reason: string | null
}

export interface SongArtistV2 {
  id: string
  song_id: string
  artist_id: string
  position: number
  created_at: string
}

export interface LibrarySong {
  id: string
  project_id: string
  song_id: string
  added_by: string
  added_at: string | null
  custom_title: string | null
  custom_notes: string | null
}

export interface LibrarySongTag {
  id: string
  library_song_id: string
  tag_id: string
  created_at: string
}

export interface SongV2WithArtists extends SongV2 {
  artists: Array<ArtistV2 & { position: number }>
}

export interface LibrarySongWithSong extends LibrarySong {
  song: SongV2WithArtists
}

export interface LibrarySongWithDetails extends LibrarySong {
  song: SongV2WithArtists
  tags: Tag[]
  notes: Note[]
  lists: List[]
}
