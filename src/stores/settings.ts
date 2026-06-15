import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { fetchProjectSettings, updateProjectSettings } from '@/services/settingsService'
import { logger } from '@/utils/logger'

const STORAGE_KEY = 'livenotes-settings'

interface Settings {
  showTagsInLists: boolean
  showListsInLists: boolean
  showArtistsInLists: boolean
  scrollDownChar: string
  scrollDownAmount: number
  scrollDownDuration: number
  lyricsDefaultFontSize: number
  songClickShowsLyrics: boolean
  forceOfflineMode: boolean
}

const defaultSettings: Settings = {
  showTagsInLists: true,
  showListsInLists: true,
  showArtistsInLists: true,
  scrollDownChar: '',
  scrollDownAmount: 120,
  scrollDownDuration: 0,
  lyricsDefaultFontSize: 1,
  songClickShowsLyrics: false,
  forceOfflineMode: false,
}

export const useSettingsStore = defineStore('settings', () => {
  // Display Settings (localStorage)
  const showTagsInLists = ref(defaultSettings.showTagsInLists)
  const showListsInLists = ref(defaultSettings.showListsInLists)
  const showArtistsInLists = ref(defaultSettings.showArtistsInLists)
  const scrollDownChar = ref(defaultSettings.scrollDownChar)
  const scrollDownAmount = ref(defaultSettings.scrollDownAmount)
  const scrollDownDuration = ref(defaultSettings.scrollDownDuration)
  const lyricsDefaultFontSize = ref(defaultSettings.lyricsDefaultFontSize)
  const songClickShowsLyrics = ref(defaultSettings.songClickShowsLyrics)
  const forceOfflineMode = ref(defaultSettings.forceOfflineMode)

  // Project Settings (database)
  const projectName = ref('')
  const projectDescription = ref<string | null>(null)
  const notesFieldLabel = ref('Notes')
  const notesFieldEnabled = ref(true)
  const projectSlug = ref<string | null>(null)
  const thumbnailUrl = ref<string | null>(null)
  const contactEnabled = ref(false)
  const contactInfo = ref<Record<string, string> | null>(null)
  const isLoadingProjectSettings = ref(false)

  // Load settings from localStorage
  function loadSettings() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const settings: Settings = JSON.parse(stored)
        showTagsInLists.value = settings.showTagsInLists ?? defaultSettings.showTagsInLists
        showListsInLists.value = settings.showListsInLists ?? defaultSettings.showListsInLists
        showArtistsInLists.value = settings.showArtistsInLists ?? defaultSettings.showArtistsInLists
        scrollDownChar.value = settings.scrollDownChar ?? defaultSettings.scrollDownChar
        scrollDownAmount.value = settings.scrollDownAmount ?? defaultSettings.scrollDownAmount
        scrollDownDuration.value = settings.scrollDownDuration ?? defaultSettings.scrollDownDuration
        lyricsDefaultFontSize.value = settings.lyricsDefaultFontSize ?? defaultSettings.lyricsDefaultFontSize
        songClickShowsLyrics.value = settings.songClickShowsLyrics ?? defaultSettings.songClickShowsLyrics
        forceOfflineMode.value = settings.forceOfflineMode ?? defaultSettings.forceOfflineMode
      }
    } catch (error) {
      logger.error('Failed to load settings from localStorage', error)
    }
  }

  // Save settings to localStorage
  function saveSettings() {
    try {
      const settings: Settings = {
        showTagsInLists: showTagsInLists.value,
        showListsInLists: showListsInLists.value,
        showArtistsInLists: showArtistsInLists.value,
        scrollDownChar: scrollDownChar.value,
        scrollDownAmount: scrollDownAmount.value,
        scrollDownDuration: scrollDownDuration.value,
        lyricsDefaultFontSize: lyricsDefaultFontSize.value,
        songClickShowsLyrics: songClickShowsLyrics.value,
        forceOfflineMode: forceOfflineMode.value,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch (error) {
      logger.error('Failed to save settings to localStorage', error)
    }
  }

  // Actions
  function toggleShowTagsInLists() {
    showTagsInLists.value = !showTagsInLists.value
  }

  function toggleShowListsInLists() {
    showListsInLists.value = !showListsInLists.value
  }

  function toggleShowArtistsInLists() {
    showArtistsInLists.value = !showArtistsInLists.value
  }

  function resetToDefaults() {
    showTagsInLists.value = defaultSettings.showTagsInLists
    showListsInLists.value = defaultSettings.showListsInLists
    showArtistsInLists.value = defaultSettings.showArtistsInLists
    scrollDownChar.value = defaultSettings.scrollDownChar
    scrollDownAmount.value = defaultSettings.scrollDownAmount
    scrollDownDuration.value = defaultSettings.scrollDownDuration
    lyricsDefaultFontSize.value = defaultSettings.lyricsDefaultFontSize
    songClickShowsLyrics.value = defaultSettings.songClickShowsLyrics
    forceOfflineMode.value = defaultSettings.forceOfflineMode
  }

  function notifySwForceOffline(value: boolean) {
    navigator.serviceWorker?.controller?.postMessage({ type: 'SET_FORCE_OFFLINE', value })
  }

  function toggleForceOfflineMode() {
    forceOfflineMode.value = !forceOfflineMode.value
    notifySwForceOffline(forceOfflineMode.value)
  }

  // Project Settings Actions
  async function loadProjectSettings(projectId: string) {
    isLoadingProjectSettings.value = true
    try {
      const data = await fetchProjectSettings(projectId)
      if (data) {
        projectName.value = data.name || ''
        projectDescription.value = data.description ?? null
        notesFieldLabel.value = data.notes_field_label || 'Notes'
        notesFieldEnabled.value = data.notes_field_enabled ?? true
        projectSlug.value = data.slug ?? null
        thumbnailUrl.value = data.thumbnail_url ?? null
        contactEnabled.value = data.contact_enabled ?? false
        contactInfo.value = data.contact_info ?? null
      }
    } catch (error) {
      logger.error('Failed to load project settings', error)
      notesFieldLabel.value = 'Notes'
      notesFieldEnabled.value = true
    } finally {
      isLoadingProjectSettings.value = false
    }
  }

  async function updateProjectName(projectId: string, name: string) {
    try {
      const trimmed = name.trim()
      if (!trimmed) throw new Error('Project name cannot be empty')
      await updateProjectSettings(projectId, { name: trimmed })
      projectName.value = trimmed
      return { success: true }
    } catch (error) {
      logger.error('Failed to update project name', error)
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update project name' }
    }
  }

  async function updateProjectDescription(projectId: string, description: string) {
    try {
      const trimmed = description.trim()
      await updateProjectSettings(projectId, { description: trimmed || null })
      projectDescription.value = trimmed || null
      return { success: true }
    } catch (error) {
      logger.error('Failed to update project description', error)
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update description' }
    }
  }

  async function updateNotesFieldLabel(projectId: string, label: string) {
    try {
      const trimmedLabel = label.trim()
      if (trimmedLabel.length === 0 || trimmedLabel.length > 30) {
        throw new Error('Label must be between 1 and 30 characters')
      }
      await updateProjectSettings(projectId, { notes_field_label: trimmedLabel })
      notesFieldLabel.value = trimmedLabel
      return { success: true }
    } catch (error) {
      logger.error('Failed to update notes field label', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update label',
      }
    }
  }

  async function updateProjectSlug(projectId: string, slug: string) {
    try {
      const trimmed = slug.trim()
      if (trimmed === 'project') throw new Error('"project" is a reserved word and cannot be used as a slug')
      await updateProjectSettings(projectId, { slug: trimmed || undefined })
      projectSlug.value = trimmed || null
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update project slug',
      }
    }
  }

  async function updateNotesFieldEnabled(projectId: string, enabled: boolean) {
    try {
      await updateProjectSettings(projectId, { notes_field_enabled: enabled })
      notesFieldEnabled.value = enabled
      return { success: true }
    } catch (error) {
      logger.error('Failed to update notes field enabled', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update setting',
      }
    }
  }

  async function updateThumbnailUrl(projectId: string, url: string) {
    try {
      const trimmed = url.trim()
      await updateProjectSettings(projectId, { thumbnail_url: trimmed || null })
      thumbnailUrl.value = trimmed || null
      return { success: true }
    } catch (error) {
      logger.error('Failed to update thumbnail URL', error)
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update thumbnail' }
    }
  }

  async function updateContactEnabled(projectId: string, enabled: boolean) {
    try {
      await updateProjectSettings(projectId, { contact_enabled: enabled })
      contactEnabled.value = enabled
      return { success: true }
    } catch (error) {
      logger.error('Failed to update contact enabled', error)
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update setting' }
    }
  }

  async function updateContactInfo(projectId: string, info: Record<string, string>) {
    try {
      const cleaned = Object.fromEntries(
        Object.entries(info).filter(([, v]) => v && v.trim())
      )
      await updateProjectSettings(projectId, { contact_info: Object.keys(cleaned).length ? cleaned : null })
      contactInfo.value = Object.keys(cleaned).length ? cleaned : null
      return { success: true }
    } catch (error) {
      logger.error('Failed to update contact info', error)
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update contact info' }
    }
  }

  function saveScrollControlSettings(char: string, amount: number, duration: number) {
    scrollDownChar.value = char
    scrollDownAmount.value = amount
    scrollDownDuration.value = duration
    saveSettings()
  }

  // Watch for changes and auto-save (localStorage only)
  watch([showTagsInLists, showListsInLists, showArtistsInLists, lyricsDefaultFontSize, songClickShowsLyrics, forceOfflineMode], () => {
    saveSettings()
  })

  // Initialize on store creation
  loadSettings()

  return {
    // Display Settings (localStorage)
    showTagsInLists,
    showListsInLists,
    showArtistsInLists,
    scrollDownChar,
    scrollDownAmount,
    scrollDownDuration,
    lyricsDefaultFontSize,
    songClickShowsLyrics,

    // Project Settings (database)
    projectName,
    projectDescription,
    notesFieldLabel,
    notesFieldEnabled,
    projectSlug,
    thumbnailUrl,
    contactEnabled,
    contactInfo,
    isLoadingProjectSettings,

    // Display Actions
    forceOfflineMode,
    toggleShowTagsInLists,
    toggleShowListsInLists,
    toggleShowArtistsInLists,
    toggleForceOfflineMode,
    resetToDefaults,
    saveScrollControlSettings,

    // Project Actions
    loadProjectSettings,
    updateProjectName,
    updateProjectDescription,
    updateNotesFieldLabel,
    updateNotesFieldEnabled,
    updateProjectSlug,
    updateThumbnailUrl,
    updateContactEnabled,
    updateContactInfo,
  }
})
