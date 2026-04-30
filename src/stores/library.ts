import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/utils/supabase'
import type { LibrarySong, LibrarySongWithDetails, Tag } from '@/types/database'
import { useAuthStore } from './auth'

/**
 * Library Store (V2)
 * Manages the user's personal library (songs added from the global catalog)
 */
export const useLibraryStore = defineStore('library', () => {
  // State
  const librarySongs = ref<LibrarySongWithDetails[]>([])
  const currentLibrarySong = ref<LibrarySongWithDetails | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const searchQuery = ref('')
  const selectedTagIds = ref<string[]>([])

  const authStore = useAuthStore()

  // Getters
  
  /**
   * Get current project ID from auth store
   * In Phase 1, assume user has one personal project
   */
  const currentProjectId = computed(() => {
    // TODO: In Phase 3, this will be dynamic when multi-project support is added
    return authStore.personalProjectId || ''
  })

  /**
   * Filtered library songs based on search and tags
   */
  const filteredLibrarySongs = computed(() => {
    let result = librarySongs.value

    // Filter by search query
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter(ls => {
        const artistNames = ls.song.artists?.map(a => a.name.toLowerCase()).join(' ') ?? ''
        const customTitle = ls.custom_title?.toLowerCase() ?? ''
        const customNotes = ls.custom_notes?.toLowerCase() ?? ''
        
        return (
          ls.song.title.toLowerCase().includes(query) ||
          customTitle.includes(query) ||
          customNotes.includes(query) ||
          artistNames.includes(query)
        )
      })
    }

    // Filter by tags (AND logic - song must have all selected tags)
    if (selectedTagIds.value.length > 0) {
      result = result.filter(ls => {
        const songTagIds = ls.tags?.map((t: Tag) => t.id) ?? []
        return selectedTagIds.value.every(tagId => songTagIds.includes(tagId))
      })
    }

    return result
  })

  const librarySongCount = computed(() => librarySongs.value.length)
  const filteredSongCount = computed(() => filteredLibrarySongs.value.length)

  // Actions
  
  /**
   * Load all library songs for the current project
   */
  async function loadLibrary() {
    if (!currentProjectId.value) return
    
    isLoading.value = true
    error.value = null
    
    try {
      const { data, error: fetchError } = await supabase
        .from('library_songs')
        .select(`
          *,
          song:songs_v2!library_songs_song_id_fkey(
            *,
            artists:song_artists_v2(
              position,
              artist:artists_v2(*)
            )
          ),
          tags:library_song_tags(
            tag:tags(*)
          ),
          notes:notes(
            id,
            type,
            title,
            content,
            created_at,
            updated_at,
            display_order,
            is_public,
            is_shareable
          ),
          lists:list_items(
            list:lists(*)
          )
        `)
        .eq('project_id', currentProjectId.value)
        .order('added_at', { ascending: false })
      
      if (fetchError) throw fetchError
      
      // Transform the data
      librarySongs.value = (data || []).map(ls => ({
        ...ls,
        song: {
          ...ls.song,
          artists: ls.song.artists
            ?.map((sa: any) => ({
              ...sa.artist,
              position: sa.position,
            }))
            .filter(Boolean)
            .sort((a: any, b: any) => a.position - b.position) ?? [],
        },
        tags: ls.tags?.map((lst: any) => lst.tag).filter(Boolean) ?? [],
        notes: ls.notes ?? [],
        lists: ls.lists?.map((li: any) => li.list).filter(Boolean) ?? [],
      }))
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load library'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Add a song from the global catalog to the library
   */
  async function addToLibrary(songId: string): Promise<LibrarySong> {
    if (!currentProjectId.value) {
      throw new Error('No project selected')
    }
    
    isLoading.value = true
    error.value = null
    
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id
      
      const { data, error: insertError } = await supabase
        .from('library_songs')
        .insert({
          project_id: currentProjectId.value,
          song_id: songId,
          added_by: userId,
        })
        .select()
        .single()
      
      if (insertError) throw insertError
      
      // Update popularity score
      await supabase.rpc('increment_song_popularity', { song_id: songId })
      
      // Reload library to get full details
      await loadLibrary()
      
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add to library'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Remove a song from the library
   * This will also cascade delete all notes for this library song
   */
  async function removeFromLibrary(librarySongId: string) {
    isLoading.value = true
    error.value = null
    
    try {
      const { error: deleteError } = await supabase
        .from('library_songs')
        .delete()
        .eq('id', librarySongId)
      
      if (deleteError) throw deleteError
      
      await loadLibrary()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to remove from library'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Update custom metadata for a library song
   */
  async function updateLibrarySong(
    librarySongId: string,
    updates: { custom_title?: string; custom_notes?: string }
  ) {
    isLoading.value = true
    error.value = null
    
    try {
      const { error: updateError } = await supabase
        .from('library_songs')
        .update(updates)
        .eq('id', librarySongId)
      
      if (updateError) throw updateError
      
      await loadLibrary()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update library song'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get a single library song by ID
   */
  async function getLibrarySongById(librarySongId: string): Promise<LibrarySongWithDetails | null> {
    try {
      const { data, error: fetchError } = await supabase
        .from('library_songs')
        .select(`
          *,
          song:songs_v2!library_songs_song_id_fkey(
            *,
            artists:song_artists_v2(
              position,
              artist:artists_v2(*)
            )
          ),
          tags:library_song_tags(
            tag:tags(*)
          ),
          notes:notes(
            id,
            type,
            title
          ),
          lists:list_items(
            list:lists(*)
          )
        `)
        .eq('id', librarySongId)
        .single()
      
      if (fetchError) throw fetchError
      if (!data) return null
      
      return {
        ...data,
        song: {
          ...data.song,
          artists: data.song.artists
            ?.map((sa: any) => ({
              ...sa.artist,
              position: sa.position,
            }))
            .filter(Boolean)
            .sort((a: any, b: any) => a.position - b.position) ?? [],
        },
        tags: data.tags?.map((lst: any) => lst.tag).filter(Boolean) ?? [],
        notes: data.notes ?? [],
        lists: data.lists?.map((li: any) => li.list).filter(Boolean) ?? [],
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch library song'
      return null
    }
  }

  /** Set current library song */
  function setCurrentLibrarySong(librarySong: LibrarySongWithDetails | null) {
    currentLibrarySong.value = librarySong
  }

  /** Clear search and filters */
  function clearFilters() {
    searchQuery.value = ''
    selectedTagIds.value = []
  }

  return {
    // State
    librarySongs,
    currentLibrarySong,
    isLoading,
    error,
    searchQuery,
    selectedTagIds,
    
    // Getters
    currentProjectId,
    filteredLibrarySongs,
    librarySongCount,
    filteredSongCount,
    
    // Actions
    loadLibrary,
    addToLibrary,
    removeFromLibrary,
    updateLibrarySong,
    getLibrarySongById,
    setCurrentLibrarySong,
    clearFilters,
  }
})
