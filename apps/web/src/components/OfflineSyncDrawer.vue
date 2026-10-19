<template>
  <div class="shrink-0 bg-gray-800 border-b border-gray-700 p-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold text-white">{{ I18N.OFFLINE.LOCAL_DATA }}</h2>
      <button @click="drawerStore.pop()" class="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors" aria-label="Close">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  </div>

  <div class="flex-1 overflow-y-auto p-4 space-y-6">

    <!-- Space used -->
    <section class="p-3 bg-gray-800 border border-gray-700 rounded-lg" data-testid="local-data-usage">
      <p class="text-xs text-gray-400 uppercase tracking-wider">{{ I18N.OFFLINE.STORAGE_TITLE }}</p>
      <p v-if="!usage" class="text-sm text-gray-500 mt-1">{{ I18N.OFFLINE.STORAGE_LOADING }}</p>
      <template v-else>
        <p class="text-sm font-medium text-white mt-1">
          {{ usage.bytes ? formatBytes(usage.bytes) : I18N.OFFLINE.STORAGE_NONE }}
        </p>
        <p v-if="usage.originBytes !== null" class="text-xs text-gray-500 mt-1">
          {{ I18N.OFFLINE.STORAGE_TOTAL(formatBytes(usage.originBytes)) }}
        </p>
      </template>
    </section>

    <!-- Explanation -->
    <section class="space-y-3 text-sm text-gray-400">
      <p>
        The app always shows the copy of
        <span class="text-white font-medium">{{ projectName }}</span>
        stored on this device, so screens open instantly, with or without a connection.
      </p>
      <p>
        Changes made by other members appear only when you sync: nothing changes on screen
        by itself. When the project changed, a banner tells you who changed it and when.
        Your own edits show up right away.
      </p>
      <p>
        On a network without internet (e.g. a mixing console hotspot),
        enable <span class="text-white font-medium">Force offline mode</span> from the hamburger menu.
      </p>
      <p class="text-gray-500 text-xs">
        If a sync fails, your previous copy stays available.
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
    <p v-else-if="lastSyncError" class="text-xs text-red-400 text-center">{{ lastSyncError }}</p>

    <!-- Delete (ADR-014) -->
    <div class="pt-4 border-t border-gray-800">
      <button
        @click="handleDeleteLocalData"
        data-testid="delete-local-data-btn"
        class="w-full py-2.5 border border-red-600/60 text-red-400 text-sm rounded-lg hover:bg-red-600/10 transition-colors"
      >
        {{ I18N.OFFLINE.DELETE_LOCAL_DATA }}
      </button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useDrawerStore } from '@/stores/drawer'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useOnlineStatus } from '@/composables/useOnlineStatus'
import { useOfflineSync, formatSyncDate } from '@/composables/useOfflineSync'
import { getLocalDataUsage, type LocalDataUsage } from '@/lib/offline/offlineData'
import { I18N } from '@/constants/i18n'
import { logger } from '@/utils/logger'

const drawerStore = useDrawerStore()
const authStore = useAuthStore()
const uiStore = useUiStore()
const { isOnline } = useOnlineStatus()

const projectName = computed(() => authStore.activeProject?.name ?? '')

const { isSyncing, progress, lastSyncedAt, lastSyncError, sync, deleteLocalData } = useOfflineSync()

const usage = ref<LocalDataUsage | null>(null)

async function refreshUsage() {
  try {
    usage.value = await getLocalDataUsage()
  } catch (err) {
    logger.warn('Could not measure local data', err)
  }
}

onMounted(refreshUsage)

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

async function handleDeleteLocalData() {
  const confirmed = await uiStore.showConfirm(
    I18N.OFFLINE.DELETE_LOCAL_DATA_TITLE,
    I18N.OFFLINE.DELETE_LOCAL_DATA_MESSAGE(projectName.value),
    I18N.BUTTONS.DELETE,
    I18N.BUTTONS.CANCEL,
  )
  if (!confirmed) return
  try {
    await deleteLocalData()
    uiStore.showToast(I18N.OFFLINE.LOCAL_DATA_DELETED, 'success')
  } catch (err) {
    uiStore.showErrorToast('delete local data', err as Error)
  }
}

async function handleSync() {
  try {
    await sync()
    uiStore.showToast(I18N.TOAST.SYNCED_OFFLINE, 'success')
  } catch (err) {
    logger.error('Offline sync failed', err)
    uiStore.showToast(lastSyncedAt.value ? I18N.OFFLINE.SYNC_FAILED_KEPT : I18N.TOAST.SYNC_FAILED, 'error')
  }
}
</script>
