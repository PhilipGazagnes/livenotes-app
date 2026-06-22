<template>
  <ion-page>
    <ion-content ref="ionContentRef">
      <!-- Header -->
      <AppHeader
        :title="currentList?.name || I18N.PAGE_TITLES.LIST_DETAIL"
        :show-back="true"
        :show-menu="true"
      >
      </AppHeader>

      <!-- Empty State -->
      <div v-if="!listsStore.isLoading && !currentList" class="text-center py-12 px-4">
        <svg class="w-24 h-24 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <h2 class="text-xl font-semibold text-white mb-2">{{ I18N.EMPTY_STATES.LIST_NOT_FOUND.TITLE }}</h2>
        <p class="text-gray-400 mb-6">{{ I18N.EMPTY_STATES.LIST_NOT_FOUND.SUBTITLE }}</p>
      </div>

      <!-- Songs List -->
      <div v-else-if="listItems.length === 0" class="text-center py-12 px-4">
        <svg class="w-24 h-24 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
        </svg>
        <h2 class="text-xl font-semibold text-white mb-2">{{ I18N.EMPTY_STATES.LIST_NO_SONGS.TITLE }}</h2>
        <p class="text-gray-400 mb-6">{{ I18N.EMPTY_STATES.LIST_NO_SONGS.SUBTITLE }}</p>
      </div>

      <!-- Items in List -->
      <div v-else class="p-4 pb-32 relative">
        <VueDraggable
          v-model="displayedItems"
          :disabled="uiStore.selectionMode"
          @end="handleDragEnd"
          item-key="id"
          :animation="200"
          :delay="150"
          :delay-on-touch-only="true"
          :force-fallback="true"
          :scroll="scrollElement || true"
          :scroll-sensitivity="50"
          :scroll-speed="20"
          :bubble-scroll="true"
          :force-auto-scroll-fallback="true"
          ghost-class="drag-ghost"
          chosen-class="drag-chosen"
          drag-class="drag-active"
          handle=".drag-handle"
        >
          <template #item="{ element: item }">
            <div class="mb-3">
              <!-- Title Card -->
              <ListTitleCard
                v-if="item.type === 'title'"
                :item="item"
                :draggable="true"
                @edit="handleEditTitle(item)"
                @delete="handleDeleteTitle(item)"
              />

              <!-- Song Card -->
              <Card
                v-else
                :title="item.song?.title || ''"
                :text="getItemText(item as any)"
                :highlight-text="searchQuery"
                :tags="getItemTags(item as any)"
                :lists="getItemLists(item as any)"
                :dropdown-items="getItemDropdownItems(item as any)"
                :id="item.id"
                :draggable="true"
                @click="handleOpenNotes(item as any)"
              />
            </div>
          </template>
        </VueDraggable>
        
        <!-- Empty state for filtered results -->
        <div v-if="displayedItems.length === 0" class="text-center py-12 px-4">
          <svg class="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <p class="text-gray-400">{{ I18N.EMPTY_STATES.NO_RESULTS }}</p>
        </div>
      </div>

      <StickyBar
        v-model:search-query="searchQuery"
        :all-item-ids="displayedItems.filter(i => i.type === 'song').map(i => i.id)"
        :filters-enabled="false"
        @new-clicked="handleAddTitle"
        @choose-action-clicked="handleChooseAction"
      />


      <!-- Song Manage Tags Modal -->
      <ManageTagsModal
        v-if="showSongManageTagsModal && selectedSongItem"
        :isOpen="true"
        :librarySongId="selectedSongItem.library_song_id ?? undefined"
        :songTitle="selectedSongItem.song.title"
        :initialTagIds="selectedSongItem.song.tags?.map((t: any) => t.id) || []"
        @close="showSongManageTagsModal = false; selectedSongItem = null"
        @saved="handleSongTagsSaved"
      />

      <!-- Song Manage Lists Modal -->
      <ManageListsModal
        v-if="showSongManageListsModal && selectedSongItem"
        :isOpen="true"
        :librarySongId="selectedSongItem.library_song_id || ''"
        :songTitle="selectedSongItem.song.title"
        :initialListIds="selectedSongItem.song.lists?.map((l: any) => l.id) || []"
        @close="showSongManageListsModal = false; selectedSongItem = null"
        @saved="handleSongListsSaved"
      />


    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonPage, IonContent } from '@ionic/vue'
