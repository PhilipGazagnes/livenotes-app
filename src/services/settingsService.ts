import { supabase } from '@/lib/supabase'

type ProjectSettings = {
  name: string
  description: string | null
  notes_field_label: string
  notes_field_enabled: boolean
  slug: string | null
  thumbnail_url: string | null
  contact_enabled: boolean
  contact_info: Record<string, string> | null
}

type ProjectPublicInfo = {
  name: string
  description: string | null
  thumbnail_url: string | null
  contact_enabled: boolean
  contact_info: Record<string, string> | null
}

export async function fetchProjectSettings(projectId: string): Promise<ProjectSettings> {
  const { data, error } = await supabase
    .from('projects')
    .select('name, description, notes_field_label, notes_field_enabled, slug, thumbnail_url, contact_enabled, contact_info')
    .eq('id', projectId)
    .single()
  if (error) throw error
  return data as unknown as ProjectSettings
}

export async function updateProjectSettings(
  projectId: string,
  updates: { name?: string; description?: string | null; notes_field_label?: string; notes_field_enabled?: boolean; slug?: string | null; thumbnail_url?: string | null; contact_enabled?: boolean; contact_info?: Record<string, string> | null }
): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update(updates as Record<string, unknown>)
    .eq('id', projectId)
  if (error) throw error
}

export async function fetchProjectPublicInfo(projectId: string): Promise<ProjectPublicInfo | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('name, description, thumbnail_url, contact_enabled, contact_info')
    .eq('id', projectId)
    .single()
  if (error) return null
  return data as unknown as ProjectPublicInfo
}
