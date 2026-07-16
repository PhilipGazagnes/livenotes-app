<template>
  <ion-page>
    <ion-content ref="ionContentRef">
      <AppHeader
        :title="currentList?.name || I18N.PAGE_TITLES.LIST_DETAIL"
        :show-back="true"
        :show-menu="true"
      />

      <div v-if="!listsStore.isLoading && !currentList" class="text-center py-12 px-4">
        <svg class="w-24 h-24 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <h2 class="text-xl font-semibold text-white mb-2">{{ I18N.EMPTY_STATES.LIST_NOT_FOUND.TITLE }}</h2>
        <p class="text-gray-400 mb-6">{{ I18N.EMPTY_STATES.LIST_NOT_FOUND.SUBTITLE }}</p>
      </div>

      <div v-else-if="listItems.length === 0" class="text-center py-12 px-4">
        <svg class="w-24 h-24 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
        </svg>
        <h2 class="text-xl font-semibold text-white mb-2">{{ I18N.EMPTY_STATES.LIST_NO_SONGS.TITLE }}</h2>
        <p class="text-gray-400 mb-6">{{ I18N.EMPTY_STATES.LIST_NO_SONGS.SUBTITLE }}</p>
      </div>

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
              <ListTitleCard
                v-if="item.type === 'title'"
                :item="item"
                :draggable="true"
                @edited="handleEditTitle(item)"
                @deleted="handleDeleteTitle(item)"
              />
              <BaseCard
                v-else
                :title="item.song?.title || ''"
                :title-segments="getTitleSegments(item as any)"
                :text="getItemText(item as any)"
                :text-segments="getSubtitleSegments(item as any)"
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

        <div v-if="displayedItems.length === 0" class="text-center py-12 px-4">
          <svg class="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <p class="text-gray-400">{{ I18N.EMPTY_STATES.NO_RESULTS }}</p>
        </div>
      </div>

      <BaseStickyBar
        v-model:search-query="searchQuery"
        :all-item-ids="displayedItems.filter(i => i.type === 'song').map(i => i.id)"
        :filters-enabled="false"
        @new-clicked="handleAddTitle"
        @choose-action-clicked="handleChooseAction"
      />

      <ManageTagsModal
        v-if="showSongManageTagsModal && selectedSongItem"
        :isOpen="true"
        :librarySongId="selectedSongItem.library_song_id ?? undefined"
        :songTitle="selectedSongItem.song.title"
        :initialTagIds="selectedSongItem.song.tags?.map(t => t.id) || []"
        @closed="showSongManageTagsModal = false; selectedSongItem = null"
        @saved="handleSongTagsSaved"
      />

      <ManageListsModal
        v-if="showSongManageListsModal && selectedSongItem"
        :isOpen="true"
        :librarySongId="selectedSongItem.library_song_id || ''"
        :songTitle="selectedSongItem.song.title"
        :initialListIds="selectedSongItem.song.lists?.map(l => l.id) || []"
        @closed="showSongManageListsModal = false; selectedSongItem = null"
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
import { ROUTES } from '@/constants/routes'
import { I18N } from '@/constants/i18n'
import AppHeader from '@/components/AppHeader.vue'
import BaseCard from '@/components/BaseCard.vue'
import ListTitleCard from '@/components/ListTitleCard.vue'
import BaseStickyBar from '@/components/BaseStickyBar.vue'
import CreateItemDrawer from '@/components/CreateItemDrawer.vue'
import { useListReorder } from '@/composables/useListReorder'
import { useListBulkActions } from '@/composables/useListBulkActions'
import { useListSongActions } from '@/composables/useListSongActions'
import type { ListItem } from '@/types/database'

const ManageTagsModal = defineAsyncComponent(() => import('@/components/ManageTagsModal.vue'))
const ManageListsModal = defineAsyncComponent(() => import('@/components/ManageListsModal.vue'))

const route = useRoute()
const router = useRouter()
const listsStore = useListsStore()
const tagsStore = useTagsStore()
const authStore = useAuthStore()
const uiStore = useUiStore()
const drawerStore = useDrawerStore()

const searchQuery = ref('')
const listId = computed(() => route.params.id as string)
const currentList = computed(() => listsStore.currentList)
const listItems = computed(() => currentList.value?.items || [])
const listName = computed(() => currentList.value?.name || '')

const { handleChooseAction } = useListBulkActions(listId, listItems, listName, handleRefresh)

const {
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
} = useListSongActions(handleRefresh)

const { ionContentRef, scrollElement, initScrollElement, displayedItems, handleDragEnd, getTitleSegments, getSubtitleSegments } =
  useListReorder(currentList, searchQuery, getItemText)

onMounted(async () => {
  try {
    await initScrollElement()
    if (listId.value) {
      const result = await listsStore.fetchListById(listId.value)
      if (!result) { router.push(ROUTES.LISTS); return }
    }
    const projectId = authStore.activeProjectId
    if (projectId) await tagsStore.fetchTags(projectId)
  } catch {
    uiStore.showToast(I18N.TOAST.LIST_LOAD_FAILED, 'error')
  } finally {
    uiStore.hideOperationOverlay()
  }
})

async function handleRefresh() {
  if (listId.value) await listsStore.fetchListById(listId.value)
}

function handleAddTitle() {
  if (!currentList.value) return
  const id = currentList.value.id
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
        await createListItemTitle(id, name, maxPosition + 1)
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

async function handleDeleteTitle(item: ListItem) {
  const confirmed = await uiStore.showConfirm(
    'Delete Title', 'Are you sure you want to delete this title section?',
    I18N.BUTTONS.DELETE, I18N.BUTTONS.CANCEL,
  )
  if (!confirmed) return
  try {
    await deleteListItem(item.id)
    uiStore.showToast(I18N.TOAST.TITLE_DELETED, 'success')
    await handleRefresh()
  } catch {
    uiStore.showToast(I18N.TOAST.TITLE_DELETE_FAILED, 'error')
  }
}
</script>

<style scoped>
.drag-ghost { opacity: 0.4; background: rgba(59, 130, 246, 0.1); }
.drag-chosen { opacity: 0.8; transform: scale(1.02); box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3); }
.drag-active { opacity: 1; box-shadow: 0 8px 30px rgba(59, 130, 246, 0.5); cursor: grabbing !important; transform: rotate(2deg); z-index: 1000; }
.drag-handle { cursor: grab; }
.drag-handle:active { cursor: grabbing; }
</style>