import VueDraggable from 'vuedraggable'
import { useListsStore } from '@/stores/lists'
import { useTagsStore } from '@/stores/tags'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useDrawerStore } from '@/stores/drawer'
import { updateListItemTitle, createListItemTitle, deleteListItem } from '@/services/listItemService'
import { MESSAGES } from '@/constants/messages'
import { ROUTES } from '@/constants/routes'
import { I18N } from '@/constants/i18n'
import { executeOperation } from '@/utils/operations'
import AppHeader from '@/components/AppHeader.vue'
import Card from '@/components/Card.vue'
import ListTitleCard from '@/components/ListTitleCard.vue'
import StickyBar from '@/components/StickyBar.vue'
import BulkActionsDrawer from '@/components/BulkActionsDrawer.vue'
import type { BulkAction } from '@/components/BulkActionsDrawer.vue'
import SongNotesDrawer from '@/components/SongNotesDrawer.vue'
import LiveLyricsDrawer from '@/components/LiveLyricsDrawer.vue'
import { useSettingsStore } from '@/stores/settings'
import { useSongsStore } from '@/stores/songs'
import { foldAccents } from '@/utils/validation'
import CreateItemDrawer from '@/components/CreateItemDrawer.vue'
import ConfirmDrawer from '@/components/ConfirmDrawer.vue'
import BulkAddToListsDrawer from '@/components/BulkAddToListsDrawer.vue'
import BulkAssignTagsDrawer from '@/components/BulkAssignTagsDrawer.vue'
import BulkRemoveTagsDrawer from '@/components/BulkRemoveTagsDrawer.vue'
import type { ListItem, SongWithTags } from '@/types/database'

const ManageTagsModal = defineAsyncComponent(() => import('@/components/ManageTagsModal.vue'))
const ManageListsModal = defineAsyncComponent(() => import('@/components/ManageListsModal.vue'))

const route = useRoute()
const router = useRouter()
const listsStore = useListsStore()
const tagsStore = useTagsStore()
const authStore = useAuthStore()
const uiStore = useUiStore()
const drawerStore = useDrawerStore()
const settingsStore = useSettingsStore()
const songsStore = useSongsStore()

const searchQuery = ref('')

// Ref to ion-content for scroll handling
const ionContentRef = ref<InstanceType<typeof IonContent> | null>(null)
const scrollElement = ref<HTMLElement | null>(null)

// Draggable state - displayedItems is now directly manipulated by VueDraggable
// No need for manual drag tracking

const listId = computed(() => route.params.id as string)
const currentList = computed(() => listsStore.currentList)
const listItems = computed(() => currentList.value?.items || [])


const selectedSongItem = ref<(ListItem & { song: SongWithTags }) | null>(null)
const showSongManageTagsModal = ref(false)
const showSongManageListsModal = ref(false)


function getItemText(item: ListItem & { song: SongWithTags }): string | undefined {
  if (!settingsStore.showArtistsInLists) return undefined
  const song = item.song
  if (song.artists?.length) return song.artists.map((a: any) => a.name).join(', ')
  if (song.artist) return song.artist
  return undefined
}

function getItemTags(item: ListItem & { song: SongWithTags }) {
  return settingsStore.showTagsInLists ? item.song.tags : undefined
}

function getItemLists(item: ListItem & { song: SongWithTags }) {
  return settingsStore.showListsInLists ? (item.song as any).lists : undefined
}

