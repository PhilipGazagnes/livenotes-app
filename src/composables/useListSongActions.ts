import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useDrawerStore } from '@/stores/drawer'
import { useTagsStore } from '@/stores/tags'
import { useListsStore } from '@/stores/lists'
import { useSongsStore } from '@/stores/songs'
import { useSettingsStore } from '@/stores/settings'
import { useRouter } from 'vue-router'
import ConfirmDrawer from '@/components/ConfirmDrawer.vue'
import SongNotesDrawer from '@/components/SongNotesDrawer.vue'
import LiveLyricsDrawer from '@/components/LiveLyricsDrawer.vue'
import { I18N } from '@/constants/i18n'
import { MESSAGES } from '@/constants/messages'
import { executeOperation } from '@/utils/operations'
import type { ListItem, SongWithTags } from '@/types/database'

type SongItem = ListItem & { song: SongWithTags }

export function useListSongActions(onRefresh: () => Promise<void>) {
  const router = useRouter()
  const authStore = useAuthStore()
  const uiStore = useUiStore()
  const drawerStore = useDrawerStore()
  const tagsStore = useTagsStore()
  const listsStore = useListsStore()
  const songsStore = useSongsStore()
  const settingsStore = useSettingsStore()

  const selectedSongItem = ref<SongItem | null>(null)
  const showSongManageTagsModal = ref(false)
  const showSongManageListsModal = ref(false)

  function getItemText(item: SongItem): string | undefined {
    if (!settingsStore.showArtistsInLists) return undefined
    const song = item.song
    if (song.artists?.length) return song.artists.map(a => a.name).join(', ')
    if (song.artist) return song.artist
    return undefined
  }

  function getItemTags(item: SongItem) {
    return settingsStore.showTagsInLists ? item.song.tags : undefined
  }

  function getItemLists(item: SongItem) {
    return settingsStore.showListsInLists ? item.song.lists : undefined
  }

  function getItemDropdownItems(item: SongItem) {
    return [
      { label: I18N.DROPDOWN.REMOVE_FROM_LIST, variant: 'warning' as const, callback: () => handleRemove(item) },
      { label: I18N.DROPDOWN.EDIT, callback: () => { uiStore.showOperationOverlay('Loading song...'); router.push(`/project/song/${item.song.id}/edit`) } },
      { label: I18N.DROPDOWN.MANAGE_TAGS, callback: () => openSongManageTags(item) },
      { label: I18N.DROPDOWN.MANAGE_LISTS, callback: () => openSongManageLists(item) },
      { label: I18N.DROPDOWN.DELETE, variant: 'danger' as const, callback: () => handleDeleteSong(item) },
    ]
  }

  async function openSongManageTags(item: SongItem) {
    const projectId = authStore.activeProjectId
    if (projectId) await tagsStore.fetchTags(projectId)
    if (!item.library_song_id) { uiStore.showToast(I18N.TOAST.MANAGE_TAGS_ERROR, 'error'); return }
    selectedSongItem.value = item
    showSongManageTagsModal.value = true
  }

  async function openSongManageLists(item: SongItem) {
    const projectId = authStore.activeProjectId
    if (projectId) await listsStore.fetchLists(projectId)
    if (!item.library_song_id) { uiStore.showToast(I18N.TOAST.MANAGE_LISTS_ERROR, 'error'); return }
    selectedSongItem.value = item
    showSongManageListsModal.value = true
  }

  async function handleSongTagsSaved() {
    showSongManageTagsModal.value = false
    if (selectedSongItem.value) await onRefresh()
    selectedSongItem.value = null
  }

  async function handleSongListsSaved() {
    showSongManageListsModal.value = false
    if (selectedSongItem.value) await onRefresh()
    selectedSongItem.value = null
  }

  async function handleDeleteSong(item: SongItem) {
    const confirmed = await uiStore.showConfirm(
      'Delete Song', MESSAGES.CONFIRM_DELETE_SONG(item.song.title),
      I18N.BUTTONS.DELETE, I18N.BUTTONS.CANCEL,
    )
    if (!confirmed) return
    const songId = item.song.id
    await executeOperation(
      () => songsStore.deleteSong(item.song.id, item.song.project_id),
      {
        loadingMessage: 'Deleting song...',
        successMessage: MESSAGES.SUCCESS.SONG_DELETED,
        errorContext: 'delete song',
        onSuccess: () => handleSongDeleted(songId),
      },
    )
  }

  function handleRemove(item: ListItem & { song?: SongWithTags }) {
    if (!item.library_song_id) return
    const { list_id, library_song_id } = item
    const songTitle = item.song?.title ?? 'this song'

    drawerStore.push(ConfirmDrawer, {
      title: I18N.DROPDOWN.REMOVE_FROM_LIST,
      message: `Remove "${songTitle}" from list?`,
      confirmLabel: I18N.BUTTONS.REMOVE,
      cancelLabel: I18N.BUTTONS.CANCEL,
      confirmCallback: async () => {
        try {
          await listsStore.removeLibrarySongFromList(list_id, library_song_id)
          uiStore.showToast(I18N.TOAST.REMOVED_FROM_LIST(''), 'success')
          drawerStore.popAll()
        } catch (err) {
          uiStore.showErrorToast('remove song from list', err as Error)
          drawerStore.popAll()
        }
      },
    })
  }

  function handleSongDeleted(songId: string) {
    // nothing to do here — the list refreshes via the store
    void songId
  }

  function handleOpenNotes(item: SongItem) {
    const librarySongId = item.library_song_id
    if (!librarySongId) { uiStore.showToast(I18N.TOAST.NOTES_CANNOT_OPEN, 'error'); return }
    const drawer = settingsStore.songClickShowsLyrics ? LiveLyricsDrawer : SongNotesDrawer
    drawerStore.push(drawer, { librarySongId })
  }

  return {
    selectedSongItem,
    showSongManageTagsModal,
    showSongManageListsModal,
    getItemText,
    getItemTags,
    getItemLists,
    getItemDropdownItems,
    handleSongTagsSaved,
    handleSongListsSaved,
    handleOpenNotes,
  }
}
