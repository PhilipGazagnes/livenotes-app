import { supabase } from '@/lib/supabase'
import type { Json } from '@livenotes/shared/types/supabase'
import type { Note, NoteType, SongcodeNoteData, LooperNoteData } from '@livenotes/shared/types'
import { selectNotes } from '@livenotes/shared/offline'
import { readLocal } from '@/lib/offline/offlineData'
import { commitWrite } from '@/lib/offline/projectWrites'

export function fetchNotes(librarySongId: string): Promise<Note[]> {
  return readLocal(snapshot => selectNotes(snapshot, librarySongId))
}

export function insertNote(payload: {
  library_song_id: string
  type: NoteType
  content: string | null
  data: SongcodeNoteData | LooperNoteData | null
  title: string | null
  created_by: string
  updated_by: string
  display_order: number
}): Promise<Note> {
  return commitWrite(
    async () => {
      const { data, error } = await supabase
        .from('notes')
        .insert({ ...payload, data: payload.data as unknown as Json })
        .select()
        .single()
      if (error) throw error
      return data as unknown as Note
    },
    { librarySongIds: [payload.library_song_id] },
  )
}

export function updateNote(
  noteId: string,
  updates: {
    title?: string
    content?: string | null
    display_order?: number
    data?: SongcodeNoteData | LooperNoteData | null
  },
  userId: string
): Promise<void> {
  return commitWrite(
    async () => {
      const { data, error } = await supabase
        .from('notes')
        .update({
          ...updates,
          data: updates.data as unknown as Json | null,
          updated_by: userId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', noteId)
        .select('library_song_id')
      if (error) throw error
      return data.map(n => n.library_song_id)
    },
    librarySongIds => ({ librarySongIds }),
  ).then(() => undefined)
}

export function deleteNote(noteId: string): Promise<void> {
  return commitWrite(
    async () => {
      const { data, error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)
        .select('library_song_id')
      if (error) throw error
      return data.map(n => n.library_song_id)
    },
    librarySongIds => ({ librarySongIds }),
  ).then(() => undefined)
}

export function reorderNotes(noteIds: string[]): Promise<void> {
  return commitWrite(
    async () => {
      const librarySongIds: string[] = []
      for (let i = 0; i < noteIds.length; i++) {
        const { data, error } = await supabase
          .from('notes')
          .update({ display_order: i })
          .eq('id', noteIds[i])
          .select('library_song_id')
        if (error) throw error
        librarySongIds.push(...data.map(n => n.library_song_id))
      }
      return librarySongIds
    },
    librarySongIds => ({ librarySongIds }),
  ).then(() => undefined)
}

export function getNoteById(noteId: string): Promise<Note | null> {
  return readLocal(snapshot => snapshot.notes.find(n => n.id === noteId) ?? null)
}
