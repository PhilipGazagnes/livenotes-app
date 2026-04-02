<template>
  <ion-page>
    <ion-content class="bg-gray-900">
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

      <!-- Loading State -->
      <div v-if="listsStore.isLoading" class="flex items-center justify-center py-20">
        <LoadingSpinner />
      </div>

      <!-- Empty State -->
      <div v-else-if="!listsStore.isLoading && !currentList" class="text-center py-12 px-4">
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
        <template v-for="(item, index) in displayedItems" :key="item.id">
          <div
            :class="[
              'mb-3 transition-all duration-200',
              dragState.draggedIndex === index && 'opacity-30',
              dragState.draggedIndex !== null && dragState.draggedIndex !== index && 'pointer-events-auto'
            ]"
            @dragover.prevent="handleDragOver($event, index)"
            @drop="handleDrop($event, index)"
          >
            <!-- Drop Indicator (appears above item when dragging over) -->
            <div
              v-if="dragState.dropIndex === index && dragState.draggedIndex !== index"
              class="h-1 mb-3 rounded-full"
              style="background: linear-gradient(90deg, transparent, #3b82f6, transparent); box-shadow: 0 0 8px rgba(59, 130, 246, 0.8);"
            ></div>
            
            <!-- Draggable Item Wrapper -->
            <div
              draggable="true"
              @dragstart="handleDragStart($event, index)"
              @dragend="handleDragEnd"
              :class="[
                'cursor-move',
                dragState.draggedIndex === index && 'is-dragging'
              ]"
            >
              <!-- Title Card -->
              <ListTitleCard
                v-if="item.type === 'title'"
                :item="item"
                @edit="handleEditTitle(item)"
                @delete="handleDeleteTitle(item)"
              />
              
              <!-- Song Card -->
              <ListSongCard
                v-else
                :item="item"
                @remove="handleRemove(item)"
              />
            </div>
          </div>
        </template>
        
        <!-- Drop indicator at the end -->
        <div
          v-if="dragState.dropIndex === displayedItems.length && dragState.draggedIndex !== null"
          class="h-1 rounded-full"
          style="background: linear-gradient(90deg, transparent, #3b82f6, transparent); box-shadow: 0 0 8px rgba(59, 130, 246, 0.8);"
        ></div>
        
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
          <div v-if="uiStore.selectionMode" class="space-y-3">
            <!-- Action Buttons -->
            <div v-if="uiStore.selectedIds.length > 0" class="flex flex-wrap gap-2">
              <button
                @click="handleBulkRemoveFromList"
                class="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {{ I18N.BULK_ACTIONS.REMOVE_FROM_LIST }}
              </button>
              <button
                @click="handleBulkDelete"
                class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {{ I18N.BULK_ACTIONS.DELETE }}
              </button>
              <button
                @click="handleBulkAddToLists"
                class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {{ I18N.BULK_ACTIONS.ADD_TO_LISTS }}
              </button>
              <button
                @click="handleBulkAssignTags"
                class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {{ I18N.BULK_ACTIONS.ASSIGN_TAGS }}
              </button>
              <button
                @click="handleBulkRemoveTags"
                class="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {{ I18N.BULK_ACTIONS.REMOVE_TAGS }}
              </button>
            </div>

            <!-- Selection Controls -->
            <div class="flex items-center justify-between gap-4">
              <div class="text-white font-medium">
                {{ I18N.COUNTERS.SELECTED(uiStore.selectedIds.length) }}
              </div>
              <div class="flex gap-2">
                <button
                  @click="handleSelectAll"
                  class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {{ I18N.BUTTONS.SELECT_ALL }}
                </button>
                <button
                  v-if="uiStore.selectedIds.length > 0"
                  @click="uiStore.deselectAll"
                  class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {{ I18N.BUTTONS.DESELECT_ALL }}
                </button>
                <button
                  @click="uiStore.exitSelectionMode"
                  class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {{ I18N.BUTTONS.DONE }}
                </button>
              </div>
            </div>
          </div>

          <!-- Search & Filter Controls -->
          <div v-else class="flex gap-2">
            <div class="relative flex-1">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
              <input
                v-model="searchQuery"
                type="text"
                :placeholder="I18N.PLACEHOLDERS.SEARCH_SONGS"
                class="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              @click="openFilterModal"
              class="px-4 py-3 bg-gray-900 border rounded-lg transition-colors"
              :class="selectedTagIds.length > 0 ? 'border-blue-500 text-blue-400' : 'border-gray-700 text-gray-400 hover:text-white'"
              :aria-label="I18N.FILTER.FILTER_BY_TAGS"
            >
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
                </svg>
                <span v-if="selectedTagIds.length > 0" class="text-sm font-medium">{{ selectedTagIds.length }}</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Filter Modal -->
      <FilterByTagsModal
        :isOpen="showFilterModal"
        :initialTagIds="selectedTagIds"
        @close="showFilterModal = false"
        @apply="handleApplyFilter"
      />

      <!-- Bulk Action Modals -->
      <BulkAddToListsModal
        :isOpen="showBulkAddToListsModal"
        @close="showBulkAddToListsModal = false"
        @apply="handleBulkAddToListsApply"
      />

      <BulkAssignTagsModal
        :isOpen="showBulkAssignTagsModal"
        @close="showBulkAssignTagsModal = false"
        @apply="handleBulkAssignTagsApply"
      />

      <BulkRemoveTagsModal
        :isOpen="showBulkRemoveTagsModal"
        @close="showBulkRemoveTagsModal = false"
        @apply="handleBulkRemoveTagsApply"
      />

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
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonPage, IonContent } from '@ionic/vue'
import { useListsStore } from '@/stores/lists'
import { useSongsStore } from '@/stores/songs'
import { useTagsStore } from '@/stores/tags'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { supabase } from '@/utils/supabase'
import { MESSAGES } from '@/constants/messages'
import { ROUTES } from '@/constants/routes'
import { I18N } from '@/constants/i18n'
import AppHeader from '@/components/AppHeader.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import ListSongCard from '@/components/ListSongCard.vue'
import ListTitleCard from '@/components/ListTitleCard.vue'
import FilterByTagsModal from '@/components/FilterByTagsModal.vue'
import BulkAddToListsModal from '@/components/BulkAddToListsModal.vue'
import BulkAssignTagsModal from '@/components/BulkAssignTagsModal.vue'
import BulkRemoveTagsModal from '@/components/BulkRemoveTagsModal.vue'

