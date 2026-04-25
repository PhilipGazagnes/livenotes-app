<template>
  <ion-page>
    <ion-content class="bg-gray-900">
      <!-- Header -->
      <AppHeader :title="'My Library'">
        <template #action>
          <button
            v-if="!uiStore.selectionMode"
            @click="showAddSongModal = true"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            + Add Song
          </button>
        </template>
      </AppHeader>

      <!-- Filter Bar -->
      <ListFilterBar
        v-if="!uiStore.selectionMode && libraryStore.librarySongCount > 0"
        v-model:searchQuery="searchQuery"
        :selectedTagIds="selectedTagIds"
        @clearFilters="handleClearFilters"
        @filterByTags="showFilterByTagsModal = true"
      />

      <!-- Loading State -->
      <div v-if="libraryStore.isLoading" class="flex items-center justify-center py-24">
        <LoadingSpinner />
      </div>

      <!-- Empty State -->
      <div v-else-if="libraryStore.librarySongCount === 0" class="text-center py-12 px-4">
        <svg class="w-24 h-24 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
        </svg>
        <h2 class="text-xl font-semibold text-white mb-2">{{ MESSAGES.EMPTY_LIBRARY_NO_SONGS }}</h2>
        <p class="text-gray-400 mb-6">{{ MESSAGES.EMPTY_LIBRARY_NO_SONGS_SUBTITLE }}</p>
        
        <button
          @click="showAddSongModal = true"
          class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Add Your First Song
        </button>
      </div>

      <!-- Library Songs List -->
      <div v-else class="pb-24">
        <div v-if="displayedSongs.length === 0 && (searchQuery || selectedTagIds.length > 0)" class="text-center py-12 px-4">
          <svg class="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <p class="text-gray-400">No songs match your filters</p>
        </div>
        <div v-else class="p-4 space-y-4">
          <div
            v-for="librarySong in displayedSongs"
            :key="librarySong.id"
            class="bg-gray-800 rounded-lg p-4 border border-gray-700"
          >
            <!-- Song Header -->
            <div class="flex items-start justify-between mb-4">
              <div class="flex-1 min-w-0">
                <h3 class="text-xl font-semibold text-white truncate">
                  {{ librarySong.custom_title || librarySong.song?.title }}
                </h3>
                <p class="text-gray-400 text-sm mt-1">
                  {{ librarySong.song?.artists?.map(a => a.name).join(', ') || 'Unknown Artist' }}
                </p>
              </div>
              
              <div class="flex items-center gap-2 ml-3">
                <!-- Selection Checkbox -->
                <input
                  v-if="uiStore.selectionMode"
                  type="checkbox"
                  :checked="uiStore.selectedIds.includes(librarySong.id)"
                  @change="uiStore.toggleSelection(librarySong.id)"
                  class="w-5 h-5 rounded border-gray-600 text-blue-600"
                />
                
                <!-- Actions Menu -->
                <div v-else class="relative">
                  <button
                    @click="toggleSongMenu(librarySong.id)"
                    class="p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
                    </svg>
                  </button>
                  
                  <!-- Dropdown Menu -->
                  <div
                    v-if="activeSongMenu === librarySong.id"
                    v-click-outside="closeSongMenu"
                    class="absolute right-0 top-10 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-10"
                  >
                    <button
                      @click="handleManageLists(librarySong)"
                      class="w-full text-left px-4 py-2 text-white hover:bg-gray-800 transition-colors"
                    >
                      Manage Lists
                    </button>
                    <button
                      @click="handleRemoveFromLibrary(librarySong)"
                      class="w-full text-left px-4 py-2 text-red-400 hover:bg-gray-800 transition-colors"
                    >
                      Remove from Library
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tags -->
            <div v-if="librarySong.tags && librarySong.tags.length > 0" class="flex flex-wrap gap-2 mb-4">
              <span
                v-for="tag in librarySong.tags"
                :key="tag.id"
                class="px-3 py-1 bg-blue-900/30 text-blue-300 text-xs rounded-full border border-blue-800"
              >
                {{ tag.name }}
              </span>
            </div>

            <!-- Notes Section -->
            <NotesSection :library-song-id="librarySong.id" />
          </div>
        </div>
      </div>

      <!-- Selection Mode Bottom Bar -->
      <div v-if="uiStore.selectionMode" class="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4 z-10">
        <div class="max-w-2xl mx-auto">
          <div class="flex items-center justify-between mb-3">
            <span class="text-white">{{ uiStore.selectedIds.length }} selected</span>
            <button
              @click="uiStore.exitSelectionMode()"
              class="text-sm text-gray-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
          
          <div v-if="uiStore.selectedIds.length > 0" class="flex gap-2">
            <button
              @click="handleBulkAssignTags"
              class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
            >
              Add Tags
            </button>
            <button
              @click="handleBulkRemoveTags"
              class="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg"
            >
              Remove Tags
            </button>
            <button
              @click="handleBulkAddToLists"
              class="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg"
            >
              Add to Lists
            </button>
          </div>
        </div>
      </div>

      <!-- Modals -->
      <SongSearchModal
        v-if="showAddSongModal"
        @close="showAddSongModal = false"
        @added="handleSongAdded"
      />

      <ManageListsModal
        v-if="showManageListsModal && selectedLibrarySong"
        :isOpen="true"
        :library-song-id="selectedLibrarySong.id"
        :song-title="selectedLibrarySong.custom_title || selectedLibrarySong.song?.title || 'Song'"
        :initial-list-ids="selectedLibrarySong.list_ids || []"
        @close="showManageListsModal = false"
        @saved="handleListsUpdated"
      />

      <FilterByTagsModal
        v-if="showFilterByTagsModal"
        :isOpen="true"
        :selectedTagIds="selectedTagIds"
        @close="showFilterByTagsModal = false"
        @apply="handleFilterByTags"
      />

      <BulkAssignTagsModal
        v-if="showBulkAssignTagsModal"
        :isOpen="true"
        @close="showBulkAssignTagsModal = false"
        @apply="handleBulkAssignTagsApply"
      />

      <BulkRemoveTagsModal
        v-if="showBulkRemoveTagsModal"
        :isOpen="true"
        @close="showBulkRemoveTagsModal = false"
        @apply="handleBulkRemoveTagsApply"
      />

      <BulkAddToListsModal
        v-if="showBulkAddToListsModal"
        :isOpen="true"
        @close="showBulkAddToListsModal = false"
        @apply="handleBulkAddToListsApply"
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'
import { IonPage, IonContent } from '@ionic/vue'
import { useLibraryStore } from '@/stores/library'
import { useTagsStore } from '@/stores/tags'
import { useListsStore } from '@/stores/lists'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import type { LibrarySongWithDetails } from '@/types/database'
import { MESSAGES } from '@/constants/messages'
import AppHeader from '@/components/AppHeader.vue'
import ListFilterBar from '@/components/ListFilterBar.vue'
import NotesSection from '@/components/NotesSection.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

