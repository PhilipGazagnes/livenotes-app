<template>
  <ion-page>
    <ion-content class="bg-gray-900">
      <!-- Header -->
      <AppHeader
        :title="currentList?.name || 'List'"
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
        <h2 class="text-xl font-semibold text-white mb-2">List not found</h2>
        <p class="text-gray-400 mb-6">This list may have been deleted</p>
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
      <div v-else class="p-4 space-y-3 pb-24">
        <ListSongCard
          v-for="(item, index) in listItems"
          :key="item.id"
          :item="item"
          :canMoveUp="index > 0"
          :canMoveDown="index < listItems.length - 1"
          @moveUp="handleMoveUp(index)"
          @moveDown="handleMoveDown(index)"
          @remove="handleRemove(item)"
          @refresh="handleRefresh"
        />
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonPage, IonContent } from '@ionic/vue'
import { useListsStore } from '@/stores/lists'
import { useUiStore } from '@/stores/ui'
import { MESSAGES } from '@/constants/messages'
import { ROUTES } from '@/constants/routes'
import AppHeader from '@/components/AppHeader.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import ListSongCard from '@/components/ListSongCard.vue'

const route = useRoute()
const router = useRouter()
const listsStore = useListsStore()
const uiStore = useUiStore()

const listId = computed(() => route.params.id as string)
const currentList = computed(() => listsStore.currentList)
const listItems = computed(() => currentList.value?.items || [])

onMounted(async () => {
  if (listId.value) {
    const result = await listsStore.fetchListById(listId.value)
    if (!result) {
      // List not found, redirect to lists page
      router.push(ROUTES.LISTS)
    }
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
    uiStore.showToast(`Removed from ${currentList.value.name}`, 'success')
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
