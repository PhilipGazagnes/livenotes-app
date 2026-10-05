import { supabase } from '@/lib/supabase'
import type { LibrarySong, LibrarySongWithDetails } from '@livenotes/shared/types'
import { selectLibrarySongs, selectLibrarySongWithDetails } from '@livenotes/shared/offline'
import { readLocal } from '@/lib/offline/offlineData'
import { commitWrite } from '@/lib/offline/projectWrites'

export function fetchLibrarySongWithDetails(id: string): Promise<LibrarySongWithDetails> {
  return readLocal(snapshot => {
    const librarySong = selectLibrarySongWithDetails(snapshot, id)
    if (!librarySong) throw new Error('This song is not in the local copy. Sync and try again.')
    return librarySong
  })
}

export function fetchLibrarySongs(projectId: string): Promise<LibrarySongWithDetails[]> {
  return readLocal(selectLibrarySongs, { projectId })
}

export function addToLibrary(
  projectId: string,
  songId: string,
  userId: string
): Promise<LibrarySong> {
  return commitWrite(
    async () => {
      const { data, error } = await supabase
        .from('library_songs')
        .insert({ project_id: projectId, song_id: songId, added_by: userId })
        .select()
        .single()
      if (error) throw error
      return data
    },
    librarySong => ({ librarySongIds: [librarySong.id] }),
  )
}

export function removeFromLibrary(librarySongId: string): Promise<void> {
  return removeManyFromLibrary([librarySongId])
}

export function removeManyFromLibrary(librarySongIds: string[]): Promise<void> {
  return commitWrite(
    async () => {
      const { error } = await supabase
        .from('library_songs')
        .delete()
        .in('id', librarySongIds)
      if (error) throw error
    },
    { removedLibrarySongIds: librarySongIds },
  )
}

export function updateLibrarySong(
  librarySongId: string,
  updates: { custom_title?: string; custom_notes?: string }
): Promise<void> {
  return commitWrite(
    async () => {
      const { error } = await supabase
        .from('library_songs')
        .update(updates)
        .eq('id', librarySongId)
      if (error) throw error
    },
    { librarySongIds: [librarySongId] },
  )
}
