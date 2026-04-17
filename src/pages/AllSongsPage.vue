<template>
  <ion-page>
    <ion-content class="bg-gray-900">
      <!-- Header -->
      <AppHeader :title="I18N.PAGE_TITLES.ALL_SONGS">
        <template #action>
          <div v-if="!uiStore.selectionMode" class="relative">
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
              class="fixed inset-0 z-40"
            />
            <div
              v-if="isPageMenuOpen"
              class="absolute right-0 top-12 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden"
            >
              <router-link
                :to="ROUTES.SONG_NEW"
                @click="handleNavigateToNewSong"
                class="flex items-center gap-3 px-4 py-3 text-white hover:bg-gray-700 transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                {{ I18N.DROPDOWN.CREATE_NEW_SONG }}
              </router-link>
              <button
                v-if="songsStore.songCount > 0"
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
      <div v-if="!songsStore.isLoading && songsStore.songCount === 0" class="text-center py-12 px-4">
        <svg class="w-24 h-24 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
        </svg>
        <h2 class="text-xl font-semibold text-white mb-2">{{ MESSAGES.EMPTY_NO_SONGS }}</h2>
        <p class="text-gray-400 mb-6">{{ MESSAGES.EMPTY_NO_SONGS_SUBTITLE }}</p>
        
        <router-link
          :to="ROUTES.SONG_NEW"
          @click="uiStore.showOperationOverlay('Loading...')"
          class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          {{ I18N.EMPTY_STATES.NO_SONGS.CTA }}
        </router-link>
      </div>

      <!-- Song List -->
      <div v-else class="pb-24">
        <div v-if="displayedSongs.length === 0 && (searchQuery || selectedTagIds.length > 0)" class="text-center py-12 px-4">
          <svg class="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <p class="text-gray-400">{{ I18N.EMPTY_STATES.NO_RESULTS }}</p>
        </div>
        <div v-else class="p-4 space-y-3">
          <SongCard
            v-for="song in displayedSongs"
            :key="song.id"
            :song="song"
          />
        </div>
      </div>

      <!-- Sticky Bottom Bar -->
      <div class="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4 z-10">
        <div class="max-w-2xl mx-auto">
          <!-- Selection Mode Controls -->
          <div v-if="uiStore.selectionMode" class="space-y-3">
            <!-- Action Buttons -->
            <div v-if="uiStore.selectedIds.length > 0" class="flex flex-wrap gap-2">
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
                class="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors"
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
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { IonPage, IonContent } from '@ionic/vue'
import { useSongsStore } from '@/stores/songs'
import { useAuthStore } from '@/stores/auth'
import { useTagsStore } from '@/stores/tags'
import { useListsStore } from '@/stores/lists'
import { useUiStore } from '@/stores/ui'
import { supabase } from '@/utils/supabase'
import AppHeader from '@/components/AppHeader.vue'
import SongCard from '@/components/SongCard.vue'
import FilterByTagsModal from '@/components/FilterByTagsModal.vue'
import BulkAddToListsModal from '@/components/BulkAddToListsModal.vue'
import BulkAssignTagsModal from '@/components/BulkAssignTagsModal.vue'
import BulkRemoveTagsModal from '@/components/BulkRemoveTagsModal.vue'
import { ROUTES } from '@/constants/routes'
import { MESSAGES } from '@/constants/messages'
import { I18N } from '@/constants/i18n'
import { executeOperation, executeConfirmedOperation } from '@/utils/operations'
import { TIMEOUTS } from '@/utils/timeout'

const songsStore = useSongsStore()
const authStore = useAuthStore()
const tagsStore = useTagsStore()
const listsStore = useListsStore()
const uiStore = useUiStore()

const searchQuery = ref('')
const selectedTagIds = ref<string[]>([])
const showFilterModal = ref(false)
const isPageMenuOpen = ref(false)
const showBulkAddToListsModal = ref(false)
const showBulkAssignTagsModal = ref(false)
const showBulkRemoveTagsModal = ref(false)

const displayedSongs = computed(() => {
  let filtered = songsStore.songs
  
  // Apply tag filter (AND logic - song must have ALL selected tags)
  if (selectedTagIds.value.length > 0) {
    filtered = filtered.filter(song => {
      const songTagIds = song.tags?.map(t => t.id) || []
      return selectedTagIds.value.every(tagId => songTagIds.includes(tagId))
    })
  }
  
  // Apply search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(song => 
      song.title.toLowerCase().includes(query) ||
      song.artist?.toLowerCase().includes(query) ||
      song.livenotes_poc_id?.toLowerCase().includes(query) ||
      song.notes?.toLowerCase().includes(query)
    )
  }
  
  return filtered
})