function getItemDropdownItems(item: ListItem & { song: SongWithTags }) {
  return [
    { label: I18N.DROPDOWN.REMOVE_FROM_LIST, variant: 'warning' as const, callback: () => handleRemove(item) },
    { label: I18N.DROPDOWN.EDIT, callback: () => { uiStore.showOperationOverlay('Loading song...'); router.push(`/project/song/${item.song.id}/edit`) } },
    { label: I18N.DROPDOWN.MANAGE_TAGS, callback: () => openSongManageTags(item) },
    { label: I18N.DROPDOWN.MANAGE_LISTS, callback: () => openSongManageLists(item) },
    { label: I18N.DROPDOWN.DELETE, variant: 'danger' as const, callback: () => handleDeleteSong(item) },
  ]
}

async function openSongManageTags(item: ListItem & { song: SongWithTags }) {
  const personalProjectId = await authStore.getPersonalProjectId()
  if (personalProjectId) await tagsStore.fetchTags(personalProjectId)
  if (!item.library_song_id) { uiStore.showToast(I18N.TOAST.MANAGE_TAGS_ERROR, 'error'); return }
  selectedSongItem.value = item
  showSongManageTagsModal.value = true
}

async function openSongManageLists(item: ListItem & { song: SongWithTags }) {
  const personalProjectId = await authStore.getPersonalProjectId()
  if (personalProjectId) await listsStore.fetchLists(personalProjectId)
  if (!item.library_song_id) { uiStore.showToast(I18N.TOAST.MANAGE_LISTS_ERROR, 'error'); return }
  selectedSongItem.value = item
  showSongManageListsModal.value = true
}

async function handleSongTagsSaved() {
  showSongManageTagsModal.value = false
  if (selectedSongItem.value) await handleTagsUpdated(selectedSongItem.value.song.id)
  selectedSongItem.value = null
}

async function handleSongListsSaved() {
  showSongManageListsModal.value = false
  if (selectedSongItem.value) await handleListsUpdated(selectedSongItem.value.song.id)
  selectedSongItem.value = null
}

async function handleDeleteSong(item: ListItem & { song: SongWithTags }) {
  const confirmed = await uiStore.showConfirm(
    'Delete Song',
    MESSAGES.CONFIRM_DELETE_SONG(item.song.title),
    I18N.BUTTONS.DELETE,
    I18N.BUTTONS.CANCEL
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
    }
  )
}

// Filtered and searched items (writable for VueDraggable)
const displayedItems = computed({
  get() {
    let filtered = listItems.value

    // Separate songs to apply filters (titles always show)
    let songs = filtered.filter(item => item.type === 'song')

    // Apply search query
    if (searchQuery.value.trim()) {
      const query = foldAccents(searchQuery.value)
      songs = songs.filter(item => {
        if (!item.song) return false
        const song = item.song
        return foldAccents(song.title).includes(query) ||
               (song.artist && foldAccents(song.artist).includes(query)) ||
               song.livenotes_poc_id?.toLowerCase().includes(query) ||
               (song.notes && foldAccents(song.notes).includes(query))
      })
    }
    
    // Merge titles and filtered songs, maintaining original order
    const result: typeof filtered = []
    for (const item of filtered) {
      if (item.type === 'title' || songs.includes(item)) {
        result.push(item)
      }
    }
    
    return result
  },
  set(newValue) {
    // When VueDraggable reorders items, update the underlying currentList
    if (currentList.value) {
      currentList.value.items = newValue
    }
  }
})

// Drag and drop handler - called when drag ends
async function handleDragEnd() {
  if (!currentList.value) return
  
  // displayedItems has already been reordered by VueDraggable (via v-model)
  // We need to sync this to the database
  const reorderedItems = displayedItems.value
  
  // Update the currentList.value.items to match the new order
  if (currentList.value) {
    currentList.value.items = reorderedItems
  }
  
  // BACKGROUND SYNC: Update positions in database
  const itemIds = reorderedItems.map(item => item.id)
  const result = await listsStore.reorderListItems(currentList.value.id, itemIds)
  
  if (!result.success) {
    // Rollback on error
    console.error('Failed to reorder items:', result.error)
    uiStore.showToast(I18N.TOAST.REORDER_FAILED, 'error')
    await listsStore.fetchListById(currentList.value.id)
  }
  // Silent success - no toast needed since UI already updated
}

