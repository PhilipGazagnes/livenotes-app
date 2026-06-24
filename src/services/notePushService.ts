import { supabase } from '@/lib/supabase'

export async function pushNoteToProject(
  noteId: string,
  targetProjectId: string,
): Promise<{ noteId: string; librarySongId: string }> {
  const { data, error } = await (supabase.rpc as any)('push_note_to_project', {
    p_note_id: noteId,
    p_target_project_id: targetProjectId,
  })

  if (error) throw error
  return { noteId: data.note_id, librarySongId: data.library_song_id }
}
