<template>
  <ion-page>
    <ion-content ref="ionContentRef" class="bg-gray-900">
      <!-- Header -->
      <AppHeader
        :title="currentList?.name || I18N.PAGE_TITLES.LIST_DETAIL"
        :show-back="true"
        :show-menu="true"
      >
        <template #action>
          <div v-if="!uiStore.selectionMode && listItems.length > 0" class="relative">
            <!-- Dropdown Button -->
            <button
              @click="isPageMenuOpen = !isPageMenuOpen"
              class="p-2 text-white hover:text-gray-300 transition-colors"
              :aria-label="'Page menu'"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
              </svg>
            </button>

            <!-- Dropdown Menu -->
            <div
              v-if="isPageMenuOpen"
              @click="isPageMenuOpen = false"
              class="fixed inset-0 z-40 bg-black bg-opacity-20"
            />
            <div
              v-if="isPageMenuOpen"
              class="absolute right-0 top-12 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden"
            >
              <button
                @click="handleAddTitleFromMenu"
                class="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-gray-700 transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/>
                </svg>
                <span>Add Title Section</span>
              </button>
              <button
                @click="handleEnterSelectionMode"
                class="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-gray-700 transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                </svg>
                {{ I18N.DROPDOWN.SELECT_SONGS }}
              </button>
            </div>
          </div>
        </template>
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
        <h2 class="text-xl font-semibold text-white mb-2">{{ MESSAGES.EMPTY_LIST_NO_SONGS }}</h2>
        <p class="text-gray-400 mb-6">{{ MESSAGES.EMPTY_LIST_NO_SONGS_SUBTITLE }}</p>
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
              <ListSongCard
                v-else
                :item="item"
                :draggable="true"
                @remove="handleRemove(item)"
                @songDeleted="handleSongDeleted"
                @tagsUpdated="handleTagsUpdated"
                @listsUpdated="handleListsUpdated"
                @openNotes="handleOpenNotes"
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

      <!-- Sticky Bottom Bar -->
      <div v-if="listItems.length > 0" class="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4 z-10">
        <div class="max-w-2xl mx-auto">
          <!-- Selection Mode Controls -->
          <ListBulkActions
            v-if="uiStore.selectionMode"
            :listId="listId"
            :listName="currentList?.name || ''"
            :listItems="listItems"
            @selectAll="handleSelectAll"
            @refresh="handleRefresh"
            @songsDeleted="handleSongsDeleted"
          />

          <!-- Search & Filter Controls -->
          <ListFilterBar
            v-else
            v-model:searchQuery="searchQuery"
            v-model:selectedTagIds="selectedTagIds"
          />
        </div>
      </div>

      <!-- Title Modal -->
      <div
        v-if="showTitleModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-20"
        @click.self="showTitleModal = false"
      >
        <div class="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700">
          <h3 class="text-xl font-semibold text-white mb-4">
            {{ editingTitle ? 'Edit Title' : 'Add Title Section' }}
          </h3>
          
          <div class="mb-4">
            <label for="titleInput" class="block text-sm font-medium text-gray-300 mb-2">
              Title Text <span class="text-red-400">*</span>
            </label>
            <input
              id="titleInput"
              v-model="titleInput"
              type="text"
              maxlength="200"
              class="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Enter section title"
              @keyup.enter="handleSaveTitle"
              autofocus
            />
          </div>

          <div class="flex gap-3">
            <button
              @click="showTitleModal = false"
              class="flex-1 px-6 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              @click="handleSaveTitle"
              :disabled="!titleInput.trim() || isSavingTitle"
              class="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ isSavingTitle ? 'Saving...' : (editingTitle ? 'Update' : 'Add') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Song Notes Drawer -->
      <SongNotesDrawer
        :isOpen="uiStore.songNotesDrawerOpen"
        :librarySong="uiStore.selectedLibrarySong"
        @close="uiStore.closeSongNotesDrawer"
        @noteClick="handleNoteClick"
        @addNote="handleAddNote"
      />

      <!-- Note Content Drawer -->
      <NoteContentDrawer
        :isOpen="uiStore.noteContentDrawerOpen"
        :note="uiStore.selectedNote"
        @close="uiStore.closeNoteContentDrawer"
        @edit="handleEditNote"
        @delete="handleDeleteNote"
      />

      <!-- Note Creation Drawer -->
      <NoteCreationDrawer
        :isOpen="uiStore.noteCreationDrawerOpen"
        :librarySongId="uiStore.selectedLibrarySong?.id || ''"
        @close="uiStore.closeNoteCreationDrawer"
        @saved="handleNoteSaved"
      />

      <!-- Note Editor (edit existing note) -->
      <NoteEditor
        :isOpen="noteEditorOpen"
        :note="editingNote"
        :librarySongId="uiStore.selectedLibrarySong?.id || ''"
        @close="closeNoteEditor"
        @saved="closeNoteEditor(); handleNoteSaved()"
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonPage, IonContent } from '@ionic/vue'
import VueDraggable from 'vuedraggable'
import { useListsStore } from '@/stores/lists'
import { useTagsStore } from '@/stores/tags'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { fetchLibrarySongWithDetails } from '@/services/libraryService'
import { updateListItemTitle, createListItemTitle, deleteListItem } from '@/services/listItemService'
import { MESSAGES } from '@/constants/messages'
import { ROUTES } from '@/constants/routes'
import { I18N } from '@/constants/i18n'
import { executeOperation } from '@/utils/operations'
import AppHeader from '@/components/AppHeader.vue'
import ListSongCard from '@/components/ListSongCard.vue'
import ListTitleCard from '@/components/ListTitleCard.vue'
import ListBulkActions from '@/components/ListBulkActions.vue'
import ListFilterBar from '@/components/ListFilterBar.vue'
import SongNotesDrawer from '@/components/SongNotesDrawer.vue'
import NoteContentDrawer from '@/components/NoteContentDrawer.vue'
import NoteCreationDrawer from '@/components/NoteCreationDrawer.vue'
import NoteEditor from '@/components/NoteEditor.vue'
import type { Note, ListItem, SongWithTags } from '@/types/database'