onMounted(async () => {
  try {
    // Get the scrollable element from ion-content for drag auto-scroll
    if (ionContentRef.value) {
      try {
        const content = await ionContentRef.value.$el.getScrollElement()
        scrollElement.value = content
      } catch (err) {
        console.warn('Could not get scroll element:', err)
      }
    }

    if (listId.value) {
      const result = await listsStore.fetchListById(listId.value)
      if (!result) {
        // List not found, redirect to lists page
        router.push(ROUTES.LISTS)
        return
      }
    }
    
    // Fetch tags for filtering
    const personalProjectId = await authStore.getPersonalProjectId()
    if (personalProjectId) {
      await tagsStore.fetchTags(personalProjectId)
    }
  } catch (error) {
    console.error('Error loading list:', error)
    uiStore.showToast(I18N.TOAST.LIST_LOAD_FAILED, 'error')
  } finally {
    // Always hide overlay
    uiStore.hideOperationOverlay()
  }
})

function handleRemove(item: ListItem & { song?: SongWithTags }) {
  if (!currentList.value || !item.library_song_id) return
  const listId = currentList.value.id
  const listName = currentList.value.name
  const librarySongId = item.library_song_id
  const songTitle = item.song?.title ?? 'this song'

  drawerStore.push(ConfirmDrawer, {
    title: I18N.DROPDOWN.REMOVE_FROM_LIST,
    message: `Remove "${songTitle}" from ${listName}?`,
    confirmLabel: I18N.BUTTONS.REMOVE,
    cancelLabel: I18N.BUTTONS.CANCEL,
    confirmCallback: async () => {
      try {
        await listsStore.removeLibrarySongFromList(listId, librarySongId)
        uiStore.showToast(I18N.TOAST.REMOVED_FROM_LIST(listName), 'success')
        drawerStore.popAll()
      } catch (err) {
        uiStore.showErrorToast('remove song from list', err as Error)
        drawerStore.popAll()
      }
    },
  })
}

function handleSongDeleted(songId: string) {
  // Remove deleted song from list's local state
  if (currentList.value) {
    currentList.value.items = currentList.value.items.filter(
      item => item.song_id !== songId
    )
  }
}

async function handleTagsUpdated(_songId: string) {
  // Refresh list to show updated tags (like bulk actions do)
  await handleRefresh()
}

async function handleListsUpdated(_songId: string) {
  // Refresh list to show updated list badges
  await handleRefresh()
}

function handleAddTitle() {
  if (!currentList.value) return
  const listId = currentList.value.id
  drawerStore.push(CreateItemDrawer, {
    title: I18N.MODALS.ADD_TITLE_SECTION,
    label: I18N.FORM.TITLE,
    placeholder: I18N.PLACEHOLDERS.SECTION_TITLE,
    maxLength: 200,
    submitLabel: I18N.BUTTONS.ADD,
    successMessage: I18N.TOAST.TITLE_ADDED,
    submitCallback: async (name: string) => {
      try {
        const maxPosition = listItems.value.length > 0
          ? Math.max(...listItems.value.map(item => item.position))
          : -1
        await createListItemTitle(listId, name, maxPosition + 1)
        await handleRefresh()
        return { success: true }
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Failed to add title' }
      }
    },
  })
}

function handleEditTitle(item: ListItem) {
  drawerStore.push(CreateItemDrawer, {
    title: I18N.MODALS.EDIT_TITLE_SECTION,
    label: I18N.FORM.TITLE,
    placeholder: I18N.PLACEHOLDERS.SECTION_TITLE,
    maxLength: 200,
    submitLabel: I18N.BUTTONS.SAVE,
    successMessage: I18N.TOAST.TITLE_UPDATED,
    initialValue: item.title || '',
    submitCallback: async (name: string) => {
      try {
        await updateListItemTitle(item.id, name)
        await handleRefresh()
        return { success: true }
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Failed to update title' }
      }
    },
  })
}

