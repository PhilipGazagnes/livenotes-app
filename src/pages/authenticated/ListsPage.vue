<template>
  <ion-page>
    <ion-content>
      <AppHeader :title="I18N.PAGE_TITLES.LISTS" :show-back="true" :show-menu="true" />

      <div v-if="!listsStore.isLoading && listsStore.listCount === 0" class="text-center py-12 px-4">
        <svg class="w-24 h-24 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
        </svg>
        <h2 class="text-xl font-semibold text-white mb-2">{{ MESSAGES.EMPTY_NO_LISTS }}</h2>
        <p class="text-gray-400 mb-6">{{ MESSAGES.EMPTY_NO_LISTS_SUBTITLE }}</p>
        <button
          @click="showCreateModal = true"
          class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          {{ I18N.EMPTY_STATES.NO_LISTS.CTA }}
        </button>
      </div>

      <div v-else class="p-4 space-y-3 pb-24">
        <BaseCard
          v-for="list in filteredLists"
          :key="list.id"
          :title="list.name"
          :title-segments="getTitleSegments(list)"
          :text="getListText(list)"
          :id="list.id"
          :dropdown-items="getListDropdownItems(list)"
          @click="handleListClick(list)"
        />
      </div>

      <BaseStickyBar
        v-model:search-query="searchQuery"
        :all-item-ids="filteredLists.map(l => l.id)"
        :filters-enabled="false"
        @new-clicked="showCreateModal = true"
        @choose-action-clicked="handleChooseAction"
      />

      <!-- Create Modal -->
      <Teleport to="body">
        <div
          v-if="showCreateModal"
          class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          @click.self="showCreateModal = false"
        >
          <div class="bg-gray-800 rounded-lg w-full max-w-md p-6">
            <h2 class="text-xl font-semibold text-white mb-4">{{ I18N.MODALS.CREATE_LIST }}</h2>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-300 mb-2">{{ I18N.FORM.LIST_NAME }}</label>
              <input
                v-model="newListName" type="text" maxlength="50"
                class="w-full px-4 py-2 bg-gray-900 border rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                :class="createError ? 'border-red-500' : 'border-gray-700'"
                :placeholder="I18N.PLACEHOLDERS.LIST_NAME"
                @keyup.enter="handleCreateSubmit" @input="createError = ''"
              />
              <p v-if="createError" class="mt-1 text-sm text-red-400">{{ createError }}</p>
              <p class="mt-1 text-xs text-gray-500">{{ I18N.COUNTERS.CHAR_COUNT(newListName.length, 50) }}</p>
            </div>
            <div class="flex gap-3">
              <button @click="showCreateModal = false" class="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">{{ I18N.BUTTONS.CANCEL }}</button>
              <button @click="handleCreateSubmit" :disabled="isCreating" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {{ isCreating ? I18N.LOADING.CREATING : I18N.BUTTONS.CREATE }}
              </button>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- Rename Modal -->
      <Teleport to="body">
        <div
          v-if="showRenameModal && listToRename"
          class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          @click.self="showRenameModal = false"
        >
          <div class="bg-gray-800 rounded-lg w-full max-w-md p-6">
            <h2 class="text-xl font-semibold text-white mb-4">{{ I18N.MODALS.RENAME_LIST }}</h2>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-300 mb-2">{{ I18N.FORM.LIST_NAME }}</label>
              <input
                v-model="renameListName" type="text" maxlength="50"
                class="w-full px-4 py-2 bg-gray-900 border rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                :class="renameError ? 'border-red-500' : 'border-gray-700'"
                :placeholder="I18N.PLACEHOLDERS.LIST_NAME"
                @keyup.enter="handleRenameSubmit" @input="renameError = ''"
              />
              <p v-if="renameError" class="mt-1 text-sm text-red-400">{{ renameError }}</p>
              <p class="mt-1 text-xs text-gray-500">{{ I18N.COUNTERS.CHAR_COUNT(renameListName.length, 50) }}</p>
            </div>
            <div class="flex gap-3">
              <button @click="showRenameModal = false" class="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">{{ I18N.BUTTONS.CANCEL }}</button>
              <button @click="handleRenameSubmit" :disabled="isRenaming" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {{ isRenaming ? I18N.LOADING.SAVING : I18N.BUTTONS.SAVE }}
              </button>
            </div>
          </div>
        </div>
      </Teleport>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { IonPage, IonContent } from '@ionic/vue'
import { useListsStore } from '@/stores/lists'
import { useAuthStore } from '@/stores/auth'
import { MESSAGES } from '@/constants/messages'
import { I18N } from '@/constants/i18n'
import { ROUTES } from '@/constants/routes'
import { useFuseSearch } from '@/composables/useFuseSearch'
import { usePageLoad } from '@/composables/usePageLoad'
import { useListCRUD } from '@/composables/useListCRUD'
import { fetchListSongCounts } from '@/services/listService'
import AppHeader from '@/components/AppHeader.vue'
import BaseCard from '@/components/BaseCard.vue'
import BaseStickyBar from '@/components/BaseStickyBar.vue'
import type { List } from '@/types/database'

const router = useRouter()
const listsStore = useListsStore()
const authStore = useAuthStore()

const searchQuery = ref('')
const listSongCounts = ref<Map<string, number>>(new Map())

const { filteredItems: filteredLists, getTitleSegments } =
  useFuseSearch(computed(() => listsStore.listsByName), searchQuery, l => l.name, () => undefined)

const {
  showCreateModal, newListName, createError, isCreating, handleCreateSubmit,
  showRenameModal, listToRename, renameListName, renameError, isRenaming, handleRenameSubmit,
  handleChooseAction, handleRename, handleDelete,
} = useListCRUD()

function getListText(list: List) {
  return I18N.PLURALS.SONG_COUNT(listSongCounts.value.get(list.id) ?? 0)
}

function getListDropdownItems(list: List) {
  return [
    { label: I18N.DROPDOWN.RENAME, callback: () => handleRename(list) },
    { label: I18N.DROPDOWN.DELETE, variant: 'danger' as const, callback: () => handleDelete(list) },
  ]
}

function handleListClick(list: List) {
  router.push(`${ROUTES.LISTS}/${list.id}`)
}

const { execute } = usePageLoad()

onMounted(() => {
  execute(async () => {
    const projectId = authStore.activeProjectId
    if (!projectId) return
    await listsStore.fetchLists(projectId)
    const listIds = listsStore.lists.map(l => l.id)
    if (listIds.length) listSongCounts.value = await fetchListSongCounts(listIds)
  }, { errorMessage: 'Failed to load lists' })
})
</script>