const route = useRoute()
const router = useRouter()
const listsStore = useListsStore()
const songsStore = useSongsStore()
const tagsStore = useTagsStore()
const authStore = useAuthStore()
const uiStore = useUiStore()

const isPageMenuOpen = ref(false)
const searchQuery = ref('')
const selectedTagIds = ref<string[]>([])
const showFilterModal = ref(false)
const showBulkAddToListsModal = ref(false)
const showBulkAssignTagsModal = ref(false)
const showBulkRemoveTagsModal = ref(false)
const showTitleModal = ref(false)
const editingTitle = ref<any>(null)
const titleInput = ref('')
const isSavingTitle = ref(false)

// Drag and drop state
const dragState = ref({
  draggedIndex: null as number | null,
  dropIndex: null as number | null,
})

const listId = computed(() => route.params.id as string)
const currentList = computed(() => listsStore.currentList)
const listItems = computed(() => currentList.value?.items || [])

// Filtered and searched items
const displayedItems = computed(() => {
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
})

function openFilterModal() {
  showFilterModal.value = true
}

function handleApplyFilter(tagIds: string[]) {
  selectedTagIds.value = tagIds
}

// Drag and drop handlers
function handleDragStart(event: DragEvent, index: number) {
  if (uiStore.selectionMode) return
  
  dragState.value.draggedIndex = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/html', '')
  }
}

