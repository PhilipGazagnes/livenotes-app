<template>
  <ion-page>
    <ion-content ref="contentRef">
      <!-- Header -->
      <AppHeader :title="pageTitle">
      </AppHeader>

      <!-- Loading State -->
      <div v-if="libraryStore.isLoading && !loadTimedOut" class="flex items-center justify-center py-24">
        <LoadingSpinner />
      </div>

      <!-- Empty State -->
      <div v-else-if="libraryStore.librarySongCount === 0" class="text-center py-12 px-4">
        <svg class="w-24 h-24 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
        </svg>
        <h2 class="text-xl font-semibold text-white mb-2">{{ I18N.EMPTY_STATES.LIBRARY_EMPTY }}</h2>
        <p class="text-gray-400 mb-6">{{ I18N.EMPTY_STATES.LIBRARY_EMPTY_SUBTITLE }}</p>
        
        <button
          @click="showAddSongModal = true"
          class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          {{ I18N.LIBRARY.ADD_FIRST_SONG }}
        </button>
      </div>

      <!-- Library Songs List -->
      <div v-else class="pb-24">
        <div v-if="displayedSongs.length === 0 && (searchQuery || selectedTagIds.length > 0 || route.query.artist)" class="text-center py-12 px-4">
          <svg class="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <p class="text-gray-400">{{ I18N.EMPTY_STATES.NO_SONGS_MATCH_FILTERS }}</p>
        </div>
        <div v-else class="p-4 space-y-4">
          <Card
            v-for="librarySong in displayedSongs"
            :key="librarySong.id"
            :title="librarySong.custom_title || librarySong.song?.title || ''"
            :title-segments="getCardTitleSegments(librarySong)"
            :text="getCardText(librarySong)"
            :text-segments="getCardTextSegments(librarySong)"
            :tags="librarySong.tags"
            :lists="librarySong.lists"
            :dropdown-items="getSongDropdownItems(librarySong)"
            :id="librarySong.id"
            @click="handleSongClick(librarySong)"
          />
        </div>
      </div>

      <StickyBar
        v-model:search-query="searchQuery"
        :all-item-ids="displayedSongs.map(s => s.id)"
        :filters-enabled="true"
        :filters-active="selectedTagIds.length > 0"
        @filters-clicked="handleFiltersClicked"
        @new-clicked="showAddSongModal = true"
        @choose-action-clicked="handleChooseAction"
      />

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


    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick, defineAsyncComponent } from 'vue'
import BulkAssignTagsDrawer from '@/components/BulkAssignTagsDrawer.vue'
import BulkRemoveTagsDrawer from '@/components/BulkRemoveTagsDrawer.vue'
import BulkAddToListsDrawer from '@/components/BulkAddToListsDrawer.vue'
import { useRoute } from 'vue-router'
import { IonPage, IonContent } from '@ionic/vue'
import { useLibraryStore } from '@/stores/library'
import { useTagsStore } from '@/stores/tags'
import { useListsStore } from '@/stores/lists'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useDrawerStore } from '@/stores/drawer'
import { useSettingsStore } from '@/stores/settings'
import type { LibrarySongWithDetails } from '@/types/database'
import type { FuseResultMatch } from 'fuse.js'
import { I18N } from '@/constants/i18n'
import { getSegments } from '@/utils/highlight'
import type { TextSegment } from '@/utils/highlight'
import AppHeader from '@/components/AppHeader.vue'
import Card from '@/components/Card.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import SongNotesDrawer from '@/components/SongNotesDrawer.vue'
import LiveLyricsDrawer from '@/components/LiveLyricsDrawer.vue'
import StickyBar from '@/components/StickyBar.vue'
import BulkActionsDrawer from '@/components/BulkActionsDrawer.vue'
import type { BulkAction } from '@/components/BulkActionsDrawer.vue'
import ConfirmDrawer from '@/components/ConfirmDrawer.vue'

const route = useRoute()

// Async components
const SongSearchModal = defineAsyncComponent(() => import('@/components/SongSearchModal.vue'))
const ManageTagsModal = defineAsyncComponent(() => import('@/components/ManageTagsModal.vue'))
const ManageListsModal = defineAsyncComponent(() => import('@/components/ManageListsModal.vue'))
import FilterByTagsDrawer from '@/components/FilterByTagsDrawer.vue'

const libraryStore = useLibraryStore()
const tagsStore = useTagsStore()
const listsStore = useListsStore()
const authStore = useAuthStore()
const uiStore = useUiStore()
const drawerStore = useDrawerStore()
const settingsStore = useSettingsStore()

const contentRef = ref<InstanceType<typeof IonContent> | null>(null)
let savedScrollTop = 0

async function captureScroll() {
  const scrollEl = await (contentRef.value as any)?.$el?.getScrollElement()
  savedScrollTop = scrollEl?.scrollTop ?? 0
}

