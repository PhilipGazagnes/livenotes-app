<template>
  <ion-page>
    <ion-content class="bg-gray-900">
      <!-- Header -->
      <AppHeader :title="pageTitle">
        <template #action>
          <div v-if="!uiStore.selectionMode" class="relative">
            <button
              @click.stop="showHeaderMenu = !showHeaderMenu"
              class="p-2 text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
              </svg>
            </button>
            
            <!-- Backdrop -->
            <div
              v-if="showHeaderMenu"
              class="fixed inset-0 z-40"
              @click="showHeaderMenu = false"
            ></div>
            
            <!-- Dropdown Menu -->
            <div
              v-if="showHeaderMenu"
              class="absolute right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-2 z-50"
            >
              <button
                @click="handleCreateNewSong"
                class="w-full px-4 py-3 text-left text-white hover:bg-gray-700 flex items-center gap-3"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                Create New Song
              </button>
              <button
                @click="handleSelectSongs"
                class="w-full px-4 py-3 text-left text-white hover:bg-gray-700 flex items-center gap-3"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
                Select Songs
              </button>
            </div>
          </div>
        </template>
      </AppHeader>

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
          <LibrarySongCard
            v-for="librarySong in displayedSongs"
            :key="librarySong.id"
            :librarySong="librarySong"
            @manageTags="handleManageTags"
            @manageLists="handleManageLists"
            @removeFromLibrary="handleRemoveFromLibrary"
          />
        </div>
      </div>

      <!-- Sticky Bottom Bar -->
      <div class="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4 z-10">
        <div class="max-w-2xl mx-auto">
          <!-- Selection Mode Controls -->
          <div v-if="uiStore.selectionMode">
            <div v-if="uiStore.selectedIds.length > 0" class="space-y-3">
              <!-- Action Buttons -->
              <div class="grid grid-cols-4 gap-2">
                <button
                  @click="handleBulkDeleteSongs"
                  class="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg"
                >
                  Delete Songs
                </button>
                <button
                  @click="handleBulkAddToLists"
                  class="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg"
                >
                  Add to Lists
                </button>
                <button
                  @click="handleBulkAssignTags"
                  class="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
                >
                  Assign Tags
                </button>
                <button
                  @click="handleBulkRemoveTags"
                  class="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg"
                >
                  Remove Tags
                </button>
              </div>
              
              <!-- Selection Controls -->
              <div class="flex items-center justify-between">
                <span class="text-white text-sm">{{ uiStore.selectedIds.length }} selected</span>
                <div class="flex gap-2">
                  <button
                    @click="handleSelectAll"
                    class="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg"
                  >
                    Select All
                  </button>
                  <button
                    @click="handleDeselectAll"
                    class="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg"
                  >
                    Deselect All
                  </button>
                  <button
                    @click="uiStore.exitSelectionMode()"
                    class="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
            <div v-else class="flex items-center justify-between">
              <span class="text-gray-400 text-sm">Select songs to perform bulk actions</span>
              <button
                @click="uiStore.exitSelectionMode()"
                class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg"
              >
                Cancel
              </button>
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
                placeholder="Search songs..."
                class="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              @click="showFilterByTagsModal = true"
              class="px-4 py-3 bg-gray-900 border rounded-lg transition-colors"
              :class="selectedTagIds.length > 0 ? 'border-blue-500 text-blue-400' : 'border-gray-700 text-gray-400 hover:text-white'"
              aria-label="Filter by tags"
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

      <!-- Modals -->
      <SongSearchModal
        v-if="showAddSongModal"
        :isOpen="showAddSongModal"
        @close="showAddSongModal = false"
        @songAdded="handleSongAdded"
      />

      <ManageTagsModal
        v-if="showManageTagsModal && selectedLibrarySong"
        :isOpen="true"
        :librarySongId="selectedLibrarySong.id"
        :songTitle="selectedLibrarySong.custom_title || selectedLibrarySong.song?.title || 'Song'"
        :initialTagIds="selectedLibrarySong.tags?.map(t => t.id) || []"
        @close="showManageTagsModal = false"
        @saved="handleTagsUpdated"
      />

      <ManageListsModal
        v-if="showManageListsModal && selectedLibrarySong"
        :isOpen="true"
        :library-song-id="selectedLibrarySong.id"
        :song-title="selectedLibrarySong.custom_title || selectedLibrarySong.song?.title || 'Song'"
        :initial-list-ids="selectedLibrarySong.lists?.map(l => l.id) || []"
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
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'
import { IonPage, IonContent } from '@ionic/vue'
import { useLibraryStore } from '@/stores/library'
import { useTagsStore } from '@/stores/tags'
import { useListsStore } from '@/stores/lists'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { supabase } from '@/utils/supabase'
import type { LibrarySongWithDetails, Note } from '@/types/database'
import { MESSAGES } from '@/constants/messages'
import AppHeader from '@/components/AppHeader.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import LibrarySongCard from '@/components/LibrarySongCard.vue'
import SongNotesDrawer from '@/components/SongNotesDrawer.vue'
import NoteContentDrawer from '@/components/NoteContentDrawer.vue'
import NoteCreationDrawer from '@/components/NoteCreationDrawer.vue'

