<template>
  <ion-page>
    <ion-content class="bg-gray-900">
      <!-- Header -->
      <AppHeader
        :title="currentList?.name || I18N.PAGE_TITLES.LIST_DETAIL"
        :show-back="true"
        :show-menu="true"
      />

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

      <!-- Songs in List -->
      <div v-else class="p-4 space-y-3 pb-32">
        <ListSongCard
          v-for="(item, index) in displayedItems"
          :key="item.id"
          :item="item"
          :canMoveUp="index > 0"
          :canMoveDown="index < displayedItems.length - 1"
          @moveUp="handleMoveUp(index)"
          @moveDown="handleMoveDown(index)"
          @remove="handleRemove(item)"
          @refresh="handleRefresh"
        />
        
        <!-- Empty state for filtered results -->
        <div v-if="displayedItems.length === 0" class="text-center py-12 px-4">
          <svg class="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <p class="text-gray-400">{{ I18N.EMPTY_STATES.NO_RESULTS }}</p>
        </div>
      </div>

      <!-- Sticky Search Bar -->
      <div v-if="listItems.length > 0" class="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4 z-10">
        <div class="max-w-2xl mx-auto">
          <div class="flex gap-2">
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
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonPage, IonContent } from '@ionic/vue'
import { useListsStore } from '@/stores/lists'
import { useTagsStore } from '@/stores/tags'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { MESSAGES } from '@/constants/messages'
import { ROUTES } from '@/constants/routes'
import { I18N } from '@/constants/i18n'
import AppHeader from '@/components/AppHeader.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import ListSongCard from '@/components/ListSongCard.vue'
import FilterByTagsModal from '@/components/FilterByTagsModal.vue'

const route = useRoute()
const router = useRouter()
const listsStore = useListsStore()
const tagsStore = useTagsStore()
const authStore = useAuthStore()
const uiStore = useUiStore()

const searchQuery = ref('')
const selectedTagIds = ref<string[]>([])
const showFilterModal = ref(false)

const listId = computed(() => route.params.id as string)
const currentList = computed(() => listsStore.currentList)
const listItems = computed(() => currentList.value?.items || [])

// Filtered and searched items
const displayedItems = computed(() => {
  let filtered = listItems.value
  
  // Apply tag filter (AND logic - song must have ALL selected tags)
  if (selectedTagIds.value.length > 0) {
    filtered = filtered.filter(item => {
      const songTagIds = item.song.tags?.map(t => t.id) || []
      return selectedTagIds.value.every(tagId => songTagIds.includes(tagId))
    })
  }
  
  // Apply search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(item => {
      const song = item.song
      return song.title.toLowerCase().includes(query) ||
             song.artist?.toLowerCase().includes(query) ||
             song.livenotes_poc_id?.toLowerCase().includes(query) ||
             song.notes?.toLowerCase().includes(query)
    })
  }
  
  return filtered
})

function openFilterModal() {
  showFilterModal.value = true
}

function handleApplyFilter(tagIds: string[]) {
  selectedTagIds.value = tagIds
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

async function handleMoveUp(index: number) {
  if (index === 0 || !currentList.value) return
  
  const items = [...listItems.value]
  const item = items[index]
  const prevItem = items[index - 1]
  
  // Swap positions
  items[index] = prevItem
  items[index - 1] = item
  
  // Update positions in database
  const itemIds = items.map(i => i.id)
  const result = await listsStore.reorderListItems(currentList.value.id, itemIds)
  
  if (result.success) {
    uiStore.showToast(MESSAGES.SUCCESS.ORDER_UPDATED, 'success')
  } else {
    uiStore.showToast(result.error || MESSAGES.ERROR.SAVE_FAILED, 'error')
  }
}

async function handleMoveDown(index: number) {
  if (index >= listItems.value.length - 1 || !currentList.value) return
  
  const items = [...listItems.value]
  const item = items[index]
  const nextItem = items[index + 1]
  
  // Swap positions
  items[index] = nextItem
  items[index + 1] = item
  
  // Update positions in database
  const itemIds = items.map(i => i.id)
  const result = await listsStore.reorderListItems(currentList.value.id, itemIds)
  
  if (result.success) {
    uiStore.showToast(MESSAGES.SUCCESS.ORDER_UPDATED, 'success')
  } else {
    uiStore.showToast(result.error || MESSAGES.ERROR.SAVE_FAILED, 'error')
  }
}

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

async function handleRefresh() {
  // Refresh list to show updated tags/lists
  if (listId.value) {
    await listsStore.fetchListById(listId.value)
  }
}
</script>
