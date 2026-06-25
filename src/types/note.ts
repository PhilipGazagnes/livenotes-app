import type { LibrarySongWithSong } from './song'

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

export interface LivenotesPatternRef {
  id: string
  before?: { json: unknown[] | null }
  after?: { json: unknown[] | null }
  repeat?: number
  cutStart?: number[] | null
  cutEnd?: number[] | null
}

export interface LivenotesPatternDef {
  json: unknown[] | null
  [key: string]: unknown
}

export interface LivenotesJson {
  sections: Array<{
    name: string
    lyrics: Array<{
      text: string
      measures: number | null
      style: string
    }>
    pattern?: LivenotesPatternRef
  }>
  patterns?: Record<string, LivenotesPatternDef>
}

export interface SongcodeNoteData {
  livenotes_json: LivenotesJson | null
  livenotes_json_updated_at: string | null
}

export interface LooperNoteData {
  bpm: string
  pattern1: string
  pattern1_var: string
  pattern2: string
  pattern2_var: string
  comment: string
}

export interface LooperContent {
  bpm: string
  pattern1: string
  pattern1_var: string
  pattern2: string
  pattern2_var: string
  comment: string
}

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

export interface NoteWithSong extends Note {
  library_song: LibrarySongWithSong
}