const route = useRoute()

// Async components
const SongSearchModal = defineAsyncComponent(() => import('@/components/SongSearchModal.vue'))
const ManageTagsModal = defineAsyncComponent(() => import('@/components/ManageTagsModal.vue'))
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
const showHeaderMenu = ref(false)
const showAddSongModal = ref(false)
const showManageTagsModal = ref(false)
const showManageListsModal = ref(false)
const showFilterByTagsModal = ref(false)
const showBulkAssignTagsModal = ref(false)
const showBulkRemoveTagsModal = ref(false)
const showBulkAddToListsModal = ref(false)
const selectedLibrarySong = ref<LibrarySongWithDetails | null>(null)

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
  let songs = libraryStore.filteredLibrarySongs
  
  // Apply artist filter if in query params
  if (route.query.artist) {
    const artistId = route.query.artist as string
    songs = songs.filter(song => 
      song.song?.artists?.some(a => a.id === artistId)
    )
  }
  
  return songs
})

// Compute dynamic page title
const pageTitle = computed(() => {
  if (route.query.tagName) {
    return `Songs with tag "${route.query.tagName}"`
  }
  if (route.query.artistName) {
    return `Songs by ${route.query.artistName}`
  }
  return 'My Library'
})

// Lifecycle
onMounted(async () => {
  const projectId = authStore.personalProjectId
  if (!projectId) return
  
  await Promise.all([
    libraryStore.loadLibrary(),
    tagsStore.fetchTags(projectId),
    listsStore.fetchLists(projectId)
  ])
  
  // Apply initial filter from query params
  applyQueryFilters()
})

// Watch for query parameter changes
watch(() => route.query, () => {
  applyQueryFilters()
})

function applyQueryFilters() {
  // Apply tag filter if in query params
  if (route.query.tag) {
    libraryStore.selectedTagIds = [route.query.tag as string]
  } else if (!route.query.artist) {
    // Only clear if not filtering by artist
    libraryStore.selectedTagIds = []
  }
}

// Methods
function handleCreateNewSong() {
  showHeaderMenu.value = false
  showAddSongModal.value = true
}

function handleSelectSongs() {
  showHeaderMenu.value = false
  uiStore.enterSelectionMode()
}

function handleSelectAll() {
  const allIds = displayedSongs.value.map(song => song.id)
  allIds.forEach(id => {
    if (!uiStore.selectedIds.includes(id)) {
      uiStore.toggleSelection(id)
    }
  })
}

function handleDeselectAll() {
  uiStore.selectedIds = []
}

function handleFilterByTags(tagIds: string[]) {
  libraryStore.selectedTagIds = tagIds
}

function handleManageTags(librarySong: LibrarySongWithDetails) {
  selectedLibrarySong.value = librarySong
  showManageTagsModal.value = true
}

function handleManageLists(librarySong: LibrarySongWithDetails) {
  selectedLibrarySong.value = librarySong
  showManageListsModal.value = true
}

