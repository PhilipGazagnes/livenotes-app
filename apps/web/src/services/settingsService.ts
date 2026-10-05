import { supabase } from '@/lib/supabase'
import { OfflineDataUnavailableError } from '@livenotes/shared/offline'
import { readLocal } from '@/lib/offline/offlineData'
import { commitWrite } from '@/lib/offline/projectWrites'

type ProjectSettings = {
  name: string
  description: string | null
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

export function fetchProjectSettings(projectId: string): Promise<ProjectSettings> {
  return readLocal(
    snapshot => {
      if (!snapshot.project) throw new OfflineDataUnavailableError()
      const { name, description, slug, thumbnail_url, contact_enabled, contact_info } = snapshot.project
      return { name, description, slug, thumbnail_url, contact_enabled, contact_info: (contact_info as Record<string, string> | null) }
    },
    { projectId },
  )
}

export function updateProjectSettings(
  projectId: string,
  updates: { name?: string; description?: string | null; slug?: string | null; thumbnail_url?: string | null; contact_enabled?: boolean; contact_info?: Record<string, string> | null }
): Promise<void> {
  return commitWrite(
    async () => {
      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId)
      if (error) throw error
    },
    { project: true },
  )
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
