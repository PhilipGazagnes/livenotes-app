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
}

const defaultSettings: Settings = {
  showTagsInLists: true,
  showListsInLists: true,
  showArtistsInLists: true,
  scrollDownChar: '',
}

export const useSettingsStore = defineStore('settings', () => {
  // Display Settings (localStorage)
  const showTagsInLists = ref(defaultSettings.showTagsInLists)
  const showListsInLists = ref(defaultSettings.showListsInLists)
  const showArtistsInLists = ref(defaultSettings.showArtistsInLists)
  const scrollDownChar = ref(defaultSettings.scrollDownChar)

  // Project Settings (database)
  const notesFieldLabel = ref('Notes')
  const notesFieldEnabled = ref(true)
  const projectSlug = ref<string | null>(null)
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
  }

  // Project Settings Actions
  async function loadProjectSettings(projectId: string) {
    isLoadingProjectSettings.value = true
    try {
      const data = await fetchProjectSettings(projectId)
      if (data) {
        notesFieldLabel.value = data.notes_field_label || 'Notes'
        notesFieldEnabled.value = data.notes_field_enabled ?? true
        projectSlug.value = data.slug ?? null
      }
    } catch (error) {
      logger.error('Failed to load project settings', error)
      notesFieldLabel.value = 'Notes'
      notesFieldEnabled.value = true
    } finally {
      isLoadingProjectSettings.value = false
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

  // Watch for changes and auto-save (localStorage only)
  watch([showTagsInLists, showListsInLists, showArtistsInLists, scrollDownChar], () => {
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

    // Project Settings (database)
    notesFieldLabel,
    notesFieldEnabled,
    projectSlug,
    isLoadingProjectSettings,

    // Display Actions
    toggleShowTagsInLists,
    toggleShowListsInLists,
    toggleShowArtistsInLists,
    resetToDefaults,

    // Project Actions
    loadProjectSettings,
    updateNotesFieldLabel,
    updateNotesFieldEnabled,
    updateProjectSlug,
  }
})
