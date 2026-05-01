import { supabase } from '@/lib/supabase'
import type { Tag } from '@/types/database'

export async function fetchTags(projectId: string): Promise<Tag[]> {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('project_id', projectId)
    .order('name', { ascending: true })
  if (error) throw error
  return data
}

export async function createTag(projectId: string, name: string): Promise<Tag> {
  const { data, error } = await supabase
    .from('tags')
    .insert({ project_id: projectId, name: name.trim() })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateTag(tagId: string, name: string): Promise<Tag> {
  const { data, error } = await supabase
    .from('tags')
    .update({ name: name.trim() })
    .eq('id', tagId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteTag(tagId: string): Promise<void> {
  const { error } = await supabase.from('tags').delete().eq('id', tagId)
  if (error) throw error
}

export async function tagLibrarySong(librarySongId: string, tagId: string): Promise<void> {
  const { error } = await supabase
    .from('library_song_tags')
    .insert({ library_song_id: librarySongId, tag_id: tagId })
  if (error) throw error
}

export async function untagLibrarySong(librarySongId: string, tagId: string): Promise<void> {
  const { error } = await supabase
    .from('library_song_tags')
    .delete()
    .eq('library_song_id', librarySongId)
    .eq('tag_id', tagId)
  if (error) throw error
}

export async function bulkAssignTags(librarySongIds: string[], tagIds: string[]): Promise<void> {
  const inserts = librarySongIds.flatMap(librarySongId =>
    tagIds.map(tagId => ({ library_song_id: librarySongId, tag_id: tagId }))
  )
  const { error } = await supabase.from('library_song_tags').insert(inserts)
  if (error) throw error
}

export async function bulkRemoveTags(librarySongIds: string[], tagIds: string[]): Promise<void> {
  for (const librarySongId of librarySongIds) {
    for (const tagId of tagIds) {
      const { error } = await supabase
        .from('library_song_tags')
        .delete()
        .eq('library_song_id', librarySongId)
        .eq('tag_id', tagId)
      if (error) throw error
    }
  }
}