async function handleDeleteTitle(item: any) {
  const confirmed = await uiStore.showConfirm(
    'Delete Title',
    'Are you sure you want to delete this title section?',
    I18N.BUTTONS.DELETE,
    I18N.BUTTONS.CANCEL
  )

  if (!confirmed) return

  try {
    await deleteListItem(item.id)
    uiStore.showToast(I18N.TOAST.TITLE_DELETED, 'success')
    await handleRefresh()
  } catch (err) {
    console.error('Failed to delete title:', err)
    uiStore.showToast(I18N.TOAST.TITLE_DELETE_FAILED, 'error')
  }
}

async function handleRefresh() {
  // Refresh list to show updated tags/lists
  if (listId.value) {
    await listsStore.fetchListById(listId.value)
  }
}


function handleChooseAction() {
  const actions: BulkAction[] = [
    { label: I18N.BULK_ACTIONS.REMOVE_FROM_LIST, variant: 'warning', keepDrawerOpen: true, onClick: handleBulkRemoveFromList },
    { label: I18N.BULK_ACTIONS.DELETE, variant: 'danger', keepDrawerOpen: true, onClick: handleBulkDeleteSongs },
    { label: I18N.BULK_ACTIONS.ADD_TO_LISTS, keepDrawerOpen: true, onClick: handleBulkAddToLists },
    { label: I18N.BULK_ACTIONS.ASSIGN_TAGS, keepDrawerOpen: true, onClick: handleBulkAssignTags },
    { label: I18N.BULK_ACTIONS.REMOVE_TAGS, keepDrawerOpen: true, onClick: handleBulkRemoveTags },
  ]
  drawerStore.push(BulkActionsDrawer, { actions })
}

function handleBulkRemoveFromList() {
  const ids = [...uiStore.selectedIds]
  const count = ids.length
  const listName = currentList.value?.name || ''

  drawerStore.push(ConfirmDrawer, {
    title: `Remove ${count} song${count !== 1 ? 's' : ''} from list?`,
    message: `This will remove ${count} song${count !== 1 ? 's' : ''} from ${listName}.`,
    confirmLabel: I18N.BUTTONS.REMOVE,
    cancelLabel: I18N.BUTTONS.CANCEL,
    confirmCallback: async () => {
      try {
        for (const listItemId of ids) {
          const { error } = await (await import('@/lib/supabase')).supabase
            .from('list_items')
            .delete()
            .eq('id', listItemId)
          if (error) throw error
        }
        await handleRefresh()
        uiStore.showToast(I18N.TOAST.BULK_REMOVED_FROM_LIST(count, listName), 'success')
        uiStore.exitSelectionMode()
        drawerStore.popAll()
      } catch (err) {
        uiStore.showErrorToast('remove songs from list', err as Error)
        drawerStore.popAll()
      }
    },
  })
}

function handleBulkDeleteSongs() {
  const count = uiStore.selectedIds.length
  const selectedListItemIds = [...uiStore.selectedIds]
  const librarySongIds = selectedListItemIds
    .map(id => listItems.value.find(i => i.id === id)?.library_song_id)
    .filter(Boolean) as string[]

  drawerStore.push(ConfirmDrawer, {
    title: I18N.MODAL_CONTENT.BULK_DELETE_SONGS_TITLE(count),
    message: I18N.MODAL_CONTENT.BULK_DELETE_SONGS_MESSAGE(count),
    confirmLabel: I18N.BUTTONS.DELETE,
    cancelLabel: I18N.BUTTONS.CANCEL,
    confirmVariant: 'danger',
    confirmCallback: async () => {
      try {
        const { supabase } = await import('@/lib/supabase')
        for (const librarySongId of librarySongIds) {
          const { error } = await supabase
            .from('library_songs')
            .delete()
            .eq('id', librarySongId)
          if (error) throw error
        }
        await handleRefresh()
        uiStore.showToast(I18N.TOAST.BULK_DELETED_SONGS(count), 'success')
        uiStore.exitSelectionMode()
        drawerStore.popAll()
      } catch (err) {
        uiStore.showErrorToast('delete songs', err as Error)
        drawerStore.popAll()
      }
    },
  })
}

