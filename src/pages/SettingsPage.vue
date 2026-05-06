<template>
  <ion-page>
    <ion-content class="bg-gray-900">
      <!-- Header -->
      <AppHeader
        title="Settings"
        :show-back="true"
        :show-menu="true"
      />

      <!-- Settings Content -->
      <div class="p-4 space-y-6">
        <!-- List Display Section -->
        <section>
          <h2 class="text-lg font-semibold text-white mb-4">List Display</h2>
          
          <div class="space-y-4">
            <!-- Show Tags Toggle -->
            <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <h3 class="text-white font-medium mb-1">Show Tags</h3>
                  <p class="text-sm text-gray-400">Display song tags in list detail view</p>
                </div>
                <button
                  @click="settingsStore.toggleShowTagsInLists()"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                  :class="settingsStore.showTagsInLists ? 'bg-blue-600' : 'bg-gray-600'"
                  role="switch"
                  :aria-checked="settingsStore.showTagsInLists"
                  aria-label="Toggle show tags in lists"
                >
                  <span
                    class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                    :class="settingsStore.showTagsInLists ? 'translate-x-6' : 'translate-x-1'"
                  />
                </button>
              </div>
            </div>

            <!-- Show Lists Toggle -->
            <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <h3 class="text-white font-medium mb-1">Show Lists</h3>
                  <p class="text-sm text-gray-400">Display which lists contain each song in list detail view</p>
                </div>
                <button
                  @click="settingsStore.toggleShowListsInLists()"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                  :class="settingsStore.showListsInLists ? 'bg-blue-600' : 'bg-gray-600'"
                  role="switch"
                  :aria-checked="settingsStore.showListsInLists"
                  aria-label="Toggle show lists in lists"
                >
                  <span
                    class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                    :class="settingsStore.showListsInLists ? 'translate-x-6' : 'translate-x-1'"
                  />
                </button>
              </div>
            </div>

            <!-- Show Artists Toggle -->
            <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <h3 class="text-white font-medium mb-1">Show Artists</h3>
                  <p class="text-sm text-gray-400">Display artist names in list detail view</p>
                </div>
                <button
                  @click="settingsStore.toggleShowArtistsInLists()"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                  :class="settingsStore.showArtistsInLists ? 'bg-blue-600' : 'bg-gray-600'"
                  role="switch"
                  :aria-checked="settingsStore.showArtistsInLists"
                  aria-label="Toggle show artists in lists"
                >
                  <span
                    class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                    :class="settingsStore.showArtistsInLists ? 'translate-x-6' : 'translate-x-1'"
                  />
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Notes Field Section -->
        <section>
          <h2 class="text-lg font-semibold text-white mb-4">Notes Field</h2>
          
          <div class="space-y-4">
            <!-- Enable/Disable Notes Field -->
            <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <h3 class="text-white font-medium mb-1">Show Notes Field</h3>
                  <p class="text-sm text-gray-400">Display notes field when creating or editing songs</p>
                </div>
                <button
                  @click="toggleNotesFieldEnabled"
                  :disabled="isUpdatingSettings"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50"
                  :class="settingsStore.notesFieldEnabled ? 'bg-blue-600' : 'bg-gray-600'"
                  role="switch"
                  :aria-checked="settingsStore.notesFieldEnabled"
                  aria-label="Toggle show notes field"
                >
                  <span
                    class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                    :class="settingsStore.notesFieldEnabled ? 'translate-x-6' : 'translate-x-1'"
                  />
                </button>
              </div>
            </div>

            <!-- Custom Label Input -->
            <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div>
                <label for="notesFieldLabel" class="block text-white font-medium mb-2">
                  Field Label
                </label>
                <p class="text-sm text-gray-400 mb-3">
                  Customize the label for the notes field (e.g., "Looper", "Notes", "About")
                </p>
                <div class="flex gap-2">
                  <input
                    id="notesFieldLabel"
                    v-model="notesFieldLabelInput"
                    type="text"
                    maxlength="30"
                    class="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                    placeholder="Enter label..."
                    @keyup.enter="handleSaveNotesFieldLabel"
                  />
                  <button
                    @click="handleSaveNotesFieldLabel"
                    :disabled="isUpdatingSettings || !notesFieldLabelInput.trim()"
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Save
                  </button>
                </div>
                <p class="text-xs text-gray-500 mt-1">
                  {{ notesFieldLabelInput.length }}/30 characters
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- Offline Section -->
        <section>
          <h2 class="text-lg font-semibold text-white mb-4">Offline</h2>

          <div class="bg-gray-800 rounded-lg p-4 border border-gray-700 space-y-4">
            <div>
              <h3 class="text-white font-medium mb-1">Sync for offline use</h3>
              <p class="text-sm text-gray-400 mb-3">
                Downloads all your songs, setlists, and notes so the app works without an internet connection.
              </p>

              <!-- Progress bar -->
              <div v-if="isSyncing && progress" class="mb-3">
                <div class="flex items-center justify-between text-xs text-gray-400 mb-1">
                  <span>{{ progress.step }}</span>
                  <span v-if="progress.total > 1">{{ progress.current }} / {{ progress.total }}</span>
                </div>
                <div class="w-full bg-gray-700 rounded-full h-1.5">
                  <div
                    class="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                    :style="{ width: progress.total > 1 ? `${(progress.current / progress.total) * 100}%` : '100%' }"
                  />
                </div>
              </div>

              <div class="flex items-center justify-between">
                <p v-if="lastSyncedAt" class="text-xs text-gray-500">
                  Last synced: {{ formatSyncDate(lastSyncedAt) }}
                </p>
                <p v-else class="text-xs text-gray-500">Never synced</p>

                <button
                  @click="handleWarmUp"
                  :disabled="isSyncing || !isOnline"
                  class="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <svg v-if="isSyncing" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                  <span>{{ isSyncing ? 'Syncing...' : 'Sync now' }}</span>
                </button>
              </div>

              <p v-if="!isOnline" class="text-xs text-orange-400 mt-2">
                You must be online to sync data.
              </p>
            </div>
          </div>
        </section>

        <!-- Reset Section -->
        <section>
          <h2 class="text-lg font-semibold text-white mb-4">Reset</h2>
          
          <button
            @click="handleReset"
            class="w-full bg-gray-800 rounded-lg p-4 border border-gray-700 text-left hover:bg-gray-750 transition-colors"
          >
            <div class="flex items-center gap-3">
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              <div class="flex-1">
                <h3 class="text-white font-medium mb-1">Reset to Defaults</h3>
                <p class="text-sm text-gray-400">Restore all settings to their default values</p>
              </div>
            </div>
          </button>
        </section>

        <!-- Info Section -->
        <section class="pt-4 border-t border-gray-800">
          <p class="text-xs text-gray-500 text-center">
            Settings are saved automatically and persist across sessions
          </p>
        </section>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { IonPage, IonContent } from '@ionic/vue'
