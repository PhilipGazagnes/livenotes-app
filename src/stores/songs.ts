import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
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
      result = result.filter((song: SongWithTags) => {
        const artistNames = song.artists?.map(a => a.name.toLowerCase()).join(' ') ?? ''
        return song.title.toLowerCase().includes(query) ||
          song.artist?.toLowerCase().includes(query) ||
          artistNames.includes(query) ||
          song.livenotes_poc_id?.toLowerCase().includes(query) ||
          song.notes?.toLowerCase().includes(query)
      })
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
          ),
          lists:list_items(
            list:lists(*)
          ),
          artists:song_artists(
            position,
            artist:artists(*)
          )
        `)
        .eq('project_id', projectId)
        .order('title', { ascending: true })
      
      if (fetchError) throw fetchError
      
      // Transform the data to flatten tags, lists, and artists
      songs.value = (data || []).map(song => ({
        ...song,
        tags: song.tags?.map((st: any) => st.tag).filter(Boolean) ?? [],
        lists: song.lists?.map((li: any) => li.list).filter(Boolean) ?? [],
        artists: song.artists?.map((sa: any) => ({
          ...sa.artist,
          position: sa.position
        })).sort((a: any, b: any) => a.position - b.position) ?? []
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
          ),
          artists:song_artists(
            position,
            artist:artists(*)
          )
        `)
        .eq('id', songId)
        .single()
      
      if (fetchError) throw fetchError
      
      currentSong.value = {
        ...data,
        tags: data.tags?.map((st: any) => st.tag) ?? [],
        lists: [],
        artists: data.artists?.map((sa: any) => ({
          ...sa.artist,
          position: sa.position
        })).sort((a: any, b: any) => a.position - b.position) ?? []
      }
      
      return currentSong.value
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch song'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function createSong(songData: Partial<Song>, tagIds: string[] = [], artistIds: string[] = []) {
    const authStore = useAuthStore()
    if (!authStore.userId) {
      error.value = 'User not authenticated'
      return { success: false, error: error.value }
    }

    isLoading.value = true
    error.value = null
    
    try {
      if (!songData.project_id) throw new Error('project_id is required')

      // Create song
      const { data: newSong, error: createError } = await supabase
        .from('songs')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert({ ...songData, created_by: authStore.userId, updated_by: authStore.userId } as any)
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
      
      // Add artists if provided
      if (artistIds.length > 0) {
        const songArtists = artistIds.map((artistId, index) => ({
          song_id: newSong.id,
          artist_id: artistId,
          position: index + 1,
        }))
        
        const { error: artistError } = await supabase
          .from('song_artists')
          .insert(songArtists)
        
        if (artistError) throw artistError
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

  async function updateSong(songId: string, songData: Partial<Song>, projectId: string, tagIds?: string[], artistIds?: string[]) {
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
      if (tagIds !== undefined && Array.isArray(tagIds)) {
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
      
      // Update artists if provided
      if (artistIds !== undefined && Array.isArray(artistIds)) {
        // Remove existing artists
        await supabase
          .from('song_artists')
          .delete()
          .eq('song_id', songId)
        
        // Add new artists
        if (artistIds.length > 0) {
          const songArtists = artistIds.map((artistId, index) => ({
            song_id: songId,
            artist_id: artistId,
            position: index + 1,
          }))
          
          const { error: artistError } = await supabase
            .from('song_artists')
            .insert(songArtists)
          
          if (artistError) throw artistError
        }
      }
      
      // Refresh songs list
      await fetchSongs(projectId)
      
      return { success: true, data: updatedSong }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update song'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function deleteSong(songId: string, _projectId: string) {
    isLoading.value = true
    error.value = null
    
    try {
      const { error: deleteError } = await supabase
        .from('songs')
        .delete()
        .eq('id', songId)
      
      if (deleteError) throw deleteError
      
      // Remove song from local state instead of re-fetching everything
      songs.value = songs.value.filter(song => song.id !== songId)
      
      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete song'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function bulkDelete(songIds: string[], _projectId: string) {
    isLoading.value = true
    error.value = null
    
    try {
      const { error: deleteError } = await supabase
        .from('songs')
        .delete()
        .in('id', songIds)
      
      if (deleteError) throw deleteError
      
      // Remove songs from local state instead of re-fetching everything
      songs.value = songs.value.filter(song => !songIds.includes(song.id))
      
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

  async function refreshSongTags(songId: string) {
    // Fetch updated tags for a single song without refetching entire list
    try {
      const { data, error: fetchError } = await supabase
        .from('songs')
        .select(`
          tags:song_tags(
            tag:tags(*)
          )
        `)
        .eq('id', songId)
        .single()
      
      if (fetchError) throw fetchError
      
      // Update the song in the local store
      const songIndex = songs.value.findIndex(s => s.id === songId)
      if (songIndex !== -1) {
        songs.value[songIndex].tags = data.tags?.map((st: any) => st.tag).filter(Boolean) ?? []
      }
    } catch (err) {
      console.error('Failed to refresh song tags:', err)
    }
  }

  async function refreshSongLists(songId: string) {
    // Fetch updated lists for a single song without refetching entire list
    try {
      const { data, error: fetchError } = await supabase
        .from('songs')
        .select(`
          lists:list_items(
            list:lists(*)
          )
        `)
        .eq('id', songId)
        .single()
      
      if (fetchError) throw fetchError
      
      // Update the song in the local store
      const songIndex = songs.value.findIndex(s => s.id === songId)
      if (songIndex !== -1) {
        songs.value[songIndex].lists = data.lists?.map((li: any) => li.list).filter(Boolean) ?? []
      }
    } catch (err) {
      console.error('Failed to refresh song lists:', err)
    }
  }
  
  async function refreshSongArtists(songId: string) {
    // Fetch updated artists for a single song without refetching entire list
    try {
      const { data, error: fetchError } = await supabase
        .from('songs')
        .select(`
          artists:song_artists(
            position,
            artist:artists(*)
          )
        `)
        .eq('id', songId)
        .single()
      
      if (fetchError) throw fetchError
      
      // Update the song in the local store
      const songIndex = songs.value.findIndex(s => s.id === songId)
      if (songIndex !== -1) {
        songs.value[songIndex].artists = data.artists?.map((sa: any) => ({
          ...sa.artist,
          position: sa.position
        })).sort((a: any, b: any) => a.position - b.position) ?? []
      }
    } catch (err) {
      console.error('Failed to refresh song artists:', err)
    }
  }
  
  async function updateSongArtists(songId: string, artistIds: string[]) {
    // Helper method to update just the artists for a song
    isLoading.value = true
    error.value = null
    
    try {
      // Remove existing artists
      await supabase
        .from('song_artists')
        .delete()
        .eq('song_id', songId)
      
      // Add new artists
      if (artistIds.length > 0) {
        const songArtists = artistIds.map((artistId, index) => ({
          song_id: songId,
          artist_id: artistId,
          position: index + 1,
        }))
        
        const { error: artistError } = await supabase
          .from('song_artists')
          .insert(songArtists)
        
        if (artistError) throw artistError
      }
      
      // Refresh the song's artists
      await refreshSongArtists(songId)
      
      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update song artists'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
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
    refreshSongTags,
    refreshSongLists,
    refreshSongArtists,
    updateSongArtists,
  }
})