function openFilterModal() {
  showFilterModal.value = true
}

function handleApplyFilter(tagIds: string[]) {
  selectedTagIds.value = tagIds
}

function handleEnterSelectionMode() {
  isPageMenuOpen.value = false
  uiStore.enterSelectionMode()
}

function handleNavigateToNewSong() {
  isPageMenuOpen.value = false
  uiStore.showOperationOverlay('Loading...')
}

function handleSelectAll() {
  const allSongIds = displayedSongs.value.map(song => song.id)
  uiStore.selectAll(allSongIds)
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
      await executeConfirmedOperation(
        () => songsStore.bulkDelete(uiStore.selectedIds, projectId),
        {
          loadingMessage: `Deleting ${count} song${count > 1 ? 's' : ''}...`,
          successMessage: I18N.TOAST.BULK_DELETED_SONGS(count),
          errorContext: 'delete songs',
          onSuccess: () => {
            uiStore.exitSelectionMode()
          },
        }
      )
    }
  }
}

async function handleBulkAddToLists() {
  showBulkAddToListsModal.value = true
}

async function handleBulkAddToListsApply(listIds: string[]) {
  const songCount = uiStore.selectedIds.length
  
  await executeOperation(
    async () => {
      // Add each selected song to each selected list
      for (const listId of listIds) {
        for (const songId of uiStore.selectedIds) {
          await listsStore.addSongToList(listId, songId)
        }
      }
      return { success: true }
    },
    {
      timeout: TIMEOUTS.BULK,
      loadingMessage: `Adding ${songCount} song${songCount > 1 ? 's' : ''} to lists...`,
      successMessage: I18N.TOAST.BULK_ADDED_TO_LISTS(songCount),
      errorContext: 'add songs to lists',
      onSuccess: () => {
        uiStore.exitSelectionMode()
      },
    }
  )
}

async function handleBulkAssignTags() {
  showBulkAssignTagsModal.value = true
}

async function handleBulkAssignTagsApply(tagIds: string[]) {
  const songCount = uiStore.selectedIds.length
  
  await executeOperation(
    async () => {
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
      
      // Refresh songs to show updated tags
      const projectId = await authStore.getPersonalProjectId()
      if (projectId) {
        await songsStore.fetchSongs(projectId)
      }
      
      return { success: true }
    },
    {
      timeout: TIMEOUTS.BULK,
      loadingMessage: `Assigning tags to ${songCount} song${songCount > 1 ? 's' : ''}...`,
      successMessage: I18N.TOAST.BULK_TAGS_ASSIGNED(songCount),
      errorContext: 'assign tags',
      onSuccess: () => {
        uiStore.exitSelectionMode()
      },
    }
  )
}

async function handleBulkRemoveTags() {
  showBulkRemoveTagsModal.value = true
}

async function handleBulkRemoveTagsApply(tagIds: string[]) {
  const songCount = uiStore.selectedIds.length
  
  await executeOperation(
    async () => {
      // Remove tag associations for selected songs and tags
      const { error } = await supabase
        .from('song_tags')
        .delete()
        .in('song_id', uiStore.selectedIds)
        .in('tag_id', tagIds)
      
      if (error) throw error
      
      // Refresh songs to show updated tags
      const projectId = await authStore.getPersonalProjectId()
      if (projectId) {
        await songsStore.fetchSongs(projectId)
      }
      
      return { success: true }
    },
    {
      timeout: TIMEOUTS.BULK,
      loadingMessage: `Removing tags from ${songCount} song${songCount > 1 ? 's' : ''}...`,
      successMessage: I18N.TOAST.BULK_TAGS_REMOVED(songCount),
      errorContext: 'remove tags',
      onSuccess: () => {
        uiStore.exitSelectionMode()
      },
    }
  )
}

onMounted(async () => {
  try {
    // Ensure auth is initialized first
    if (!authStore.isInitialized) {
      await authStore.initialize()
    }
    
    // Fetch user's personal project and songs
    const personalProjectId = await authStore.getPersonalProjectId()
    
    if (personalProjectId) {
      await songsStore.fetchSongs(personalProjectId)
      await tagsStore.fetchTags(personalProjectId)
      await listsStore.fetchLists(personalProjectId)
    }
  } catch (error) {
    console.error('Error loading songs page:', error)
    uiStore.showToast('Failed to load songs', 'error')
  } finally {
    // Always hide overlay
    uiStore.hideOperationOverlay()
  }
})
</script>
