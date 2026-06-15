import { supabase } from '@/lib/supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyQuery = any

export async function fetchProjectSettings(projectId: string) {
  const { data, error } = await (supabase as AnyQuery)
    .from('projects')
    .select('name, description, notes_field_label, notes_field_enabled, slug, thumbnail_url, contact_enabled, contact_info')
    .eq('id', projectId)
    .single()
  if (error) throw error
  return data as { name: string; description: string | null; notes_field_label: string; notes_field_enabled: boolean; slug: string | null; thumbnail_url: string | null; contact_enabled: boolean; contact_info: Record<string, string> | null }
}

export async function updateProjectSettings(
  projectId: string,
  updates: { name?: string; description?: string | null; notes_field_label?: string; notes_field_enabled?: boolean; slug?: string | null; thumbnail_url?: string | null; contact_enabled?: boolean; contact_info?: Record<string, string> | null }
): Promise<void> {
  const { error } = await (supabase as AnyQuery)
    .from('projects')
    .update(updates)
    .eq('id', projectId)
  if (error) throw error
}

export async function fetchProjectPublicInfo(projectId: string) {
  const { data, error } = await (supabase as AnyQuery)
    .from('projects')
    .select('name, description, thumbnail_url, contact_enabled, contact_info')
    .eq('id', projectId)
    .single()
  if (error) return null
  return data as { name: string; description: string | null; thumbnail_url: string | null; contact_enabled: boolean; contact_info: Record<string, string> | null }
}
