import type { SongWithTags } from './song'

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
  library_song_id: string | null
  position: number
  type: 'song' | 'title'
  title: string | null
  added_at: string
  note_id: string | null
  list_annotations: string | null
}

export interface ListWithSongs extends List {
  songs: SongWithTags[]
  song_count: number
}

export interface ListWithItems extends List {
  items: Array<ListItem & { song: SongWithTags }>
}