async function restoreScroll() {
  await nextTick()
  const scrollEl = await (contentRef.value as any)?.$el?.getScrollElement()
  scrollEl?.scrollTo({ top: savedScrollTop, behavior: 'instant' })
}

// State
const showAddSongModal = ref(false)
const showManageTagsModal = ref(false)
const showManageListsModal = ref(false)
const selectedLibrarySong = ref<LibrarySongWithDetails | null>(null)
const loadTimedOut = ref(false)
let loadTimeoutId: ReturnType<typeof setTimeout> | null = null

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
    return I18N.PAGE_TITLES.SONGS_WITH_TAG(route.query.tagName as string)
  }
  if (route.query.artistName) {
    return I18N.PAGE_TITLES.SONGS_BY_ARTIST(route.query.artistName as string)
  }
  return I18N.PAGE_TITLES.MY_LIBRARY
})

// Lifecycle
onMounted(async () => {
  loadTimedOut.value = false
  loadTimeoutId = setTimeout(() => { loadTimedOut.value = true }, 12000)

  try {
    const projectId = authStore.activeProjectId
    if (!projectId) return

    await Promise.all([
      libraryStore.loadLibrary(),
      tagsStore.fetchTags(projectId),
      listsStore.fetchLists(projectId)
    ])

    applyQueryFilters()
  } finally {
    if (loadTimeoutId) {
      clearTimeout(loadTimeoutId)
      loadTimeoutId = null
    }
  }
})

onUnmounted(() => {
  if (loadTimeoutId) clearTimeout(loadTimeoutId)
})

watch(() => authStore.activeProjectId, async (newId) => {
  if (!newId) return
  await Promise.all([
    libraryStore.loadLibrary(),
    tagsStore.fetchTags(newId),
    listsStore.fetchLists(newId),
  ])
  applyQueryFilters()
})

// Watch for query parameter changes
watch(() => route.query, (newQuery, oldQuery) => {
  if (newQuery.tag) {
    libraryStore.selectedTagIds = [newQuery.tag as string]
    libraryStore.searchQuery = ''
  } else if (newQuery.artist) {
    libraryStore.selectedTagIds = []
    libraryStore.searchQuery = ''
  } else if (oldQuery?.tag || oldQuery?.artist) {
    libraryStore.selectedTagIds = []
  }
})

function applyQueryFilters() {
  if (route.query.tag) {
    libraryStore.selectedTagIds = [route.query.tag as string]
    libraryStore.searchQuery = ''
  } else if (route.query.artist) {
    libraryStore.selectedTagIds = []
    libraryStore.searchQuery = ''
  } else {
    libraryStore.selectedTagIds = []
  }
}


function getCardTitleSegments(librarySong: LibrarySongWithDetails): TextSegment[] | undefined {
  const displayTitle = librarySong.custom_title || librarySong.song?.title || ''
  const titleKey = librarySong.custom_title ? 'custom_title' : 'song.title'
  const matches = libraryStore.matchMap.get(librarySong.id)
  const match = matches?.find((m: FuseResultMatch) => m.key === titleKey)
  return match ? getSegments(displayTitle, match.indices as ReadonlyArray<[number, number]>) : undefined
}

function getCardText(librarySong: LibrarySongWithDetails): string | undefined {
  const artists = librarySong.song?.artists
  if (!artists?.length) return undefined
  return artists.map(a => a.name).join(', ')
}

function getCardTextSegments(librarySong: LibrarySongWithDetails): TextSegment[] | undefined {
  const artists = librarySong.song?.artists
  if (!artists?.length) return undefined
  const matches = libraryStore.matchMap.get(librarySong.id)
  if (!matches) return undefined
  const segments: TextSegment[] = []
  for (let i = 0; i < artists.length; i++) {
    const artist = artists[i]
    const match = matches.find((m: FuseResultMatch) => m.key === 'song.artists.name' && m.value === artist.name)
    if (match) {
      segments.push(...getSegments(artist.name, match.indices as ReadonlyArray<[number, number]>))
    } else {
      segments.push({ text: artist.name, highlighted: false })
    }
    if (i < artists.length - 1) segments.push({ text: ', ', highlighted: false })
  }
  return segments
}

function getSongDropdownItems(librarySong: LibrarySongWithDetails) {
  return [
    { label: I18N.DROPDOWN.MANAGE_TAGS, callback: () => handleManageTags(librarySong) },
    { label: I18N.DROPDOWN.MANAGE_LISTS, callback: () => handleManageLists(librarySong) },
    { label: I18N.DROPDOWN.REMOVE_FROM_LIBRARY, variant: 'danger' as const, callback: () => handleRemoveFromLibrary(librarySong) },
  ]
}

function handleSongClick(librarySong: LibrarySongWithDetails) {
  const drawer = settingsStore.songClickShowsLyrics ? LiveLyricsDrawer : SongNotesDrawer
  drawerStore.push(drawer, { librarySongId: librarySong.id })
}


