<template>
  <ion-page>
    <ion-content>
      <!-- Header -->
      <AppHeader
        :title="I18N.PAGE_TITLES.SETTINGS"
        :show-back="true"
        :show-menu="true"
      />

      <!-- Settings Content -->
      <div class="p-4 space-y-6">
        <!-- List Display Section -->
        <section>
          <h2 class="text-lg font-semibold text-white mb-4">{{ I18N.SETTINGS.LIST_DISPLAY }}</h2>

          <div class="space-y-4">
            <!-- Show Tags Toggle -->
            <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <h3 class="text-white font-medium mb-1">{{ I18N.SETTINGS.SHOW_TAGS }}</h3>
                  <p class="text-sm text-gray-400">{{ I18N.SETTINGS.SHOW_TAGS_DESC }}</p>
                </div>
                <button
                  @click="settingsStore.toggleShowTagsInLists()"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                  :class="settingsStore.showTagsInLists ? 'bg-blue-600' : 'bg-gray-600'"
                  role="switch"
                  :aria-checked="settingsStore.showTagsInLists"
                  :aria-label="I18N.ARIA.TOGGLE_SHOW_TAGS"
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
                  <h3 class="text-white font-medium mb-1">{{ I18N.SETTINGS.SHOW_LISTS }}</h3>
                  <p class="text-sm text-gray-400">{{ I18N.SETTINGS.SHOW_LISTS_DESC }}</p>
                </div>
                <button
                  @click="settingsStore.toggleShowListsInLists()"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                  :class="settingsStore.showListsInLists ? 'bg-blue-600' : 'bg-gray-600'"
                  role="switch"
                  :aria-checked="settingsStore.showListsInLists"
                  :aria-label="I18N.ARIA.TOGGLE_SHOW_LISTS"
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
                  <h3 class="text-white font-medium mb-1">{{ I18N.SETTINGS.SHOW_ARTISTS }}</h3>
                  <p class="text-sm text-gray-400">{{ I18N.SETTINGS.SHOW_ARTISTS_DESC }}</p>
                </div>
                <button
                  @click="settingsStore.toggleShowArtistsInLists()"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                  :class="settingsStore.showArtistsInLists ? 'bg-blue-600' : 'bg-gray-600'"
                  role="switch"
                  :aria-checked="settingsStore.showArtistsInLists"
                  :aria-label="I18N.ARIA.TOGGLE_SHOW_ARTISTS"
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
                  <h3 class="text-white font-medium mb-1">{{ I18N.SETTINGS.SHOW_LYRICS_ON_TAP }}</h3>
                  <p class="text-sm text-gray-400">{{ I18N.SETTINGS.SHOW_LYRICS_ON_TAP_DESC }}</p>
                </div>
                <button
                  @click="settingsStore.songClickShowsLyrics = !settingsStore.songClickShowsLyrics"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                  :class="settingsStore.songClickShowsLyrics ? 'bg-blue-600' : 'bg-gray-600'"
                  role="switch"
                  :aria-checked="settingsStore.songClickShowsLyrics"
                  :aria-label="I18N.ARIA.TOGGLE_SHOW_LYRICS"
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
                  <h3 class="text-white font-medium mb-1">{{ I18N.SETTINGS.LYRICS_TEXT_SIZE }}</h3>
                  <p class="text-sm text-gray-400">Starting zoom level when opening the lyrics drawer</p>
                </div>
                <div class="flex items-center gap-2 ml-4">
                  <button
                    @click="settingsStore.lyricsDefaultFontSize = Math.round((Math.max(0.75, settingsStore.lyricsDefaultFontSize - 0.125)) * 1000) / 1000"
                    :disabled="settingsStore.lyricsDefaultFontSize <= 0.75"
                    class="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-700 border border-gray-600 text-gray-300 hover:text-white hover:border-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    :aria-label="I18N.ARIA.ZOOM_OUT"
                  >
                    <span class="text-sm font-bold leading-none">A</span><span class="text-xs leading-none">−</span>
                  </button>
                  <span class="w-10 text-center text-white text-sm font-mono">{{ Math.round(settingsStore.lyricsDefaultFontSize * 100) }}%</span>
                  <button
                    @click="settingsStore.lyricsDefaultFontSize = Math.round((Math.min(3.0, settingsStore.lyricsDefaultFontSize + 0.125)) * 1000) / 1000"
                    :disabled="settingsStore.lyricsDefaultFontSize >= 3.0"
                    class="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-700 border border-gray-600 text-gray-300 hover:text-white hover:border-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    :aria-label="I18N.ARIA.ZOOM_IN"
                  >
                    <span class="text-sm font-bold leading-none">A</span><span class="text-xs leading-none">+</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Offline Section -->
        <section>
          <h2 class="text-lg font-semibold text-white mb-4">{{ I18N.SETTINGS.OFFLINE }}</h2>

          <!-- Force Offline Mode Toggle -->
          <div class="bg-gray-800 rounded-lg p-4 border border-gray-700 mb-4">
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <h3 class="text-white font-medium mb-1">{{ I18N.SETTINGS.FORCE_OFFLINE }}</h3>
                <p class="text-sm text-gray-400">{{ I18N.SETTINGS.FORCE_OFFLINE_DESC }}</p>
                <p v-if="settingsStore.forceOfflineMode" class="text-xs text-orange-400 mt-2">Offline mode forced on. Remote sync is disabled.</p>
              </div>
              <button
                @click="settingsStore.toggleForceOfflineMode()"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-900 ml-4 shrink-0"
                :class="settingsStore.forceOfflineMode ? 'bg-orange-500' : 'bg-gray-600'"
                role="switch"
                :aria-checked="settingsStore.forceOfflineMode"
                :aria-label="I18N.ARIA.TOGGLE_FORCE_OFFLINE"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  :class="settingsStore.forceOfflineMode ? 'translate-x-6' : 'translate-x-1'"
                />
              </button>
            </div>
          </div>

          <div class="bg-gray-800 rounded-lg p-4 border border-gray-700 space-y-4">
            <div>
              <h3 class="text-white font-medium mb-1">{{ I18N.SETTINGS.SYNC_FOR_OFFLINE }}</h3>
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
                  {{ I18N.SETTINGS.LAST_SYNCED(formatSyncDate(lastSyncedAt)) }}
                </p>
                <p v-else class="text-xs text-gray-500">{{ I18N.SETTINGS.NEVER_SYNCED }}</p>

                <button
                  @click="handleWarmUp"
                  :disabled="isSyncing || !isOnline"
                  class="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <svg v-if="isSyncing" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                  <span>{{ isSyncing ? I18N.LOADING.SYNCING : I18N.BUTTONS.SYNC_NOW }}</span>
                </button>
              </div>

              <p v-if="!isOnline" class="text-xs text-orange-400 mt-2">
                {{ I18N.VALIDATION.SYNC_REQUIRES_ONLINE }}
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
              {{ I18N.BUTTONS.SAVE }}
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
                <h3 class="text-white font-medium mb-1">{{ I18N.SETTINGS.RESET_TO_DEFAULTS }}</h3>
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
import { ref } from 'vue'
import { IonPage, IonContent } from '@ionic/vue'
import AppHeader from '@/components/AppHeader.vue'
import { I18N } from '@/constants/i18n'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'
import { useOnlineStatus } from '@/composables/useOnlineStatus'
import { useOfflineSync, formatSyncDate } from '@/composables/useOfflineSync'

