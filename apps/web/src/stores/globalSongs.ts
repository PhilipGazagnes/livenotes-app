import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { SongV2, SongV2WithArtists, ArtistV2 } from '@livenotes/shared/types'
import { useAuthStore } from './auth'
import * as globalSongService from '@/services/globalSongService'
import { failure, type OperationResult } from '@/utils/operations'

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

  // Actions (failures are returned, not thrown: docs/ERROR_HANDLING.md)

  async function run<T>(fallback: string, action: () => Promise<T>): Promise<OperationResult<T>> {
    isLoading.value = true
    error.value = null
    try {
      return { success: true, data: await action() }
    } catch (err) {
      const result = failure(err, fallback)
      error.value = result.error ?? fallback
      return result
    } finally {
      isLoading.value = false
    }
  }

  function requireUserId(): string {
    const authStore = useAuthStore()
    if (!authStore.userId) throw new Error('User not authenticated')
    return authStore.userId
  }

  // Actions - Songs

  function searchSongs(query: string): Promise<OperationResult<SongV2WithArtists[]>> {
    return run('Failed to search songs', async () => (query.trim() ? globalSongService.searchSongs(query) : []))
  }

  function createSong(title: string, artistIds: string[]): Promise<OperationResult<SongV2>> {
    return run('Failed to create song', () => globalSongService.createSong(title, artistIds, requireUserId()))
  }

  async function getSongById(songId: string): Promise<SongV2WithArtists | null> {
    const result = await run('Failed to fetch song', () => globalSongService.getSongById(songId))
    return result.data ?? null
  }

  // Actions - Artists

  function searchArtists(query: string): Promise<OperationResult<ArtistV2[]>> {
    return run('Failed to search artists', async () => (query.trim() ? globalSongService.searchArtists(query) : []))
  }

  function createArtist(name: string): Promise<OperationResult<ArtistV2>> {
    return run('Failed to create artist', () => globalSongService.createArtist(name, requireUserId()))
  }

  function getOrCreateArtist(name: string): Promise<OperationResult<ArtistV2>> {
    return run('Failed to create artist', async () => {
      const existing = name.trim() ? await globalSongService.searchArtists(name) : []
      const exactMatch = existing.find(a => a.name.toLowerCase() === name.toLowerCase())
      return exactMatch ?? globalSongService.createArtist(name, requireUserId())
    })
  }

  function getOrCreateSong(
    title: string,
    artistIds: string[]
  ): Promise<OperationResult<{ song: SongV2WithArtists; created: boolean }>> {
    return run('Failed to create song', async () => {
      const trimmedTitle = title.trim()
      const sortedIds = [...artistIds].sort()

      const candidates = trimmedTitle ? await globalSongService.searchSongs(trimmedTitle) : []
      const exactMatch = candidates.find(s => {
        if (s.title.trim().toLowerCase() !== trimmedTitle.toLowerCase()) return false
        const existingIds = s.artists.map(a => a.id).sort()
        return existingIds.length === sortedIds.length && existingIds.every((id, i) => id === sortedIds[i])
      })
      if (exactMatch) return { song: exactMatch, created: false }

      const created = await globalSongService.createSong(trimmedTitle, artistIds, requireUserId())
      const withArtists = await globalSongService.getSongById(created.id)
      return { song: withArtists ?? { ...created, artists: [] }, created: true }
    })
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
    getOrCreateSong,
  }
})
