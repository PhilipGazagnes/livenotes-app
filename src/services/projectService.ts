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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((m: any) => ({
    ...(m.project as Project),
    membership_role: m.role as ProjectRole,
  }))
}

export async function fetchCommunityProject(): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('slug', 'community')
    .single()

  if (error) return null
  return data as unknown as Project
}

export async function fetchProjectById(projectId: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()

  if (error) return null
  return data as unknown as Project
}

export async function createProject(name: string, userId: string): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert({ name, owner_id: userId })
    .select('*')
    .single()

  if (error) throw error
  return data as unknown as Project
}