const settingsStore = useSettingsStore()
const uiStore = useUiStore()
const { isOnline } = useOnlineStatus()
const { isSyncing, progress, lastSyncedAt, warmUp } = useOfflineSync()

const localScrollChar = ref(settingsStore.scrollDownChar)
const localScrollAmount = ref(settingsStore.scrollDownAmount)
const localScrollDuration = ref(settingsStore.scrollDownDuration)

async function handleWarmUp() {
  try {
    await warmUp()
    uiStore.showToast(I18N.TOAST.SYNCED_OFFLINE, 'success')
  } catch {
    uiStore.showToast(I18N.TOAST.SYNC_FAILED, 'error')
  }
}

function handleSaveScrollSettings() {
  settingsStore.saveScrollControlSettings(
    localScrollChar.value,
    localScrollAmount.value,
    localScrollDuration.value
  )
  uiStore.showToast(I18N.TOAST.SCROLL_SETTINGS_SAVED, 'success')
}

async function handleReset() {
  const confirmed = await uiStore.showConfirm(
    I18N.SETTINGS.RESET_SETTINGS_TITLE,
    I18N.SETTINGS.RESET_SETTINGS_CONFIRM,
    I18N.BUTTONS.RESET,
    I18N.BUTTONS.CANCEL
  )

  if (confirmed) {
    settingsStore.resetToDefaults()
    localScrollChar.value = settingsStore.scrollDownChar
    localScrollAmount.value = settingsStore.scrollDownAmount
    localScrollDuration.value = settingsStore.scrollDownDuration
    uiStore.showToast(I18N.TOAST.SETTINGS_RESET, 'success')
  }
}
</script>
