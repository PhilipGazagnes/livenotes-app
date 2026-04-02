import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'livenotes-settings'

interface Settings {
  showTagsInLists: boolean
  showListsInLists: boolean
}

const defaultSettings: Settings = {
  showTagsInLists: true,
  showListsInLists: true,
}

export const useSettingsStore = defineStore('settings', () => {
  // State
  const showTagsInLists = ref(defaultSettings.showTagsInLists)
  const showListsInLists = ref(defaultSettings.showListsInLists)

  // Load settings from localStorage
  function loadSettings() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const settings: Settings = JSON.parse(stored)
        showTagsInLists.value = settings.showTagsInLists ?? defaultSettings.showTagsInLists
        showListsInLists.value = settings.showListsInLists ?? defaultSettings.showListsInLists
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

  function resetToDefaults() {
    showTagsInLists.value = defaultSettings.showTagsInLists
    showListsInLists.value = defaultSettings.showListsInLists
  }

  // Watch for changes and auto-save
  watch([showTagsInLists, showListsInLists], () => {
    saveSettings()
  })

  // Initialize on store creation
  loadSettings()

  return {
    // State
    showTagsInLists,
    showListsInLists,
    
    // Actions
    toggleShowTagsInLists,
    toggleShowListsInLists,
    resetToDefaults,
  }
})
