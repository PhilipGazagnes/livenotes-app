import { supabase } from '@/lib/supabase'
import type { Tag } from '@livenotes/shared/types'
import { isNetworkError, selectTags, selectTagSongCounts } from '@livenotes/shared/offline'
import { readThrough } from '@/lib/offline/offlineData'
import { logger } from '@/utils/logger'

export function fetchTags(projectId: string): Promise<Tag[]> {
  return readThrough(() => fetchTagsRemote(projectId), selectTags, { projectId })
}

async function fetchTagsRemote(projectId: string): Promise<Tag[]> {
  const { data, error } = await supabase
    .from('tags')
    .select('id, project_id, name, created_at')
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

export function fetchTagSongCounts(tagIds: string[]): Promise<Map<string, number>> {
  return readThrough(() => fetchTagSongCountsRemote(tagIds), snapshot => selectTagSongCounts(snapshot, tagIds))
}

async function fetchTagSongCountsRemote(tagIds: string[]): Promise<Map<string, number>> {
  const counts = new Map(tagIds.map(id => [id, 0]))
  const { data, error } = await supabase
    .from('library_song_tags')
    .select('tag_id')
    .in('tag_id', tagIds)
  if (error) {
    if (isNetworkError(error)) throw error
    logger.error('Failed to fetch tag song counts', error)
  }
  data?.forEach((row: { tag_id: string }) => {
    counts.set(row.tag_id, (counts.get(row.tag_id) ?? 0) + 1)
  })
  return counts
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
