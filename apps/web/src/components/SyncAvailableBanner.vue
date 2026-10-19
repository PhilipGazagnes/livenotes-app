<template>
  <div
    v-if="visible"
    role="status"
    data-testid="sync-available"
    class="fixed top-16 left-1/2 -translate-x-1/2 z-55 flex w-[calc(100%-2rem)] max-w-md items-center gap-3 rounded-lg border border-blue-500/40 bg-gray-800 px-4 py-2.5 text-sm text-gray-200 shadow-lg"
  >
    <span class="flex-1 truncate">{{ message }}</span>
    <button
      @click="handleSync"
      :disabled="isSyncing"
      class="rounded-md bg-blue-600 px-3 py-1 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
    >
      {{ isSyncing ? '…' : I18N.OFFLINE.SYNC }}
    </button>
    <button
      @click="dismissedVersion = projectStatus?.version ?? null"
      class="p-1 text-gray-500 hover:text-white transition-colors"
      :aria-label="I18N.OFFLINE.STALE_DISMISS"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useOfflineSync, formatSyncDate } from '@/composables/useOfflineSync'
import { isLocalCopyOutdated, projectStatus } from '@/lib/offline/projectStatus'
import { isDownloadPaused, localVersion } from '@/lib/offline/offlineData'
import { I18N } from '@/constants/i18n'
import { logger } from '@/utils/logger'

/**
 * "Updated by Alex, 5 min ago — Sync" (ADR-010): the server copy is newer
 * than the local one. Informative only; nothing changes until the user syncs.
 */
const authStore = useAuthStore()
const uiStore = useUiStore()
const { isSyncing, sync } = useOfflineSync()

/** Hidden for this server version; shows again on the next change */
const dismissedVersion = ref<number | null>(null)

/** Local data was deleted: nothing shows until the user syncs */
const noLocalCopy = computed(() => isDownloadPaused.value && localVersion.value === null && !!authStore.activeProjectId)

const visible = computed(() =>
  authStore.isOnline && (
    noLocalCopy.value ||
    (isLocalCopyOutdated.value && projectStatus.value?.version !== dismissedVersion.value)
  )
)

const message = computed(() => {
  if (noLocalCopy.value) return I18N.OFFLINE.NOT_ON_DEVICE
  const status = projectStatus.value
  if (!status?.lastChangedAt || localVersion.value === -1) return I18N.OFFLINE.STALE_LOCAL
  const when = formatSyncDate(new Date(status.lastChangedAt))
  const by = status.lastChangedBy
  if (!by) return I18N.OFFLINE.STALE_UPDATED(when)
  const name = by.userId === authStore.userId ? 'you' : by.name || I18N.EDIT_MODE.SOMEONE
  return I18N.OFFLINE.STALE_UPDATED_BY(name, when)
})

async function handleSync() {
  try {
    await sync()
    uiStore.showToast(I18N.TOAST.SYNCED_OFFLINE, 'success')
  } catch (err) {
    logger.error('Sync failed', err)
    uiStore.showToast(I18N.OFFLINE.SYNC_FAILED_KEPT, 'error')
  }
}
</script>