import AppHeader from '@/components/AppHeader.vue'
import { useSettingsStore } from '@/stores/settings'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { usePageLoad } from '@/composables/usePageLoad'
import { useOnlineStatus } from '@/composables/useOnlineStatus'
import { useOfflineSync, formatSyncDate } from '@/composables/useOfflineSync'

const settingsStore = useSettingsStore()
const authStore = useAuthStore()
const uiStore = useUiStore()
const { isOnline } = useOnlineStatus()
const { isSyncing, progress, lastSyncedAt, warmUp } = useOfflineSync()

const notesFieldLabelInput = ref('')
const isUpdatingSettings = ref(false)

const { execute } = usePageLoad()

async function handleWarmUp() {
  try {
    await warmUp()
    uiStore.showToast('All data synced for offline use', 'success')
  } catch {
    uiStore.showToast('Sync failed. Please try again.', 'error')
  }
}

onMounted(() => {
  execute(async () => {
    // Load project settings
    const projectId = await authStore.getPersonalProjectId()
    if (projectId) {
      await settingsStore.loadProjectSettings(projectId)
      notesFieldLabelInput.value = settingsStore.notesFieldLabel
    }
  }, {
    errorMessage: 'Failed to load settings'
  })
})

async function toggleNotesFieldEnabled() {
  const projectId = await authStore.getPersonalProjectId()
  if (!projectId) {
    uiStore.showToast('Project not found', 'error')
    return
  }

  isUpdatingSettings.value = true
  const newValue = !settingsStore.notesFieldEnabled
  
  try {
    const result = await settingsStore.updateNotesFieldEnabled(
      projectId,
      newValue
    )
    
    if (result.success) {
      uiStore.showToast(
        newValue ? 'Notes field enabled' : 'Notes field disabled',
        'success'
      )
    } else {
      uiStore.showToast(result.error || 'Failed to update setting', 'error')
    }
  } catch (error) {
    console.error('Error toggling notes field:', error)
    uiStore.showToast('Failed to update setting', 'error')
  } finally {
    isUpdatingSettings.value = false
  }
}

async function handleSaveNotesFieldLabel() {
  const projectId = await authStore.getPersonalProjectId()
  if (!projectId) {
    uiStore.showToast('Project not found', 'error')
    return
  }

  const label = notesFieldLabelInput.value.trim()
  if (!label || label.length > 30) {
    uiStore.showToast('Label must be between 1 and 30 characters', 'error')
    return
  }

  isUpdatingSettings.value = true
  try {
    const result = await settingsStore.updateNotesFieldLabel(projectId, label)
    
    if (result.success) {
      uiStore.showToast('Label updated successfully', 'success')
    } else {
      uiStore.showToast(result.error || 'Failed to update label', 'error')
    }
  } finally {
    isUpdatingSettings.value = false
  }
}

async function handleReset() {
  const confirmed = await uiStore.showConfirm(
    'Reset Settings',
    'Are you sure you want to reset all settings to their default values?',
    'Reset',
    'Cancel'
  )
  
  if (confirmed) {
    settingsStore.resetToDefaults()
    uiStore.showToast('Settings reset to defaults', 'success')
  }
}
</script>
