import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { SongV2WithArtists, ArtistV2 } from '@/types/database'
import { useAuthStore } from './auth'
import * as globalSongService from '@/services/globalSongService'

/**
 * Global Songs Store (V2)
 * Manages the global song catalog - songs available to all users
 */
export const useGlobalSongsStore = defineStore('globalSongs', () => {
  // State
  const songs = ref<SongV2WithArtists[]>([])
  const artists = ref<ArtistV2[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Actions - Songs

  async function searchSongs(query: string): Promise<SongV2WithArtists[]> {
    if (!query.trim()) return []
    isLoading.value = true
    error.value = null
    try {
      return await globalSongService.searchSongs(query)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to search songs'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function createSong(title: string, artistIds: string[]) {
    isLoading.value = true
    error.value = null
    try {
      const authStore = useAuthStore()
      if (!authStore.userId) throw new Error('User not authenticated')
      return await globalSongService.createSong(title, artistIds, authStore.userId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create song'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function getSongById(songId: string): Promise<SongV2WithArtists | null> {
    try {
      return await globalSongService.getSongById(songId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch song'
      return null
    }
  }

  // Actions - Artists

  async function searchArtists(query: string): Promise<ArtistV2[]> {
    if (!query.trim()) return []
    try {
      return await globalSongService.searchArtists(query)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to search artists'
      throw err
    }
  }

  async function createArtist(name: string): Promise<ArtistV2> {
    isLoading.value = true
    error.value = null
    try {
      const authStore = useAuthStore()
      if (!authStore.userId) throw new Error('User not authenticated')
      return await globalSongService.createArtist(name, authStore.userId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create artist'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function getOrCreateArtist(name: string): Promise<ArtistV2> {
    const existing = await searchArtists(name)
    const exactMatch = existing.find(a => a.name.toLowerCase() === name.toLowerCase())
    if (exactMatch) return exactMatch
    return createArtist(name)
  }

  return {
    songs,
    artists,
    isLoading,
    error,
    searchSongs,
    createSong,
    getSongById,
    searchArtists,
    createArtist,
    getOrCreateArtist,
  }
})
