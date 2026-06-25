import { supabase } from '@/lib/supabase'

type RpcFn = (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: Error | null }>

export async function pushNoteToProject(
  noteId: string,
  targetProjectId: string,
): Promise<{ noteId: string; librarySongId: string }> {
  const { data, error } = await (supabase.rpc as unknown as RpcFn)('push_note_to_project', {
    p_note_id: noteId,
    p_target_project_id: targetProjectId,
  })

  if (error) throw error
  const result = data as { note_id: string; library_song_id: string }
  return { noteId: result.note_id, librarySongId: result.library_song_id }
}
