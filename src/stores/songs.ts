import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Song, SongWithTags, ArtistWithPosition } from '@/types/database'
import type { Tag } from '@/types/database'
import { useAuthStore } from './auth'
import * as songService from '@/services/songService'

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

    if (selectedTagIds.value.length > 0) {
      result = result.filter((song: SongWithTags) => {
        const songTagIds = song.tags?.map((t: Tag) => t.id) ?? []
        return selectedTagIds.value.every(tagId => songTagIds.includes(tagId))
      })
    }

    return [...result].sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()))
  })

  const songCount = computed(() => songs.value.length)
  const filteredSongCount = computed(() => filteredSongs.value.length)

  // Actions
  async function fetchSongs(projectId: string) {
    isLoading.value = true
    error.value = null
    try {
      songs.value = await songService.fetchSongs(projectId)
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
      currentSong.value = await songService.fetchSongById(songId)
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

      const newSong = await songService.insertSong(songData, authStore.userId)

      if (tagIds.length > 0) await songService.insertSongTags(newSong.id, tagIds)
      if (artistIds.length > 0) await songService.insertSongArtists(newSong.id, artistIds)

      if (songData.project_id) await fetchSongs(songData.project_id)

      return { success: true, data: newSong }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create song'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function updateSong(
    songId: string,
    songData: Partial<Song>,
    projectId: string,
    tagIds?: string[],
    artistIds?: string[]
  ) {
    const authStore = useAuthStore()
    if (!authStore.userId) {
      error.value = 'User not authenticated'
      return { success: false, error: error.value }
    }

    isLoading.value = true
    error.value = null
    try {
      const updatedSong = await songService.updateSong(songId, songData, authStore.userId)

      if (tagIds !== undefined && Array.isArray(tagIds)) {
        await songService.replaceSongTags(songId, tagIds)
      }

      if (artistIds !== undefined && Array.isArray(artistIds)) {
        await songService.replaceSongArtists(songId, artistIds)
      }

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
      await songService.deleteSong(songId)
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
      await songService.bulkDeleteSongs(songIds)
      songs.value = songs.value.filter(song => !songIds.includes(song.id))
      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete songs'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  function setSearchQuery(query: string) { searchQuery.value = query }
  function setSelectedTags(tagIds: string[]) { selectedTagIds.value = tagIds }
  function clearFilters() { searchQuery.value = ''; selectedTagIds.value = [] }

  async function refreshSongTags(songId: string) {
    try {
      const tags = await songService.fetchSongTags(songId)
      const songIndex = songs.value.findIndex(s => s.id === songId)
      if (songIndex !== -1) songs.value[songIndex].tags = tags
    } catch (err) {
      console.error('Failed to refresh song tags:', err)
    }
  }

  async function refreshSongLists(songId: string) {
    try {
      const lists = await songService.fetchSongLists(songId)
      const songIndex = songs.value.findIndex(s => s.id === songId)
      if (songIndex !== -1) songs.value[songIndex].lists = lists
    } catch (err) {
      console.error('Failed to refresh song lists:', err)
    }
  }

  async function refreshSongArtists(songId: string) {
    try {
      const artists = await songService.fetchSongArtists(songId)
      const songIndex = songs.value.findIndex(s => s.id === songId)
      if (songIndex !== -1) songs.value[songIndex].artists = artists as ArtistWithPosition[]
    } catch (err) {
      console.error('Failed to refresh song artists:', err)
    }
  }

  async function updateSongArtists(songId: string, artistIds: string[]) {
    isLoading.value = true
    error.value = null
    try {
      await songService.replaceSongArtists(songId, artistIds)
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
    songs,
    currentSong,
    isLoading,
    error,
    searchQuery,
    selectedTagIds,
    filteredSongs,
    songCount,
    filteredSongCount,
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
