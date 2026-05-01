import { supabase } from '@/lib/supabase'

export async function fetchProjectSettings(projectId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('notes_field_label, notes_field_enabled')
    .eq('id', projectId)
    .single()
  if (error) throw error
  return data
}

export async function updateProjectSettings(
  projectId: string,
  updates: { notes_field_label?: string; notes_field_enabled?: boolean }
): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId)
  if (error) throw error
}
