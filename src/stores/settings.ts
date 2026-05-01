import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { supabase } from '@/lib/supabase'

const STORAGE_KEY = 'livenotes-settings'

interface Settings {
  showTagsInLists: boolean
  showListsInLists: boolean
  showArtistsInLists: boolean
}

const defaultSettings: Settings = {
  showTagsInLists: true,
  showListsInLists: true,
  showArtistsInLists: true,
}

export const useSettingsStore = defineStore('settings', () => {
  // Display Settings (localStorage)
  const showTagsInLists = ref(defaultSettings.showTagsInLists)
  const showListsInLists = ref(defaultSettings.showListsInLists)
  const showArtistsInLists = ref(defaultSettings.showArtistsInLists)

  // Project Settings (database)
  const notesFieldLabel = ref('Notes')
  const notesFieldEnabled = ref(true)
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
      }
    } catch (error) {
      console.error('Failed to load settings from localStorage:', error)
    }
  }

  // Save settings to localStorage
  function saveSettings() {
    try {
      const settings: Settings = {
        showTagsInLists: showTagsInLists.value,
        showListsInLists: showListsInLists.value,
        showArtistsInLists: showArtistsInLists.value,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error)
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
  }

  // Project Settings Actions
  async function loadProjectSettings(projectId: string) {
    isLoadingProjectSettings.value = true
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('notes_field_label, notes_field_enabled')
        .eq('id', projectId)
        .single()

      if (error) throw error

      if (data) {
        notesFieldLabel.value = data.notes_field_label || 'Notes'
        notesFieldEnabled.value = data.notes_field_enabled ?? true
      }
    } catch (error) {
      console.error('Failed to load project settings:', error)
      // Use defaults on error
      notesFieldLabel.value = 'Notes'
      notesFieldEnabled.value = true
    } finally {
      isLoadingProjectSettings.value = false
    }
  }

  async function updateNotesFieldLabel(projectId: string, label: string) {
    try {
      // Validate length
      const trimmedLabel = label.trim()
      if (trimmedLabel.length === 0 || trimmedLabel.length > 30) {
        throw new Error('Label must be between 1 and 30 characters')
      }

      const { error } = await supabase
        .from('projects')
        .update({ notes_field_label: trimmedLabel })
        .eq('id', projectId)

      if (error) throw error

      notesFieldLabel.value = trimmedLabel
      return { success: true }
    } catch (error) {
      console.error('Failed to update notes field label:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update label'
      }
    }
  }

  async function updateNotesFieldEnabled(projectId: string, enabled: boolean) {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ notes_field_enabled: enabled })
        .eq('id', projectId)

      if (error) throw error

      notesFieldEnabled.value = enabled
      return { success: true }
    } catch (error) {
      console.error('Failed to update notes field enabled:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update setting'
      }
    }
  }

  // Watch for changes and auto-save (localStorage only)
  watch([showTagsInLists, showListsInLists, showArtistsInLists], () => {
    saveSettings()
  })

  // Initialize on store creation
  loadSettings()

  return {
    // Display Settings (localStorage)
    showTagsInLists,
    showListsInLists,
    showArtistsInLists,
    
    // Project Settings (database)
    notesFieldLabel,
    notesFieldEnabled,
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
  }
})
