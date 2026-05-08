import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { LibrarySong, LibrarySongWithDetails, Tag } from '@/types/database'
import { useAuthStore } from './auth'
import {
  fetchLibrarySongs,
  fetchLibrarySongWithDetails,
  addToLibrary as serviceAddToLibrary,
  removeFromLibrary as serviceRemoveFromLibrary,
  updateLibrarySong as serviceUpdateLibrarySong,
} from '@/services/libraryService'

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
  const currentProjectId = computed(() => authStore.personalProjectId || '')

  const filteredLibrarySongs = computed(() => {
    let result = librarySongs.value

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

  async function loadLibrary({ force = false } = {}) {
    if (!currentProjectId.value) return
    if (!force && librarySongs.value.length > 0) return
    isLoading.value = true
    error.value = null
    try {
      librarySongs.value = await fetchLibrarySongs(currentProjectId.value)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load library'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function addToLibrary(songId: string): Promise<LibrarySong> {
    if (!currentProjectId.value) throw new Error('No project selected')
    if (!authStore.userId) throw new Error('User not authenticated')
    isLoading.value = true
    error.value = null
    try {
      const data = await serviceAddToLibrary(currentProjectId.value, songId, authStore.userId)
      await loadLibrary({ force: true })
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add to library'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function removeFromLibrary(librarySongId: string) {
    isLoading.value = true
    error.value = null
    try {
      await serviceRemoveFromLibrary(librarySongId)
      await loadLibrary({ force: true })
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to remove from library'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function updateLibrarySong(
    librarySongId: string,
    updates: { custom_title?: string; custom_notes?: string }
  ) {
    isLoading.value = true
    error.value = null
    try {
      await serviceUpdateLibrarySong(librarySongId, updates)
      await loadLibrary({ force: true })
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update library song'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function getLibrarySongById(librarySongId: string): Promise<LibrarySongWithDetails | null> {
    try {
      return await fetchLibrarySongWithDetails(librarySongId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch library song'
      return null
    }
  }

  function setCurrentLibrarySong(librarySong: LibrarySongWithDetails | null) {
    currentLibrarySong.value = librarySong
  }

  function clearFilters() {
    searchQuery.value = ''
    selectedTagIds.value = []
  }

  return {
    librarySongs,
    currentLibrarySong,
    isLoading,
    error,
    searchQuery,
    selectedTagIds,
    currentProjectId,
    filteredLibrarySongs,
    librarySongCount,
    filteredSongCount,
    loadLibrary,
    addToLibrary,
    removeFromLibrary,
    updateLibrarySong,
    getLibrarySongById,
    setCurrentLibrarySong,
    clearFilters,
  }
})
