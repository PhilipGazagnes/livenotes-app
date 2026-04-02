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
import { IonPage, IonContent } from '@ionic/vue'
import AppHeader from '@/components/AppHeader.vue'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'

const settingsStore = useSettingsStore()
const uiStore = useUiStore()

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