function handleDragOver(event: DragEvent, index: number) {
  if (dragState.value.draggedIndex === null) return
  event.preventDefault()
  
  // Determine drop position based on mouse Y position relative to element
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const midpoint = rect.top + rect.height / 2
  
  // If dragging over the top half, insert before; bottom half, insert after
  if (event.clientY < midpoint) {
    dragState.value.dropIndex = index
  } else {
    dragState.value.dropIndex = index + 1
  }
}

function handleDragEnd() {
  dragState.value.draggedIndex = null
  dragState.value.dropIndex = null
}

async function handleDrop(event: DragEvent, index: number) {
  event.preventDefault()
  
  const draggedIdx = dragState.value.draggedIndex
  if (draggedIdx === null || !currentList.value) return
  
  // Calculate actual drop index
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const midpoint = rect.top + rect.height / 2
  let dropIdx = event.clientY < midpoint ? index : index + 1
  
  // Don't reorder if dropped in same position
  if (draggedIdx === dropIdx || draggedIdx + 1 === dropIdx) {
    handleDragEnd()
    return
  }
  
  // Adjust drop index if dragging downwards
  if (draggedIdx < dropIdx) {
    dropIdx--
  }
  
  // Reorder items in the array
  const items = [...displayedItems.value]
  const [draggedItem] = items.splice(draggedIdx, 1)
  items.splice(dropIdx, 0, draggedItem)
  
  // Update positions in database
  const itemIds = items.map(item => item.id)
  const result = await listsStore.reorderListItems(currentList.value.id, itemIds)
  
  if (result.success) {
    uiStore.showToast('Order updated', 'success')
    await handleRefresh()
  } else {
    uiStore.showToast(result.error || 'Failed to update order', 'error')
  }
  
  handleDragEnd()
}

onMounted(async () => {
  if (listId.value) {
    const result = await listsStore.fetchListById(listId.value)
    if (!result) {
      // List not found, redirect to lists page
      router.push(ROUTES.LISTS)
    }
  }
  
  // Fetch tags for filtering
  const personalProjectId = await authStore.getPersonalProjectId()
  if (personalProjectId) {
    await tagsStore.fetchTags(personalProjectId)
  }
})

async function handleRemove(item: any) {
  if (!currentList.value) return
  
  const result = await listsStore.removeSongFromList(currentList.value.id, item.song_id)
  
  if (result.success) {
    uiStore.showToast(I18N.TOAST.REMOVED_FROM_LIST(currentList.value.name), 'success')
    // Refresh list to remove the item from UI
    await handleRefresh()
  } else {
    uiStore.showToast(result.error || MESSAGES.ERROR.SAVE_FAILED, 'error')
  }
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
      // Update existing title
      const { error } = await supabase
        .from('list_items')
        .update({ title: titleInput.value.trim() })
        .eq('id', editingTitle.value.id)
      
      if (error) throw error
      uiStore.showToast('Title updated', 'success')
    } else {
      // Create new title at the end
      const maxPosition = listItems.value.length > 0 
        ? Math.max(...listItems.value.map(item => item.position))
        : -1
      
      const { error } = await supabase
        .from('list_items')
        .insert({
          list_id: currentList.value.id,
          type: 'title',
          title: titleInput.value.trim(),
          position: maxPosition + 1,
        })
      
      if (error) throw error
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
    const { error } = await supabase
      .from('list_items')
      .delete()
      .eq('id', item.id)
    
    if (error) throw error
    
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
  const allSongIds = displayedItems.value
    .filter(item => item.type === 'song' && item.song)
    .map(item => item.song!.id)
  uiStore.selectAll(allSongIds)
}

async function handleBulkRemoveFromList() {
  const count = uiStore.selectedIds.length
  
  if (!currentList.value) return
  
  try {
    // Remove all selected songs from the current list
    for (const songId of uiStore.selectedIds) {
      await listsStore.removeSongFromList(currentList.value.id, songId)
    }
    
    uiStore.showToast(I18N.TOAST.BULK_REMOVED_FROM_LIST(count, currentList.value.name), 'success')
    uiStore.exitSelectionMode()
    await handleRefresh()
  } catch (err) {
    console.error('Failed to remove songs from list:', err)
    uiStore.showToast('Failed to remove songs from list', 'error')
  }
}

