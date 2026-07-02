import { supabase } from '@/lib/supabase'
import type { Project, ProjectRole } from '@/types/database'

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
    .single()

  if (error) return null
  return data as unknown as Project
}

export async function fetchProjectById(projectId: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, slug, owner_id, created_at, updated_at, description, thumbnail_url, contact_enabled, contact_info')
    .eq('id', projectId)
    .single()

  if (error) return null
  return data as unknown as Project
}

export async function deleteProject(projectId: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
  if (error) throw error
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
