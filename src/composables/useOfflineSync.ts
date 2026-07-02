import { ref } from 'vue'
import { fetchSongs } from '@/services/songService'
import { fetchLists, fetchListWithItems, fetchListItemCount } from '@/services/listService'
import { fetchTags } from '@/services/tagService'
import { fetchArtistsWithCount } from '@/services/artistService'
import { fetchLibrarySongs, fetchLibrarySongWithDetails } from '@/services/libraryService'

const CONCURRENCY = 3

export interface SyncProgress {
  step: string
  current: number
  total: number
}

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

// Module-level cache — shared across components so ProjectMenuDrawer and
// OfflineSyncDrawer see the same lastSyncedAt ref for a given project.
const lastSyncedCache: Record<string, ReturnType<typeof ref<Date | null>>> = {}

function getLastSyncedRef(projectId: string) {
  if (!lastSyncedCache[projectId]) {
    const stored = localStorage.getItem(`livenotes-last-synced-${projectId}`)
    lastSyncedCache[projectId] = ref<Date | null>(stored ? new Date(stored) : null)
  }
  return lastSyncedCache[projectId]
}

export function useOfflineSync(projectId: string) {
  const isSyncing = ref(false)
  const progress = ref<SyncProgress | null>(null)
  const lastSyncedAt = getLastSyncedRef(projectId)

  async function warmUp() {
    if (isSyncing.value) return
    isSyncing.value = true

    try {
      progress.value = { step: 'Library', current: 0, total: 1 }
      const librarySongs = await fetchLibrarySongs(projectId)

      for (let i = 0; i < librarySongs.length; i += CONCURRENCY) {
        progress.value = {
          step: 'Song details',
          current: Math.min(i + CONCURRENCY, librarySongs.length),
          total: librarySongs.length,
        }
        await Promise.all(
          librarySongs.slice(i, i + CONCURRENCY).map(ls =>
            fetchLibrarySongWithDetails(ls.id).catch(() => null)
          )
        )
      }

      progress.value = { step: 'Songs', current: 0, total: 1 }
      await fetchSongs(projectId).catch(() => null)

      progress.value = { step: 'Tags & Artists', current: 0, total: 1 }
      await Promise.all([
        fetchTags(projectId).catch(() => null),
        fetchArtistsWithCount(projectId).catch(() => null),
      ])

      progress.value = { step: 'Setlists', current: 0, total: 1 }
      const lists = await fetchLists(projectId)

      for (let i = 0; i < lists.length; i++) {
        progress.value = { step: 'Setlist details', current: i + 1, total: lists.length }
        await Promise.all([
          fetchListWithItems(lists[i].id).catch(() => null),
          fetchListItemCount(lists[i].id).catch(() => null),
        ])
      }

      const now = new Date()
      lastSyncedAt.value = now
      localStorage.setItem(`livenotes-last-synced-${projectId}`, now.toISOString())
    } finally {
      isSyncing.value = false
      progress.value = null
    }
  }

  return { isSyncing, progress, lastSyncedAt, warmUp }
}
