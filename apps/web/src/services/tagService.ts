import { supabase } from '@/lib/supabase'
import type { Tag } from '@livenotes/shared/types'
import { selectTags, selectTagSongCounts } from '@livenotes/shared/offline'
import { readLocal } from '@/lib/offline/offlineData'
import { commitWrite } from '@/lib/offline/projectWrites'

export function fetchTags(projectId: string): Promise<Tag[]> {
  return readLocal(selectTags, { projectId })
}

export function createTag(projectId: string, name: string): Promise<Tag> {
  return commitWrite(
    async () => {
      const { data, error } = await supabase
        .from('tags')
        .insert({ project_id: projectId, name: name.trim() })
        .select()
        .single()
      if (error) throw error
      return data
    },
    { tags: true },
  )
}

export function updateTag(tagId: string, name: string): Promise<Tag> {
  return commitWrite(
    async () => {
      const { data, error } = await supabase
        .from('tags')
        .update({ name: name.trim() })
        .eq('id', tagId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    { tags: true },
  )
}

export function deleteTag(tagId: string): Promise<void> {
  return commitWrite(
    async () => {
      const { error } = await supabase.from('tags').delete().eq('id', tagId)
      if (error) throw error
    },
    { removedTagIds: [tagId] },
  )
}

export function tagLibrarySong(librarySongId: string, tagId: string): Promise<void> {
  return setLibrarySongTags(librarySongId, [tagId], [])
}

export function untagLibrarySong(librarySongId: string, tagId: string): Promise<void> {
  return setLibrarySongTags(librarySongId, [], [tagId])
}

/** Add and remove tags on one library song. */
export function setLibrarySongTags(librarySongId: string, tagIdsToAdd: string[], tagIdsToRemove: string[]): Promise<void> {
  return commitWrite(
    async () => {
      if (tagIdsToRemove.length > 0) {
        const { error } = await supabase
          .from('library_song_tags')
          .delete()
          .eq('library_song_id', librarySongId)
          .in('tag_id', tagIdsToRemove)
        if (error) throw error
      }
      if (tagIdsToAdd.length > 0) {
        const { error } = await supabase
          .from('library_song_tags')
          .insert(tagIdsToAdd.map(tagId => ({ library_song_id: librarySongId, tag_id: tagId })))
        if (error) throw error
      }
    },
    { librarySongIds: [librarySongId] },
  )
}

export function bulkAssignTags(librarySongIds: string[], tagIds: string[]): Promise<void> {
  return commitWrite(
    async () => {
      const inserts = librarySongIds.flatMap(librarySongId =>
        tagIds.map(tagId => ({ library_song_id: librarySongId, tag_id: tagId }))
      )
      const { error } = await supabase.from('library_song_tags').insert(inserts)
      if (error) throw error
    },
    { librarySongIds },
  )
}

export function fetchTagSongCounts(tagIds: string[]): Promise<Map<string, number>> {
  return readLocal(snapshot => selectTagSongCounts(snapshot, tagIds))
}

export function bulkRemoveTags(librarySongIds: string[], tagIds: string[]): Promise<void> {
  return commitWrite(
    async () => {
      const { error } = await supabase
        .from('library_song_tags')
        .delete()
        .in('library_song_id', librarySongIds)
        .in('tag_id', tagIds)
      if (error) throw error
    },
    { librarySongIds },
  )
}
