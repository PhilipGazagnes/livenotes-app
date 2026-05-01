import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Artist, ArtistWithCount } from '@/types/database'
import { useAuthStore } from './auth'
import * as artistService from '@/services/artistService'

export const useArtistsStore = defineStore('artists', () => {
  // State
  const artists = ref<Artist[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const artistCount = computed(() => artists.value.length)
  const sortedArtists = computed(() => {
    return [...artists.value].sort((a, b) => a.name.localeCompare(b.name))
  })

  // Actions
  async function fetchArtists(projectId: string) {
    isLoading.value = true
    error.value = null
    try {
      artists.value = await artistService.fetchArtists(projectId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch artists'
    } finally {
      isLoading.value = false
    }
  }

  async function fetchArtistsWithCount(projectId: string): Promise<ArtistWithCount[]> {
    isLoading.value = true
    error.value = null
    try {
      return await artistService.fetchArtistsWithCount(projectId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch artists with count'
      return []
    } finally {
      isLoading.value = false
    }
  }

  async function createArtist(_projectId: string, name: string) {
    isLoading.value = true
    error.value = null
    try {
      const trimmedName = name.trim()
      const fingerprint = trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '')

      const existing = await artistService.findArtistByFingerprint(fingerprint)
      if (existing) return { success: true, data: existing, isDuplicate: true }

      const authStore = useAuthStore()
      if (!authStore.userId) throw new Error('User not authenticated')

      const newArtist = await artistService.createArtistV2(trimmedName, fingerprint, authStore.userId)
      return { success: true, data: newArtist, isDuplicate: false }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create artist'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function updateArtist(artistId: string, name: string) {
    isLoading.value = true
    error.value = null
    try {
      const authStore = useAuthStore()
      if (!authStore.userId) throw new Error('User not authenticated')

      const createdBy = await artistService.fetchArtistCreatedBy(artistId)
      if (createdBy !== authStore.userId) {
        return { success: false, error: 'Cannot edit artists created by others in the shared catalog' }
      }

      const trimmedName = name.trim()
      const fingerprint = trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '')
      const updatedArtist = await artistService.updateArtistV2(artistId, trimmedName, fingerprint)
      return { success: true, data: updatedArtist }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update artist'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function deleteArtist(artistId: string) {
    isLoading.value = true
    error.value = null
    try {
      const authStore = useAuthStore()
      if (!authStore.userId) throw new Error('User not authenticated')

      const projectId = await artistService.fetchUserProjectId(authStore.userId)
      if (!projectId) throw new Error('Project not found')

      const songIds = await artistService.fetchProjectLibrarySongIds(projectId)
      if (songIds.length === 0) return { success: true }

      const isUsed = await artistService.checkArtistUsedInSongs(artistId, songIds)
      if (isUsed) {
        return {
          success: false,
          error: 'Cannot remove artist that is assigned to songs. Remove it from songs first.',
        }
      }

      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete artist'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  function getArtistById(artistId: string): Artist | undefined {
    return artists.value.find(a => a.id === artistId)
  }

  function getArtistsByIds(artistIds: string[]): Artist[] {
    return artists.value.filter(a => artistIds.includes(a.id))
  }

  function searchArtists(query: string, limit = 5): Artist[] {
    if (!query.trim()) return []
    const searchTerm = query.toLowerCase()
    return artists.value
      .filter(artist => artist.name.toLowerCase().includes(searchTerm))
      .slice(0, limit)
  }

  function findExactMatch(name: string): Artist | undefined {
    const trimmedName = name.trim()
    return artists.value.find(a => a.name.toLowerCase() === trimmedName.toLowerCase())
  }

  return {
    artists,
    isLoading,
    error,
    artistCount,
    sortedArtists,
    fetchArtists,
    fetchArtistsWithCount,
    createArtist,
    updateArtist,
    deleteArtist,
    getArtistById,
    getArtistsByIds,
    searchArtists,
    findExactMatch,
  }
})