// Async components
const SongSearchModal = defineAsyncComponent(() => import('@/components/SongSearchModal.vue'))
const ManageListsModal = defineAsyncComponent(() => import('@/components/ManageListsModal.vue'))
const FilterByTagsModal = defineAsyncComponent(() => import('@/components/FilterByTagsModal.vue'))
const BulkAssignTagsModal = defineAsyncComponent(() => import('@/components/BulkAssignTagsModal.vue'))
const BulkRemoveTagsModal = defineAsyncComponent(() => import('@/components/BulkRemoveTagsModal.vue'))
const BulkAddToListsModal = defineAsyncComponent(() => import('@/components/BulkAddToListsModal.vue'))

const libraryStore = useLibraryStore()
const tagsStore = useTagsStore()
const listsStore = useListsStore()
const authStore = useAuthStore()
const uiStore = useUiStore()

// State
const showAddSongModal = ref(false)
const showManageListsModal = ref(false)
const showFilterByTagsModal = ref(false)
const showBulkAssignTagsModal = ref(false)
const showBulkRemoveTagsModal = ref(false)
const showBulkAddToListsModal = ref(false)
const selectedLibrarySong = ref<LibrarySongWithDetails | null>(null)
const activeSongMenu = ref<string | null>(null)

// Computed
const searchQuery = computed({
  get: () => libraryStore.searchQuery,
  set: (value) => { libraryStore.searchQuery = value }
})

const selectedTagIds = computed({
  get: () => libraryStore.selectedTagIds,
  set: (value) => { libraryStore.selectedTagIds = value }
})

const displayedSongs = computed(() => {
  return libraryStore.filteredLibrarySongs
})

