import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { fetchSongs } from '@/services/songService'
import { fetchLists, fetchListWithItems, fetchListItemCount } from '@/services/listService'
import { fetchTags } from '@/services/tagService'
import { fetchArtistsWithCount } from '@/services/artistService'
import { fetchLibrarySongs, fetchLibrarySongWithDetails } from '@/services/libraryService'

const STORAGE_KEY = 'livenotes-last-synced'
const CONCURRENCY = 3

export interface SyncProgress {
  step: string
  current: number
  total: number
}

export function useOfflineSync() {
  const isSyncing = ref(false)
  const progress = ref<SyncProgress | null>(null)
  const lastSyncedAt = ref<Date | null>(null)

  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) lastSyncedAt.value = new Date(stored)

  async function warmUp() {
    if (isSyncing.value) return
    isSyncing.value = true

    try {
      const authStore = useAuthStore()
      const projectId = await authStore.getPersonalProjectId()
      if (!projectId) throw new Error('No project found')

      // Library songs — the Library page main query (already includes notes inline)
      progress.value = { step: 'Library', current: 0, total: 1 }
      const librarySongs = await fetchLibrarySongs(projectId)

      // Per-song detail — what SongNotesDrawer fetches when a card is tapped
      for (let i = 0; i < librarySongs.length; i += CONCURRENCY) {
        progress.value = { step: 'Song details', current: Math.min(i + CONCURRENCY, librarySongs.length), total: librarySongs.length }
        await Promise.all(
          librarySongs.slice(i, i + CONCURRENCY).map(ls => fetchLibrarySongWithDetails(ls.id).catch(() => null))
        )
      }

      // V1 songs (Songs page)
      progress.value = { step: 'Songs', current: 0, total: 1 }
      await fetchSongs(projectId).catch(() => null)

      // Tags and artists
      progress.value = { step: 'Tags & Artists', current: 0, total: 1 }
      await Promise.all([
        fetchTags(projectId).catch(() => null),
        fetchArtistsWithCount(projectId).catch(() => null),
      ])

      // Lists metadata
      progress.value = { step: 'Setlists', current: 0, total: 1 }
      const lists = await fetchLists(projectId)

      // Per-list: full detail (items + songs) + song count (used by ListCard)
      for (let i = 0; i < lists.length; i++) {
        progress.value = { step: 'Setlist details', current: i + 1, total: lists.length }
        await Promise.all([
          fetchListWithItems(lists[i].id).catch(() => null),
          fetchListItemCount(lists[i].id).catch(() => null),
        ])
      }

      lastSyncedAt.value = new Date()
      localStorage.setItem(STORAGE_KEY, lastSyncedAt.value.toISOString())
    } finally {
      isSyncing.value = false
      progress.value = null
    }
  }

  return { isSyncing, progress, lastSyncedAt, warmUp }
}
