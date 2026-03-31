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
}

export interface Song {
  id: string
  project_id: string
  title: string
  artist: string | null
  notes: string | null
  livenotes_poc_id: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface Tag {
  id: string
  project_id: string
  name: string
  created_at: string
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
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface ListItem {
  id: string
  list_id: string
  song_id: string
  position: number
  added_at: string
}

// Extended types with relations
export interface SongWithTags extends Song {
  tags: Tag[]
  lists: List[]
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
