import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { LibrarySong, LibrarySongWithDetails, Tag } from '@livenotes/shared/types'
import { useAuthStore } from './auth'
import { useFuseSearch } from '@/composables/useFuseSearch'
import {
  fetchLibrarySongs,
  fetchLibrarySongWithDetails,
  addToLibrary as serviceAddToLibrary,
  removeFromLibrary as serviceRemoveFromLibrary,
  removeManyFromLibrary as serviceRemoveManyFromLibrary,
  updateLibrarySong as serviceUpdateLibrarySong,
} from '@/services/libraryService'
import { failure, type OperationResult } from '@/utils/operations'

function getTitle(librarySong: LibrarySongWithDetails): string {
  return librarySong.custom_title || librarySong.song.title
}

function getSubtitle(librarySong: LibrarySongWithDetails): string | undefined {
  const artists = librarySong.song?.artists
  if (!artists?.length) return undefined
  return artists.map(a => a.name).join(', ')
}

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
  const tagFilterMode = ref<'and' | 'or'>('and')
  const tagFilterType = ref<'include' | 'exclude'>('include')

  const authStore = useAuthStore()

  // Getters
  const currentProjectId = computed(() => authStore.activeProjectId || '')

  const { filteredItems, getTitleSegments, getSubtitleSegments } =
    useFuseSearch(librarySongs, searchQuery, getTitle, getSubtitle)

  const filteredLibrarySongs = computed(() => {
    let result = filteredItems.value

    if (selectedTagIds.value.length > 0) {
      const check = tagFilterMode.value === 'or' ? 'some' : 'every'
      result = result.filter(ls => {
        const songTagIds = ls.tags?.map((t: Tag) => t.id) ?? []
        const matches = selectedTagIds.value[check](tagId => songTagIds.includes(tagId))
        return tagFilterType.value === 'exclude' ? !matches : matches
      })
    }

    return [...result].sort((a, b) => {
      const titleA = (a.custom_title || a.song.title).toLowerCase()
      const titleB = (b.custom_title || b.song.title).toLowerCase()
      return titleA.localeCompare(titleB)
    })
  })

  const librarySongCount = computed(() => librarySongs.value.length)
  const filteredSongCount = computed(() => filteredLibrarySongs.value.length)

  // Actions (failures are returned, not thrown: docs/ERROR_HANDLING.md)

  function fail(err: unknown, fallback: string): OperationResult<never> {
    const result = failure(err, fallback)
    error.value = result.error ?? fallback
    return result
  }

  async function loadLibrary({ force = false } = {}): Promise<OperationResult> {
    if (!currentProjectId.value) return { success: true }
    if (!force && librarySongs.value.length > 0) return { success: true }
    isLoading.value = true
    error.value = null
    try {
      librarySongs.value = await fetchLibrarySongs(currentProjectId.value)
      return { success: true }
    } catch (err) {
      return fail(err, 'Failed to load library')
    } finally {
      isLoading.value = false
    }
  }

  async function addToLibrary(songId: string): Promise<OperationResult<LibrarySong>> {
    if (!currentProjectId.value) return fail(null, 'No project selected')
    if (!authStore.userId) return fail(null, 'User not authenticated')
    isLoading.value = true
    error.value = null
    try {
      const data = await serviceAddToLibrary(currentProjectId.value, songId, authStore.userId)
      await loadLibrary({ force: true })
      return { success: true, data }
    } catch (err) {
      return fail(err, 'Failed to add to library')
    } finally {
      isLoading.value = false
    }
  }

  async function removeFromLibrary(librarySongId: string): Promise<OperationResult> {
    isLoading.value = true
    error.value = null
    try {
      await serviceRemoveFromLibrary(librarySongId)
      await loadLibrary({ force: true })
      return { success: true }
    } catch (err) {
      return fail(err, 'Failed to remove from library')
    } finally {
      isLoading.value = false
    }
  }

  async function removeManyFromLibrary(librarySongIds: string[]): Promise<OperationResult> {
    isLoading.value = true
    error.value = null
    try {
      await serviceRemoveManyFromLibrary(librarySongIds)
      await loadLibrary({ force: true })
      return { success: true }
    } catch (err) {
      return fail(err, 'Failed to remove from library')
    } finally {
      isLoading.value = false
    }
  }

  async function updateLibrarySong(
    librarySongId: string,
    updates: { custom_title?: string; custom_notes?: string }
  ): Promise<OperationResult> {
    isLoading.value = true
    error.value = null
    try {
      await serviceUpdateLibrarySong(librarySongId, updates)
      await loadLibrary({ force: true })
      return { success: true }
    } catch (err) {
      return fail(err, 'Failed to update library song')
    } finally {
      isLoading.value = false
    }
  }

  async function getLibrarySongById(librarySongId: string): Promise<LibrarySongWithDetails | null> {
    try {
      return await fetchLibrarySongWithDetails(librarySongId)
    } catch (err) {
      fail(err, 'Failed to fetch library song')
      return null
    }
  }

  function setCurrentLibrarySong(librarySong: LibrarySongWithDetails | null) {
    currentLibrarySong.value = librarySong
  }

  function clearFilters() {
    searchQuery.value = ''
    selectedTagIds.value = []
    tagFilterMode.value = 'and'
    tagFilterType.value = 'include'
  }

  // Clear cached data when the active project changes so stale songs are never shown
  watch(currentProjectId, () => {
    librarySongs.value = []
    currentLibrarySong.value = null
    searchQuery.value = ''
    selectedTagIds.value = []
    tagFilterMode.value = 'and'
    tagFilterType.value = 'include'
  })

  return {
    librarySongs,
    currentLibrarySong,
    isLoading,
    error,
    searchQuery,
    selectedTagIds,
    tagFilterMode,
    tagFilterType,
    currentProjectId,
    getTitle,
    getSubtitle,
    getTitleSegments,
    getSubtitleSegments,
    filteredLibrarySongs,
    librarySongCount,
    filteredSongCount,
    loadLibrary,
    addToLibrary,
    removeFromLibrary,
    removeManyFromLibrary,
    updateLibrarySong,
    getLibrarySongById,
    setCurrentLibrarySong,
    clearFilters,
  }
})
