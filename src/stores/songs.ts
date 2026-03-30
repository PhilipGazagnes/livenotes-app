import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/utils/supabase'
import type { Song, SongWithTags } from '@/types/database'
import type { Tag } from '@/types/database'
import { useAuthStore } from './auth'

export const useSongsStore = defineStore('songs', () => {
  // State
  const songs = ref<SongWithTags[]>([])
  const currentSong = ref<SongWithTags | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const searchQuery = ref('')
  const selectedTagIds = ref<string[]>([])

  // Getters
  const filteredSongs = computed(() => {
    let result = songs.value

    // Filter by search query
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter((song: SongWithTags) => 
        song.title.toLowerCase().includes(query) ||
        song.artist?.toLowerCase().includes(query) ||
        song.livenotes_poc_id?.toLowerCase().includes(query) ||
        song.notes?.toLowerCase().includes(query)
      )
    }

    // Filter by tags (AND logic - song must have all selected tags)
    if (selectedTagIds.value.length > 0) {
      result = result.filter((song: SongWithTags) => {
        const songTagIds = song.tags?.map((t: Tag) => t.id) ?? []
        return selectedTagIds.value.every(tagId => songTagIds.includes(tagId))
      })
    }

    return result
  })

  const songCount = computed(() => songs.value.length)
  const filteredSongCount = computed(() => filteredSongs.value.length)

  // Actions
  async function fetchSongs(projectId: string) {
    isLoading.value = true
    error.value = null
    
    try {
      const { data, error: fetchError } = await supabase
        .from('songs')
        .select(`
          *,
          tags:song_tags(
            tag:tags(*)
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
      
      if (fetchError) throw fetchError
      
      // Transform the data to flatten tags
      songs.value = data.map(song => ({
        ...song,
        tags: song.tags?.map((st: any) => st.tag) ?? []
      }))
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch songs'
    } finally {
      isLoading.value = false
    }
  }

  async function fetchSongById(songId: string) {
    isLoading.value = true
    error.value = null
    
    try {
      const { data, error: fetchError } = await supabase
        .from('songs')
        .select(`
          *,
          tags:song_tags(
            tag:tags(*)
          )
        `)
        .eq('id', songId)
        .single()
      
      if (fetchError) throw fetchError
      
      currentSong.value = {
        ...data,
        tags: data.tags?.map((st: any) => st.tag) ?? []
      }
      
      return currentSong.value
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch song'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function createSong(songData: Partial<Song>, tagIds: string[] = []) {
    const authStore = useAuthStore()
    if (!authStore.userId) {
      error.value = 'User not authenticated'
      return { success: false, error: error.value }
    }

    isLoading.value = true
    error.value = null
    
    try {
      // Create song
      const { data: newSong, error: createError } = await supabase
        .from('songs')
        .insert({
          ...songData,
          created_by: authStore.userId,
          updated_by: authStore.userId,
        })
        .select()
        .single()
      
      if (createError) throw createError
      
      // Add tags if provided
      if (tagIds.length > 0) {
        const songTags = tagIds.map(tagId => ({
          song_id: newSong.id,
          tag_id: tagId,
        }))
        
        const { error: tagError } = await supabase
          .from('song_tags')
          .insert(songTags)
        
        if (tagError) throw tagError
      }
      
      // Refresh songs list
      if (songData.project_id) {
        await fetchSongs(songData.project_id)
      }
      
      return { success: true, data: newSong }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create song'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function updateSong(songId: string, songData: Partial<Song>, tagIds?: string[]) {
    const authStore = useAuthStore()
    if (!authStore.userId) {
      error.value = 'User not authenticated'
      return { success: false, error: error.value }
    }

    isLoading.value = true
    error.value = null
    
    try {
      // Update song
      const { data: updatedSong, error: updateError } = await supabase
        .from('songs')
        .update({
          ...songData,
          updated_by: authStore.userId,
        })
        .eq('id', songId)
        .select()
        .single()
      
      if (updateError) throw updateError
      
      // Update tags if provided
      if (tagIds !== undefined) {
        // Remove existing tags
        await supabase
          .from('song_tags')
          .delete()
          .eq('song_id', songId)
        
        // Add new tags
        if (tagIds.length > 0) {
          const songTags = tagIds.map(tagId => ({
            song_id: songId,
            tag_id: tagId,
          }))
          
          const { error: tagError } = await supabase
            .from('song_tags')
            .insert(songTags)
          
          if (tagError) throw tagError
        }
      }
      
      // Refresh songs list
      if (updatedSong.project_id) {
        await fetchSongs(updatedSong.project_id)
      }
      
      return { success: true, data: updatedSong }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update song'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function deleteSong(songId: string, projectId: string) {
    isLoading.value = true
    error.value = null
    
    try {
      const { error: deleteError } = await supabase
        .from('songs')
        .delete()
        .eq('id', songId)
      
      if (deleteError) throw deleteError
      
      // Refresh songs list
      await fetchSongs(projectId)
      
      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete song'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function bulkDelete(songIds: string[], projectId: string) {
    isLoading.value = true
    error.value = null
    
    try {
      const { error: deleteError } = await supabase
        .from('songs')
        .delete()
        .in('id', songIds)
      
      if (deleteError) throw deleteError
      
      // Refresh songs list
      await fetchSongs(projectId)
      
      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete songs'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  function setSearchQuery(query: string) {
    searchQuery.value = query
  }

  function setSelectedTags(tagIds: string[]) {
    selectedTagIds.value = tagIds
  }

  function clearFilters() {
    searchQuery.value = ''
    selectedTagIds.value = []
  }

  return {
    // State
    songs,
    currentSong,
    isLoading,
    error,
    searchQuery,
    selectedTagIds,
    // Getters
    filteredSongs,
    songCount,
    filteredSongCount,
    // Actions
    fetchSongs,
    fetchSongById,
    createSong,
    updateSong,
    deleteSong,
    bulkDelete,
    setSearchQuery,
    setSelectedTags,
    clearFilters,
  }
})
