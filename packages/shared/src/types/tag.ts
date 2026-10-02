export interface Tag {
  id: string
  project_id: string
  name: string
  created_at: string | null
}

export interface TagWithCount extends Tag {
  song_count: number
}