function handleBulkAddToLists() {
  const ids = [...uiStore.selectedIds]
  const librarySongIds = ids
    .map(id => listItems.value.find(i => i.id === id)?.library_song_id)
    .filter(Boolean) as string[]

  drawerStore.push(BulkAddToListsDrawer, {
    excludeListId: listId.value,
    applyCallback: async (listIds: string[]) => {
      try {
        for (const targetListId of listIds) {
          await listsStore.bulkAddLibrarySongsToList(targetListId, librarySongIds)
        }
        await handleRefresh()
        uiStore.showToast(I18N.TOAST.BULK_ADDED_TO_LISTS(ids.length), 'success')
        uiStore.exitSelectionMode()
        drawerStore.popAll()
      } catch (err) {
        uiStore.showErrorToast('add to lists', err as Error)
        drawerStore.popAll()
      }
    },
  })
}

function handleBulkAssignTags() {
  const ids = [...uiStore.selectedIds]
  const librarySongIds = ids
    .map(id => listItems.value.find(i => i.id === id)?.library_song_id)
    .filter(Boolean) as string[]

  drawerStore.push(BulkAssignTagsDrawer, {
    applyCallback: async (tagIds: string[]) => {
      try {
        await tagsStore.bulkAssignTags(librarySongIds, tagIds)
        await handleRefresh()
        uiStore.showToast(I18N.TOAST.BULK_TAGS_ASSIGNED(ids.length), 'success')
        uiStore.exitSelectionMode()
        drawerStore.popAll()
      } catch (err) {
        uiStore.showErrorToast('assign tags', err as Error)
        drawerStore.popAll()
      }
    },
  })
}

function handleBulkRemoveTags() {
  const ids = [...uiStore.selectedIds]
  const librarySongIds = ids
    .map(id => listItems.value.find(i => i.id === id)?.library_song_id)
    .filter(Boolean) as string[]

  drawerStore.push(BulkRemoveTagsDrawer, {
    applyCallback: async (tagIds: string[]) => {
      try {
        await tagsStore.bulkRemoveTags(librarySongIds, tagIds)
        await handleRefresh()
        uiStore.showToast(I18N.TOAST.BULK_TAGS_REMOVED(ids.length), 'success')
        uiStore.exitSelectionMode()
        drawerStore.popAll()
      } catch (err) {
        uiStore.showErrorToast('remove tags', err as Error)
        drawerStore.popAll()
      }
    },
  })
}

function handleOpenNotes(item: ListItem & { song: SongWithTags }) {
  const librarySongId = item.library_song_id
  if (!librarySongId) {
    uiStore.showToast(I18N.TOAST.NOTES_CANNOT_OPEN, 'error')
    return
  }
  const drawer = settingsStore.songClickShowsLyrics ? LiveLyricsDrawer : SongNotesDrawer
  drawerStore.push(drawer, { librarySongId })
}

</script>

<style scoped>
/* VueDraggable classes */
.drag-ghost {
  opacity: 0.4;
  background: rgba(59, 130, 246, 0.1);
}

.drag-chosen {
  opacity: 0.8;
  transform: scale(1.02);
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
}

.drag-active {
  opacity: 1;
  box-shadow: 0 8px 30px rgba(59, 130, 246, 0.5);
  cursor: grabbing !important;
  transform: rotate(2deg);
  z-index: 1000;
}

.drag-handle {
  cursor: grab;
}

.drag-handle:active {
  cursor: grabbing;
}
</style>
