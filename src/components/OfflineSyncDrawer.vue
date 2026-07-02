<template>
  <div class="flex-shrink-0 bg-gray-800 border-b border-gray-700 p-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold text-white">Offline sync</h2>
      <button @click="drawerStore.pop()" class="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors" aria-label="Close">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  </div>

  <div class="flex-1 overflow-y-auto p-4 space-y-6">

    <!-- Explanation -->
    <section class="space-y-3 text-sm text-gray-400">
      <p>
        Syncing downloads all songs, notes, tags, artists, and setlists for
        <span class="text-white font-medium">{{ projectName }}</span>
        so you can browse and read them without an internet connection.
      </p>
      <p>
        Once synced, enable <span class="text-white font-medium">Force offline mode</span>
        from the hamburger menu — the app will stop making network requests and
        serve everything from cache.
      </p>
      <p class="text-gray-500 text-xs">
        Sync again any time to refresh the cache with the latest data.
      </p>
    </section>

    <!-- Last synced -->
    <div class="flex items-center gap-3 p-3 bg-gray-800 border border-gray-700 rounded-lg">
      <svg class="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <div>
        <p class="text-xs text-gray-400 uppercase tracking-wider">Last synced</p>
        <p class="text-sm font-medium text-white">{{ lastSyncedAt ? formatSyncDate(lastSyncedAt) : 'Never' }}</p>
      </div>
    </div>

    <!-- Progress -->
    <div v-if="isSyncing && progress" class="space-y-2">
      <div class="flex items-center justify-between text-xs text-gray-400">
        <span>{{ progress.step }}</span>
        <span v-if="progress.total > 1">{{ progress.current }} / {{ progress.total }}</span>
      </div>
      <div class="w-full bg-gray-700 rounded-full h-1.5">
        <div
          class="bg-blue-500 h-1.5 rounded-full transition-all"
          :style="{ width: progress.total > 1 ? `${(progress.current / progress.total) * 100}%` : '100%' }"
        />
      </div>
    </div>

    <!-- Sync button -->
    <button
      @click="handleSync"
      :disabled="isSyncing || !isOnline"
      class="w-full py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
    >
      <svg v-if="isSyncing" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
      {{ isSyncing ? 'Syncing…' : 'Sync now' }}
    </button>

    <p v-if="!isOnline" class="text-xs text-orange-400 text-center">You are offline — connect to sync.</p>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDrawerStore } from '@/stores/drawer'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useOnlineStatus } from '@/composables/useOnlineStatus'
import { useOfflineSync, formatSyncDate } from '@/composables/useOfflineSync'
import { I18N } from '@/constants/i18n'

const drawerStore = useDrawerStore()
const authStore = useAuthStore()
const uiStore = useUiStore()
const { isOnline } = useOnlineStatus()

const projectId = computed(() => authStore.activeProjectId ?? '')
const projectName = computed(() => authStore.activeProject?.name ?? '')

const { isSyncing, progress, lastSyncedAt, warmUp } = useOfflineSync(projectId.value)

async function handleSync() {
  try {
    await warmUp()
    uiStore.showToast(I18N.TOAST.SYNCED_OFFLINE, 'success')
  } catch {
    uiStore.showToast(I18N.TOAST.SYNC_FAILED, 'error')
  }
}
</script>
