import { supabase } from '@/lib/supabase'
import type { ProjectRole, InvitationLink, Project } from '@/types/database'

export interface MemberWithProfile {
  id: string
  user_id: string
  role: ProjectRole
  joined_at: string
  display_name: string
  avatar_url: string | null
}

export interface InvitationWithProject extends InvitationLink {
  project: Pick<Project, 'id' | 'name' | 'thumbnail_url'>
}

export async function fetchUserRoleInProject(projectId: string, userId: string): Promise<ProjectRole | null> {
  const { data, error } = await supabase
    .from('project_memberships')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .single()
  if (error || !data) return null
  return data.role as ProjectRole
}

export async function fetchProjectMembers(projectId: string): Promise<MemberWithProfile[]> {
  const { data: memberships, error } = await supabase
    .from('project_memberships')
    .select('id, user_id, role, joined_at')
    .eq('project_id', projectId)
    .order('joined_at')

  if (error) throw error
  if (!memberships.length) return []

  const userIds = memberships.map(m => m.user_id)
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .in('id', userIds)

  if (profilesError) throw profilesError

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))
  return memberships.map(m => ({
    id: m.id,
    user_id: m.user_id,
    role: m.role as ProjectRole,
    joined_at: m.joined_at,
    display_name: profileMap[m.user_id]?.display_name ?? 'Unknown',
    avatar_url: profileMap[m.user_id]?.avatar_url ?? null,
  }))
}

export async function removeMember(membershipId: string): Promise<void> {
  const { error } = await supabase
    .from('project_memberships')
    .delete()
    .eq('id', membershipId)
  if (error) throw error
}

export async function updateMemberRole(membershipId: string, role: ProjectRole): Promise<void> {
  const { error } = await supabase
    .from('project_memberships')
    .update({ role })
    .eq('id', membershipId)
  if (error) throw error
}

export async function createInvitationLink(
  projectId: string,
  role: ProjectRole,
  userId: string,
): Promise<InvitationLink> {
  const { data, error } = await supabase
    .from('invitation_links')
    .insert({ project_id: projectId, role, created_by: userId })
    .select('id, project_id, token, role, created_by, created_at, expires_at, used_by, used_at, is_revoked')
    .single()
  if (error) throw error
  return data as InvitationLink
}

export async function revokeInvitationLink(id: string): Promise<void> {
  const { error } = await supabase
    .from('invitation_links')
    .update({ is_revoked: true })
    .eq('id', id)
  if (error) throw error
}

export async function fetchActiveInvitationLinks(projectId: string): Promise<InvitationLink[]> {
  const { data, error } = await supabase
    .from('invitation_links')
    .select('id, project_id, token, role, created_by, created_at, expires_at, used_by, used_at, is_revoked')
    .eq('project_id', projectId)
    .eq('is_revoked', false)
    .gt('expires_at', new Date().toISOString())
    .is('used_by', null)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as InvitationLink[]
}

export async function fetchInvitationByToken(token: string): Promise<InvitationWithProject | null> {
  const { data, error } = await supabase
    .from('invitation_links')
    .select('*, project:projects(id, name, thumbnail_url)')
    .eq('token', token)
    .eq('is_revoked', false)
    .is('used_by', null)
    .maybeSingle()
  if (error || !data) return null
  return data as unknown as InvitationWithProject
}

type RpcFn = (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: Error | null }>

export async function joinViaToken(token: string): Promise<{ project_id: string; already_member: boolean }> {
  const { data, error } = await (supabase.rpc as unknown as RpcFn)('join_project_via_invitation', { p_token: token })
  if (error) throw error
  return data as { project_id: string; already_member: boolean }
}
