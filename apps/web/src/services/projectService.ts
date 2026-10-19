import { supabase } from '@/lib/supabase'
import type { Project, ProjectRole } from '@livenotes/shared/types'
import { fetchProjectRow } from '@livenotes/shared/offline'
import { hasLocalCopy, readLocal, removeLocalCopy } from '@/lib/offline/offlineData'
import { isOfflineMode } from '@/lib/offline/offlineState'

export interface ProjectWithRole extends Project {
  membership_role: ProjectRole
}

export async function fetchUserProjects(userId: string): Promise<ProjectWithRole[]> {
  const { data, error } = await supabase
    .from('project_memberships')
    .select('role, project:projects(*)')
    .eq('user_id', userId)

  if (error) throw error
  return (data ?? []).map((m) => ({
    ...(m.project as unknown as Project),
    membership_role: m.role as ProjectRole,
  }))
}

export async function fetchCommunityProject(): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, slug, owner_id, created_at, updated_at, description, thumbnail_url, contact_enabled, contact_info')
    .eq('slug', 'community')
    .maybeSingle()

  if (error) throw error
  return data as unknown as Project | null
}

/**
 * The project row, from its local copy. Without a copy (local data deleted),
 * fetched online: the project's identity (name, picture) is always shown, its
 * content only once synced.
 */
export async function fetchProjectById(projectId: string): Promise<Project | null> {
  const project = await readLocal(snapshot => snapshot.project, { projectId })
  if (project || isOfflineMode() || await hasLocalCopy(projectId)) return project
  return fetchProjectRow(supabase, projectId)
}

export async function deleteProject(projectId: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
  if (error) throw error
  await removeLocalCopy(projectId)
}

export async function createProject(name: string, userId: string): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert({ name, owner_id: userId })
    .select('id, name, slug, owner_id, created_at, updated_at, description, thumbnail_url, contact_enabled, contact_info')
    .single()

  if (error) throw error
  return data as unknown as Project
}