async function handleChooseAction() {
  await captureScroll()
  const actions: BulkAction[] = [
    { label: I18N.BULK_ACTIONS.DELETE, variant: 'danger', keepDrawerOpen: true, onClick: handleBulkDeleteSongs },
    { label: I18N.BULK_ACTIONS.ADD_TO_LISTS, keepDrawerOpen: true, onClick: handleBulkAddToLists },
    { label: I18N.BULK_ACTIONS.ASSIGN_TAGS, keepDrawerOpen: true, onClick: handleBulkAssignTags },
    { label: I18N.BULK_ACTIONS.REMOVE_TAGS, keepDrawerOpen: true, onClick: handleBulkRemoveTags },
  ]
  drawerStore.push(BulkActionsDrawer, { actions })
}

function handleFiltersClicked() {
  drawerStore.push(FilterByTagsDrawer, {
    initialTagIds: [...selectedTagIds.value],
    initialFilterMode: libraryStore.tagFilterMode,
    applyCallback: (tagIds: string[], mode: 'and' | 'or') => {
      libraryStore.selectedTagIds = tagIds
      libraryStore.tagFilterMode = mode
    },
  })
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
    I18N.LIBRARY.REMOVE_FROM_LIBRARY_TITLE,
    I18N.LIBRARY.REMOVE_FROM_LIBRARY_CONFIRM(librarySong.custom_title || librarySong.song?.title || 'this song'),
    I18N.LIBRARY.REMOVE_BUTTON,
    I18N.BUTTONS.CANCEL
  )
  
  if (!confirmed) return
  
  try {
    await libraryStore.removeFromLibrary(librarySong.id)
    uiStore.showToast(I18N.TOAST.SONGS_REMOVED_FROM_LIBRARY(1), 'success')
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
  const ids = [...uiStore.selectedIds]
  drawerStore.push(ConfirmDrawer, {
    title: I18N.LIBRARY.DELETE_SONGS_TITLE,
    message: I18N.LIBRARY.DELETE_SONGS_CONFIRM(ids.length),
    confirmLabel: I18N.BUTTONS.DELETE,
    cancelLabel: I18N.BUTTONS.CANCEL,
    confirmVariant: 'danger',
    confirmCallback: async () => {
      try {
        for (const librarySongId of ids) {
          await libraryStore.removeFromLibrary(librarySongId)
        }
        uiStore.showToast(I18N.TOAST.SONGS_REMOVED_FROM_LIBRARY(ids.length), 'success')
        uiStore.exitSelectionMode()
        drawerStore.popAll()
        await restoreScroll()
      } catch (err) {
        uiStore.showErrorToast('delete songs', err as Error)
        drawerStore.popAll()
        await restoreScroll()
      }
    },
  })
}

function handleBulkAssignTags() {
  const ids = [...uiStore.selectedIds]
  drawerStore.push(BulkAssignTagsDrawer, {
    applyCallback: async (tagIds: string[]) => {
      try {
        await tagsStore.bulkAssignTags(ids, tagIds)
        await libraryStore.loadLibrary({ force: true })
        uiStore.showToast(I18N.TOAST.BULK_TAGS_ASSIGNED(ids.length), 'success')
        uiStore.exitSelectionMode()
        drawerStore.popAll()
        await restoreScroll()
      } catch (err) {
        uiStore.showErrorToast('assign tags', err as Error)
        drawerStore.popAll()
        await restoreScroll()
      }
    },
  })
}

function handleBulkRemoveTags() {
  const ids = [...uiStore.selectedIds]
  drawerStore.push(BulkRemoveTagsDrawer, {
    applyCallback: async (tagIds: string[]) => {
      try {
        await tagsStore.bulkRemoveTags(ids, tagIds)
        await libraryStore.loadLibrary({ force: true })
        uiStore.showToast(I18N.TOAST.BULK_TAGS_REMOVED(ids.length), 'success')
        uiStore.exitSelectionMode()
        drawerStore.popAll()
        await restoreScroll()
      } catch (err) {
        uiStore.showErrorToast('remove tags', err as Error)
        drawerStore.popAll()
        await restoreScroll()
      }
    },
  })
}

function handleBulkAddToLists() {
  const ids = [...uiStore.selectedIds]
  drawerStore.push(BulkAddToListsDrawer, {
    applyCallback: async (listIds: string[]) => {
      try {
        for (const listId of listIds) {
          await listsStore.bulkAddLibrarySongsToList(listId, ids)
        }
        await libraryStore.loadLibrary({ force: true })
        uiStore.showToast(I18N.TOAST.BULK_ADDED_TO_LISTS(ids.length), 'success')
        uiStore.exitSelectionMode()
        drawerStore.popAll()
        await restoreScroll()
      } catch (err) {
        uiStore.showErrorToast('add to lists', err as Error)
        drawerStore.popAll()
        await restoreScroll()
      }
    },
  })
}

</script>