async function handleRemoveFromLibrary(librarySong: LibrarySongWithDetails) {
  const confirmed = await uiStore.showConfirm(
    'Remove from Library',
    MESSAGES.CONFIRM_REMOVE_FROM_LIBRARY(librarySong.custom_title || librarySong.song?.title || 'this song'),
    'Remove',
    'Cancel'
  )
  
  if (!confirmed) return
  
  try {
    await libraryStore.removeFromLibrary(librarySong.id)
    uiStore.showToast(MESSAGES.SUCCESS.SONG_REMOVED_FROM_LIBRARY, 'success')
  } catch (err) {
    uiStore.showErrorToast('remove song from library', err as Error)
  }
}

function handleSongAdded() {
  // Library store already reloaded by SongSearchModal
  showAddSongModal.value = false
}

function handleTagsUpdated() {
  showManageTagsModal.value = false
  selectedLibrarySong.value = null
  libraryStore.loadLibrary() // Reload to show updated tags
}

function handleListsUpdated() {
  showManageListsModal.value = false
  selectedLibrarySong.value = null
  libraryStore.loadLibrary() // Reload to show updated list associations
}

// Bulk operations
function handleBulkDeleteSongs() {
  uiStore.showConfirm(
    'Delete Songs',
    `Are you sure you want to remove ${uiStore.selectedIds.length} song(s) from your library?`,
    'Delete',
    'Cancel'
  ).then(async (confirmed) => {
    if (!confirmed) return
    
    try {
      for (const librarySongId of uiStore.selectedIds) {
        await libraryStore.removeFromLibrary(librarySongId)
      }
      uiStore.showToast(`${uiStore.selectedIds.length} song(s) removed from library`, 'success')
      uiStore.exitSelectionMode()
      await libraryStore.loadLibrary()
    } catch (err) {
      uiStore.showErrorToast('delete songs', err as Error)
    }
  })
}

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

// Notes drawer handlers
function handleNoteClick(note: Note) {
  console.log('📋 LibraryPage: Note clicked:', note)
  uiStore.openNoteContentDrawer(note)
}

function handleAddNote() {
  uiStore.openNoteCreationDrawer()
}

async function handleNoteSaved() {
  // Refresh the library song data to show the new note in the drawer
  if (uiStore.selectedLibrarySong) {
    try {
      const { data, error: fetchError } = await supabase
        .from('library_songs')
        .select(`
          *,
          song:songs_v2!library_songs_song_id_fkey(
            *,
            artists:song_artists_v2(
              position,
              artist:artists_v2(*)
            )
          ),
          tags:library_song_tags(
            tag:tags(*)
          ),
          notes:notes(
            id,
            type,
            title,
            content,
            display_order,
            created_at,
            updated_at
          ),
          lists:list_items(
            list:lists(*)
          )
        `)
        .eq('id', uiStore.selectedLibrarySong.id)
        .single()
      
      if (fetchError) throw fetchError
      if (!data) return
      
      // Update the selectedLibrarySong with fresh data
      const refreshedSong: LibrarySongWithDetails = {
        ...data,
        song: {
          ...data.song,
          artists: data.song.artists
            ?.map((sa: any) => ({
              ...sa.artist,
              position: sa.position,
            }))
            .filter(Boolean)
            .sort((a: any, b: any) => a.position - b.position) ?? [],
        },
        tags: data.tags?.map((lst: any) => lst.tag).filter(Boolean) ?? [],
        notes: data.notes ?? [],
        lists: data.lists?.map((li: any) => li.list).filter(Boolean) ?? [],
      }
      
      uiStore.selectedLibrarySong = refreshedSong
    } catch (err) {
      console.error('Failed to refresh library song:', err)
    }
  }
}

function handleEditNote(note: Note) {
  // TODO: Show edit note modal
  uiStore.showToast('Edit note functionality coming soon', 'success')
  console.log('Edit note:', note)
}

async function handleDeleteNote(note: Note) {
  const confirmed = await uiStore.showConfirm(
    'Delete Note',
    `Are you sure you want to delete this ${note.title || 'note'}?`,
    'Delete',
    'Cancel'
  )
  
  if (!confirmed) return
  
  // TODO: Implement delete note functionality
  uiStore.closeNoteContentDrawer()
  uiStore.showToast('Delete note functionality coming soon', 'success')
  console.log('Delete note:', note)
}
</script>
