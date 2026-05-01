import { supabase } from '@/lib/supabase'
import type { Json } from '@/types/supabase'
import type { Note, NoteType, SongcodeNoteData, LooperNoteData } from '@/types/database'

const NOTE_COLUMNS = 'id, library_song_id, type, title, content, data, display_order, created_at, updated_at, is_public, is_shareable, created_by, updated_by, share_token'

export async function fetchNotes(librarySongId: string): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select(NOTE_COLUMNS)
    .eq('library_song_id', librarySongId)
    .order('type')
    .order('display_order')
  if (error) throw error
  return (data || []) as unknown as Note[]
}

export async function insertNote(payload: {
  library_song_id: string
  type: NoteType
  content: string | null
  data: SongcodeNoteData | LooperNoteData | null
  title: string | null
  created_by: string
  updated_by: string
  display_order: number
}): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .insert({ ...payload, data: payload.data as unknown as Json })
    .select()
    .single()
  if (error) throw error
  return data as unknown as Note
}

export async function updateNote(
  noteId: string,
  updates: {
    title?: string
    content?: string | null
    display_order?: number
    data?: SongcodeNoteData | LooperNoteData | null
  },
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('notes')
    .update({
      ...updates,
      data: updates.data as unknown as Json | null,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', noteId)
  if (error) throw error
}

export async function deleteNote(noteId: string): Promise<void> {
  const { error } = await supabase.from('notes').delete().eq('id', noteId)
  if (error) throw error
}

export async function reorderNotes(noteIds: string[]): Promise<void> {
  for (let i = 0; i < noteIds.length; i++) {
    const { error } = await supabase
      .from('notes')
      .update({ display_order: i })
      .eq('id', noteIds[i])
    if (error) throw error
  }
}

export async function getNoteById(noteId: string): Promise<Note | null> {
  const { data, error } = await supabase
    .from('notes')
    .select(NOTE_COLUMNS)
    .eq('id', noteId)
    .single()
  if (error) throw error
  return data as unknown as Note
}
