import { computed } from 'vue'
import {
  isSyncing,
  lastSyncedAt,
  lastSyncError,
  syncProgress,
  syncProject,
} from '@/lib/offline/offlineData'

export type { SyncProgress } from '@livenotes/shared/offline'

export function formatSyncDate(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return date.toLocaleDateString()
}

/**
 * Offline sync state of the active project, for the UI.
 * The data layer itself lives in `@/lib/offline/offlineData`.
 */
export function useOfflineSync() {
  const hasSnapshot = computed(() => lastSyncedAt.value !== null)

  /** Download the active project for offline use. Rejects if the sync fails (previous copy kept). */
  async function sync(): Promise<void> {
    await syncProject()
  }

  return {
    isSyncing,
    progress: syncProgress,
    lastSyncedAt,
    lastSyncError,
    hasSnapshot,
    sync,
  }
}
