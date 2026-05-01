import { supabase } from '@/lib/supabase'

export async function createPersonalProject(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      name: 'My Songs',
      type: 'personal',
      owner_id: userId,
    })
    .select('id')
    .single()

  if (error) throw error
  return data.id
}

export async function fetchPersonalProjects(userId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('id, created_at')
    .eq('owner_id', userId)
    .eq('type', 'personal')
    .order('created_at', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function countProjectSongs(projectId: string): Promise<number> {
  const { count } = await supabase
    .from('library_songs')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)

  return count ?? 0
}