// Lifecycle
onMounted(async () => {
  await Promise.all([
    libraryStore.loadLibrary(),
    tagsStore.fetchTags(),
    listsStore.fetchLists(authStore.currentProject!)
  ])
})

// Click outside directive
const vClickOutside = {
  mounted(el: HTMLElement, binding: any) {
    el.clickOutsideEvent = (event: Event) => {
      if (!(el === event.target || el.contains(event.target as Node))) {
        binding.value()
      }
    }
    document.addEventListener('click', el.clickOutsideEvent)
  },
  unmounted(el: HTMLElement & { clickOutsideEvent?: any }) {
    if (el.clickOutsideEvent) {
      document.removeEventListener('click', el.clickOutsideEvent)
    }
  }
}

// Methods
function handleClearFilters() {
  libraryStore.searchQuery = ''
  libraryStore.selectedTagIds = []
}

function handleFilterByTags(tagIds: string[]) {
  libraryStore.selectedTagIds = tagIds
}

function toggleSongMenu(songId: string) {
  activeSongMenu.value = activeSongMenu.value === songId ? null : songId
}

function closeSongMenu() {
  activeSongMenu.value = null
}

function handleManageLists(librarySong: LibrarySongWithDetails) {
  selectedLibrarySong.value = librarySong
  showManageListsModal.value = true
  closeSongMenu()
}

async function handleRemoveFromLibrary(librarySong: LibrarySongWithDetails) {
  const confirmed = await uiStore.showConfirm(
    'Remove from Library',
    MESSAGES.CONFIRM_REMOVE_FROM_LIBRARY(librarySong.custom_title || librarySong.song?.title || 'this song'),
    'Remove',
    'Cancel'
  )
  
  if (!confirmed) {
    closeSongMenu()
    return
  }
  
  try {
    await libraryStore.removeFromLibrary(librarySong.id)
    uiStore.showToast(MESSAGES.SUCCESS.SONG_REMOVED_FROM_LIBRARY, 'success')
  } catch (err) {
    uiStore.showErrorToast('remove song from library', err as Error)
  }
  
  closeSongMenu()
}

function handleSongAdded() {
  // Library store already reloaded by SongSearchModal
  showAddSongModal.value = false
}

function handleListsUpdated() {
  showManageListsModal.value = false
  selectedLibrarySong.value = null
  libraryStore.loadLibrary() // Reload to show updated list associations
}

// Bulk operations
function handleBulkAssignTags() {
  showBulkAssignTagsModal.value = true
}

function handleBulkRemoveTags() {
  showBulkRemoveTagsModal.value = true
}

function handleBulkAddToLists() {
  showBulkAddToListsModal.value = true
}

async function handleBulkAssignTagsApply(tagIds: string[]) {
  const songCount = uiStore.selectedIds.length
  
  try {
    await tagsStore.bulkAssignTags(uiStore.selectedIds, tagIds)
    uiStore.showToast(MESSAGES.SUCCESS_TAGS_ASSIGNED(songCount), 'success')
    await libraryStore.loadLibrary()
    uiStore.exitSelectionMode()
  } catch (err) {
    uiStore.showErrorToast('assign tags', err as Error)
  }
}

async function handleBulkRemoveTagsApply(tagIds: string[]) {
  const songCount = uiStore.selectedIds.length
  
  try {
    await tagsStore.bulkRemoveTags(uiStore.selectedIds, tagIds)
    uiStore.showToast(MESSAGES.SUCCESS_TAGS_REMOVED(songCount), 'success')
    await libraryStore.loadLibrary()
    uiStore.exitSelectionMode()
  } catch (err) {
    uiStore.showErrorToast('remove tags', err as Error)
  }
}

async function handleBulkAddToListsApply(listIds: string[]) {
  const songCount = uiStore.selectedIds.length
  
  try {
    for (const librarySongId of uiStore.selectedIds) {
      for (const listId of listIds) {
        await listsStore.addLibrarySongToList(listId, librarySongId)
      }
    }
    uiStore.showToast(MESSAGES.SUCCESS_SONGS_ADDED_TO_LIST(songCount, 'lists'), 'success')
    await libraryStore.loadLibrary()
    uiStore.exitSelectionMode()
  } catch (err) {
    uiStore.showErrorToast('add to lists', err as Error)
  }
}
</script>
