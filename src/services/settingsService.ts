import { supabase } from '@/lib/supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyQuery = any

export async function fetchProjectSettings(projectId: string) {
  const { data, error } = await (supabase as AnyQuery)
    .from('projects')
    .select('notes_field_label, notes_field_enabled, slug')
    .eq('id', projectId)
    .single()
  if (error) throw error
  return data as { notes_field_label: string; notes_field_enabled: boolean; slug: string | null }
}

export async function updateProjectSettings(
  projectId: string,
  updates: { notes_field_label?: string; notes_field_enabled?: boolean; slug?: string | null }
): Promise<void> {
  const { error } = await (supabase as AnyQuery)
    .from('projects')
    .update(updates)
    .eq('id', projectId)
  if (error) throw error
}