const route = useRoute()
const router = useRouter()
const listsStore = useListsStore()
const tagsStore = useTagsStore()
const authStore = useAuthStore()
const uiStore = useUiStore()

const isPageMenuOpen = ref(false)
const editingNote = ref<Note | null>(null)
const noteEditorOpen = ref(false)
const searchQuery = ref('')
const selectedTagIds = ref<string[]>([])
const showTitleModal = ref(false)
const editingTitle = ref<any>(null)
const titleInput = ref('')
const isSavingTitle = ref(false)

// Ref to ion-content for scroll handling
const ionContentRef = ref<InstanceType<typeof IonContent> | null>(null)
const scrollElement = ref<HTMLElement | null>(null)

// Draggable state - displayedItems is now directly manipulated by VueDraggable
// No need for manual drag tracking

const listId = computed(() => route.params.id as string)
const currentList = computed(() => listsStore.currentList)
const listItems = computed(() => currentList.value?.items || [])

// Filtered and searched items (writable for VueDraggable)
const displayedItems = computed({
  get() {
    let filtered = listItems.value
    
    // Separate songs to apply filters (titles always show)
    let songs = filtered.filter(item => item.type === 'song')
    
    // Apply tag filter (AND logic - song must have ALL selected tags)
    if (selectedTagIds.value.length > 0) {
      songs = songs.filter(item => {
        if (!item.song) return false
        const songTagIds = item.song.tags?.map(t => t.id) || []
        return selectedTagIds.value.every(tagId => songTagIds.includes(tagId))
      })
    }
    
    // Apply search query
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase()
      songs = songs.filter(item => {
        if (!item.song) return false
        const song = item.song
        return song.title.toLowerCase().includes(query) ||
               song.artist?.toLowerCase().includes(query) ||
               song.livenotes_poc_id?.toLowerCase().includes(query) ||
               song.notes?.toLowerCase().includes(query)
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
    uiStore.showToast('Failed to reorder items', 'error')
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
    uiStore.showToast('Failed to load list', 'error')
  } finally {
    // Always hide overlay
    uiStore.hideOperationOverlay()
  }
})

async function handleRemove(item: any) {
  if (!currentList.value) return
  
  await executeOperation(
    () => listsStore.removeSongFromList(currentList.value!.id, item.song_id),
    {
      loadingMessage: 'Removing song from list...',
      successMessage: I18N.TOAST.REMOVED_FROM_LIST(currentList.value!.name),
      errorContext: 'remove song from list',
    }
  )
  // No need to refresh - removeSongFromList already updates local state
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
  editingTitle.value = null
  titleInput.value = ''
  showTitleModal.value = true
}

function handleAddTitleFromMenu() {
  isPageMenuOpen.value = false
  handleAddTitle()
}

function handleEditTitle(item: any) {
  editingTitle.value = item
  titleInput.value = item.title || ''
  showTitleModal.value = true
}

async function handleSaveTitle() {
  if (!currentList.value || !titleInput.value.trim()) return
  
  isSavingTitle.value = true
  
  try {
    if (editingTitle.value) {
      await updateListItemTitle(editingTitle.value.id, titleInput.value.trim())
      uiStore.showToast('Title updated', 'success')
    } else {
      const maxPosition = listItems.value.length > 0
        ? Math.max(...listItems.value.map(item => item.position))
        : -1
      await createListItemTitle(currentList.value.id, titleInput.value.trim(), maxPosition + 1)
      uiStore.showToast('Title added', 'success')
    }
    
    showTitleModal.value = false
    await handleRefresh()
  } catch (err) {
    console.error('Failed to save title:', err)
    uiStore.showToast('Failed to save title', 'error')
  } finally {
    isSavingTitle.value = false
  }
}

async function handleDeleteTitle(item: any) {
  const confirmed = await uiStore.showConfirm(
    'Delete Title',
    'Are you sure you want to delete this title section?',
    'Delete',
    'Cancel'
  )
  
  if (!confirmed) return
  
  try {
    await deleteListItem(item.id)
    uiStore.showToast('Title deleted', 'success')
    await handleRefresh()
  } catch (err) {
    console.error('Failed to delete title:', err)
    uiStore.showToast('Failed to delete title', 'error')
  }
}

async function handleRefresh() {
  // Refresh list to show updated tags/lists
  if (listId.value) {
    await listsStore.fetchListById(listId.value)
  }
}

function handleEnterSelectionMode() {
  isPageMenuOpen.value = false
  uiStore.enterSelectionMode()
}

function handleSelectAll() {
  const allListItemIds = displayedItems.value
    .filter(item => item.type === 'song')
    .map(item => item.id)
  uiStore.selectAll(allListItemIds)
}

function handleSongsDeleted(deletedIds: string[]) {
  // Remove deleted songs from list's local state
  if (currentList.value) {
    currentList.value.items = currentList.value.items.filter(
      item => item.song_id && !deletedIds.includes(item.song_id)
    )
  }
}

// Notes drawer handlers
async function handleOpenNotes(item: ListItem & { song: SongWithTags }) {
  // Fetch full library song details including notes
  const librarySongId = (item as any).library_song_id
  if (!librarySongId) {
    uiStore.showToast('Cannot open notes for this song', 'error')
    return
  }
  
  try {
    const librarySong = await fetchLibrarySongWithDetails(librarySongId)
    uiStore.openSongNotesDrawer(librarySong)
  } catch (err) {
    console.error('Failed to load song notes:', err)
    uiStore.showToast('Failed to load song notes', 'error')
  }
}

function handleNoteClick(note: Note) {
  uiStore.openNoteContentDrawer(note)
}

function handleAddNote() {
  uiStore.openNoteCreationDrawer()
}

async function handleNoteSaved() {
  if (uiStore.selectedLibrarySong) {
    try {
      uiStore.selectedLibrarySong = await fetchLibrarySongWithDetails(uiStore.selectedLibrarySong.id)
    } catch (err) {
      console.error('Failed to refresh library song:', err)
    }
  }
}

function handleEditNote(note: Note) {
  editingNote.value = note
  noteEditorOpen.value = true
}

function closeNoteEditor() {
  noteEditorOpen.value = false
  setTimeout(() => { editingNote.value = null }, 300)
}

async function handleDeleteNote(note: Note) {
  const confirmed = await uiStore.showConfirm(
    'Delete Note',
    `Are you sure you want to delete this ${note.title || 'note'}?`,
    'Delete',
    'Cancel'
  )
  
  if (!confirmed) return
  
  uiStore.closeNoteContentDrawer()
  uiStore.showToast('Delete note functionality coming soon', 'success')
  console.log('Delete note:', note)
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
