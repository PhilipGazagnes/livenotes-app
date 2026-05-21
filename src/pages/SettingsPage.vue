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
            <!-- Song tap action -->
            <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <h3 class="text-white font-medium mb-1">Show lyrics on tap</h3>
                  <p class="text-sm text-gray-400">Open lyrics directly when tapping a song (live mode). When off, the notes list opens instead.</p>
                </div>
                <button
                  @click="settingsStore.songClickShowsLyrics = !settingsStore.songClickShowsLyrics"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                  :class="settingsStore.songClickShowsLyrics ? 'bg-blue-600' : 'bg-gray-600'"
                  role="switch"
                  :aria-checked="settingsStore.songClickShowsLyrics"
                  aria-label="Toggle show lyrics on song tap"
                >
                  <span
                    class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                    :class="settingsStore.songClickShowsLyrics ? 'translate-x-6' : 'translate-x-1'"
                  />
                </button>
              </div>
            </div>

            <!-- Lyrics Default Font Size -->
            <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <h3 class="text-white font-medium mb-1">Lyrics default text size</h3>
                  <p class="text-sm text-gray-400">Starting zoom level when opening the lyrics drawer</p>
                </div>
                <div class="flex items-center gap-2 ml-4">
                  <button
                    @click="settingsStore.lyricsDefaultFontSize = Math.round((Math.max(0.75, settingsStore.lyricsDefaultFontSize - 0.125)) * 1000) / 1000"
                    :disabled="settingsStore.lyricsDefaultFontSize <= 0.75"
                    class="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-700 border border-gray-600 text-gray-300 hover:text-white hover:border-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <span class="text-sm font-bold leading-none">A</span><span class="text-xs leading-none">−</span>
                  </button>
                  <span class="w-10 text-center text-white text-sm font-mono">{{ Math.round(settingsStore.lyricsDefaultFontSize * 100) }}%</span>
                  <button
                    @click="settingsStore.lyricsDefaultFontSize = Math.round((Math.min(3.0, settingsStore.lyricsDefaultFontSize + 0.125)) * 1000) / 1000"
                    :disabled="settingsStore.lyricsDefaultFontSize >= 3.0"
                    class="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-700 border border-gray-600 text-gray-300 hover:text-white hover:border-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <span class="text-sm font-bold leading-none">A</span><span class="text-xs leading-none">+</span>
                  </button>
                </div>
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

        <!-- Public Libraries Section -->
        <section>
          <h2 class="text-lg font-semibold text-white mb-4">Public Libraries</h2>
          <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <label for="projectSlug" class="block text-white font-medium mb-2">Project URL slug</label>
            <p class="text-sm text-gray-400 mb-3">
              Used to build your public library URLs: <span class="text-gray-300">yourapp.com/<strong>slug</strong>/library-name</span>
            </p>
            <div class="flex gap-2">
              <input
                id="projectSlug"
                v-model="projectSlugInput"
                type="text"
                maxlength="40"
                class="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition lowercase"
                placeholder="my-band-name"
                @keyup.enter="handleSaveProjectSlug"
              />
              <button
                @click="handleSaveProjectSlug"
                :disabled="isUpdatingSettings || !projectSlugInput.trim()"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Save
              </button>
            </div>
            <p class="text-xs text-gray-500 mt-1">Lowercase letters, numbers and hyphens only. Cannot be "project".</p>
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

        <!-- Control Section -->
        <section>
          <h2 class="text-lg font-semibold text-white mb-4">Control</h2>
          <div class="bg-gray-800 rounded-lg p-4 border border-gray-700 space-y-4">
            <div>
              <label for="scrollDownChar" class="block text-white font-medium mb-2">
                Move down when this character is triggered
              </label>
              <p class="text-sm text-gray-400 mb-3">
                Enter a single character (e.g. "e"). When received from a Bluetooth controller, the lyrics view will scroll down.
              </p>
              <input
                id="scrollDownChar"
                :value="localScrollChar"
                @input="localScrollChar = ($event.target as HTMLInputElement).value.slice(-1)"
                type="text"
                maxlength="1"
                class="w-20 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-center font-mono text-lg"
                placeholder="—"
              />
            </div>
            <div class="flex gap-4">
              <div class="flex-1">
                <label for="scrollDownAmount" class="block text-white font-medium mb-2">
                  Scroll amount (px)
                </label>
                <input
                  id="scrollDownAmount"
                  v-model.number="localScrollAmount"
                  type="number"
                  min="10"
                  max="2000"
                  class="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                />
              </div>
              <div class="flex-1">
                <label for="scrollDownDuration" class="block text-white font-medium mb-2">
                  Animation duration (ms)
                </label>
                <input
                  id="scrollDownDuration"
                  v-model.number="localScrollDuration"
                  type="number"
                  min="0"
                  max="2000"
                  class="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                />
              </div>
            </div>
            <button
              @click="handleSaveScrollSettings"
              class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors"
            >
              Save
            </button>
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
const projectSlugInput = ref('')
const localScrollChar = ref(settingsStore.scrollDownChar)
const localScrollAmount = ref(settingsStore.scrollDownAmount)
const localScrollDuration = ref(settingsStore.scrollDownDuration)
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
      projectSlugInput.value = settingsStore.projectSlug ?? ''
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

async function handleSaveProjectSlug() {
  const projectId = await authStore.getPersonalProjectId()
  if (!projectId) return
  const slug = projectSlugInput.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '')
  projectSlugInput.value = slug
  isUpdatingSettings.value = true
  try {
    const result = await settingsStore.updateProjectSlug(projectId, slug)
    if (result.success) uiStore.showToast('Slug saved', 'success')
    else uiStore.showToast(result.error || 'Failed to save slug', 'error')
  } finally {
    isUpdatingSettings.value = false
  }
}

function handleSaveScrollSettings() {
  settingsStore.saveScrollControlSettings(
    localScrollChar.value,
    localScrollAmount.value,
    localScrollDuration.value
  )
  uiStore.showToast('Scroll settings saved', 'success')
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
    localScrollChar.value = settingsStore.scrollDownChar
    localScrollAmount.value = settingsStore.scrollDownAmount
    localScrollDuration.value = settingsStore.scrollDownDuration
    uiStore.showToast('Settings reset to defaults', 'success')
  }
}
</script>