async function handleBulkDelete() {
  const count = uiStore.selectedIds.length
  const confirmed = await uiStore.showConfirm(
    I18N.MODAL_CONTENT.BULK_DELETE_SONGS_TITLE(count),
    I18N.MODAL_CONTENT.BULK_DELETE_SONGS_MESSAGE(count),
    I18N.BUTTONS.DELETE,
    I18N.BUTTONS.CANCEL
  )
  
  if (confirmed) {
    const projectId = await authStore.getPersonalProjectId()
    if (projectId) {
      const result = await songsStore.bulkDelete(uiStore.selectedIds, projectId)
      if (result.success) {
        uiStore.showToast(I18N.TOAST.BULK_DELETED_SONGS(count), 'success')
        uiStore.exitSelectionMode()
        await handleRefresh()
      } else {
        uiStore.showToast(result.error || 'Failed to delete songs', 'error')
      }
    }
  }
}

async function handleBulkAddToLists() {
  showBulkAddToListsModal.value = true
}

async function handleBulkAddToListsApply(listIds: string[]) {
  const songCount = uiStore.selectedIds.length
  
  try {
    // Add each selected song to each selected list
    for (const listId of listIds) {
      for (const songId of uiStore.selectedIds) {
        await listsStore.addSongToList(listId, songId)
      }
    }
    
    uiStore.showToast(I18N.TOAST.BULK_ADDED_TO_LISTS(songCount), 'success')
    uiStore.exitSelectionMode()
  } catch (err) {
    console.error('Failed to add songs to lists:', err)
    uiStore.showToast('Failed to add songs to lists', 'error')
  }
}

async function handleBulkAssignTags() {
  showBulkAssignTagsModal.value = true
}

async function handleBulkAssignTagsApply(tagIds: string[]) {
  const songCount = uiStore.selectedIds.length
  
  try {
    // Create song_tag entries for each song-tag combination
    const inserts = []
    for (const songId of uiStore.selectedIds) {
      for (const tagId of tagIds) {
        inserts.push({ song_id: songId, tag_id: tagId })
      }
    }
    
    const { error } = await supabase
      .from('song_tags')
      .upsert(inserts, { onConflict: 'song_id,tag_id', ignoreDuplicates: true })
    
    if (error) throw error
    
    // Refresh list to show updated tags
    await handleRefresh()
    
    uiStore.showToast(I18N.TOAST.BULK_TAGS_ASSIGNED(songCount), 'success')
    uiStore.exitSelectionMode()
  } catch (err) {
    console.error('Failed to assign tags:', err)
    uiStore.showToast('Failed to assign tags', 'error')
  }
}

async function handleBulkRemoveTags() {
  showBulkRemoveTagsModal.value = true
}

async function handleBulkRemoveTagsApply(tagIds: string[]) {
  const songCount = uiStore.selectedIds.length
  
  try {
    // Remove tag associations for selected songs and tags
    const { error } = await supabase
      .from('song_tags')
      .delete()
      .in('song_id', uiStore.selectedIds)
      .in('tag_id', tagIds)
    
    if (error) throw error
    
    // Refresh list to show updated tags
    await handleRefresh()
    
    uiStore.showToast(I18N.TOAST.BULK_TAGS_REMOVED(songCount), 'success')
    uiStore.exitSelectionMode()
  } catch (err) {
    console.error('Failed to remove tags:', err)
    uiStore.showToast('Failed to remove tags', 'error')
  }
}
</script>

<style scoped>
.is-dragging {
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
  opacity: 0.9;
  z-index: 1000;
  cursor: grabbing !important;
}

.cursor-move {
  cursor: grab;
}

.cursor-move:active {
  cursor: grabbing;
}
</style>
