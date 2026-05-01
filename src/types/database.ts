// Database entity types

export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  name: string
  type: 'personal' | 'shared'
  owner_id: string
  created_at: string
  updated_at: string
  notes_field_label: string
  notes_field_enabled: boolean
}

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

export interface Tag {
  id: string
  project_id: string
  name: string
  created_at: string | null
}

export interface SongTag {
  id: string
  song_id: string
  tag_id: string
  created_at: string
}

export interface List {
  id: string
  project_id: string
  name: string
  description: string | null
  created_at: string | null
  updated_at: string | null
  created_by: string | null
}

export interface ListItem {
  id: string
  list_id: string
  song_id: string | null
  library_song_id: string | null  // V2: Reference to library_songs
  position: number
  type: 'song' | 'title'
  title: string | null
  added_at: string
  note_id: string | null  // V2: Reference to notes
  list_annotations: string | null  // V2: List-specific annotations
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

// Extended types with relations
export interface ArtistWithPosition extends Artist {
  position: number
}

export interface SongWithTags extends Song {
  tags: Tag[]
  lists: List[]
  artists: ArtistWithPosition[]
}

export interface ListWithSongs extends List {
  songs: SongWithTags[]
  song_count: number
}

export interface ListWithItems extends List {
  items: Array<ListItem & { song: SongWithTags }>
}

export interface TagWithCount extends Tag {
  song_count: number
}

export interface ArtistWithCount extends Artist {
  song_count: number
}

// =============================================================================
// V2 Types - Global Catalog Architecture
// =============================================================================

// Note types enum
export type NoteType =
  | 'songcode'
  | 'plain_text'
  | 'youtube'
  | 'image'
  | 'video'
  | 'audio'
  | 'tablature'
  | 'looper_notes'
  | 'looper'
  | 'lyrics'
  | 'chords'

// Global song catalog
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

// Global artist catalog
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

// Song-Artist junction (V2)
export interface SongArtistV2 {
  id: string
  song_id: string
  artist_id: string
  position: number
  created_at: string
}

// Library songs - junction between projects and global songs
export interface LibrarySong {
  id: string
  project_id: string
  song_id: string
  added_by: string
  added_at: string | null
  custom_title: string | null
  custom_notes: string | null
}

// Shape of the livenotes JSON blob stored in songcode notes
export interface LivenotesJson {
  sections: Array<{
    name: string
    lyrics: Array<{
      text: string
      measures: number | null
      style: string
    }>
  }>
}

// Note type-specific data structures (stored in notes.data JSONB)
export interface SongcodeNoteData {
  livenotes_json: LivenotesJson | null
  livenotes_json_updated_at: string | null
}

export interface LooperNoteData {
  bpm: number
  pattern1: string
  pattern1_var: string
  pattern2: string
  pattern2_var: string
  comment: string
}

// Notes - multi-note system
export interface Note {
  id: string
  library_song_id: string
  type: NoteType
  title: string | null
  content: string | null
  data: SongcodeNoteData | LooperNoteData | null
  created_by: string
  created_at: string | null
  updated_by: string
  updated_at: string | null
  display_order: number | null
  is_public: boolean | null
  is_shareable: boolean | null
  share_token: string | null
}

// Kept as alias for backward compatibility with existing component references
export interface LooperContent {
  bpm: number
  pattern1: string
  pattern1_var: string
  pattern2: string
  pattern2_var: string
  comment: string
}

// Library song tags - new junction
export interface LibrarySongTag {
  id: string
  library_song_id: string
  tag_id: string
  created_at: string
}

// Extended V2 types with relations
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

export interface NoteWithSong extends Note {
  library_song: LibrarySongWithSong
}

