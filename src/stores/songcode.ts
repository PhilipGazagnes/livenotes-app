import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { SongCode } from '@/types/database'
import { useAuthStore } from './auth'
import { generateLivenotesJson } from '@/utils/songcodeConverter'
import { useUiStore } from './ui'
import {
  fetchSongcode as serviceFetchSongcode,
  upsertSongcode as serviceUpsertSongcode,
  upsertLivenotesJson as serviceUpsertLivenotesJson,
} from '@/services/songcodeService'

export const useSongcodeStore = defineStore('songcode', () => {
  // State
  const currentSongcode = ref<SongCode | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  
  /**
   * Fetch SongCode for a specific song
   */
  async function fetchSongcode(songId: string) {
    isLoading.value = true
    error.value = null
    
    try {
      const data = await serviceFetchSongcode(songId)
      currentSongcode.value = data
      return { success: true, data }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch songcode'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Update SongCode text
   */
  async function updateSongcode(songId: string, songcodeText: string) {
    const authStore = useAuthStore()
    if (!authStore.userId) {
      error.value = 'User not authenticated'
      return { success: false, error: error.value }
    }

    isLoading.value = true
    error.value = null
    
    try {
      const data = await serviceUpsertSongcode(songId, songcodeText, authStore.userId)
      currentSongcode.value = data
      return { success: true, data }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update songcode'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Generate Livenotes JSON from current SongCode
   */
  async function generateLivenotesJsonForSong(songId: string) {
    const authStore = useAuthStore()
    const uiStore = useUiStore()
    
    if (!authStore.userId) {
      error.value = 'User not authenticated'
      return { success: false, error: error.value }
    }

    if (!currentSongcode.value?.songcode) {
      error.value = 'No songcode to convert'
      return { success: false, error: error.value }
    }

    isLoading.value = true
    error.value = null
    
    try {
      // Run converter
      const conversionResult = await generateLivenotesJson(currentSongcode.value.songcode)
      
      if (!conversionResult.success) {
        throw new Error(conversionResult.error)
      }

      const data = await serviceUpsertLivenotesJson(songId, conversionResult.json, authStore.userId)
      currentSongcode.value = data
      uiStore.showToast('Livenotes JSON generated successfully', 'success')
      return { success: true, data }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate Livenotes JSON'
      error.value = errorMsg
      uiStore.showToast(errorMsg, 'error')
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Copy Livenotes JSON to clipboard
   */
  async function copyLivenotesJsonToClipboard() {
    const uiStore = useUiStore()
    
    if (!currentSongcode.value?.livenotes_json) {
      uiStore.showToast('No Livenotes JSON to copy', 'error')
      return { success: false, error: 'No JSON available' }
    }

    try {
      const jsonString = JSON.stringify(currentSongcode.value.livenotes_json, null, 2)
      await navigator.clipboard.writeText(jsonString)
      uiStore.showToast('Livenotes JSON copied to clipboard', 'success')
      return { success: true }
    } catch (err) {
      const errorMsg = 'Failed to copy to clipboard'
      uiStore.showToast(errorMsg, 'error')
      return { success: false, error: errorMsg }
    }
  }

  /**
   * Clear current songcode state
   */
  function clearCurrentSongcode() {
    currentSongcode.value = null
    error.value = null
  }

  return {
    // State
    currentSongcode,
    isLoading,
    error,
    // Actions
    fetchSongcode,
    updateSongcode,
    generateLivenotesJsonForSong,
    copyLivenotesJsonToClipboard,
    clearCurrentSongcode,
  }
})
