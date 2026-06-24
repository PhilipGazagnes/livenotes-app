<template>
  <ion-page>
    <ion-content>
      <!-- Header -->
      <AppHeader
        :title="I18N.PAGE_TITLES.LISTS"
        :show-back="true"
        :show-menu="true"
      >
      </AppHeader>

      <!-- Empty State -->
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

      <!-- Lists List -->
      <div v-else class="p-4 space-y-3 pb-24">
        <Card
          v-for="list in filteredLists"
          :key="list.id"
          :title="list.name"
          :text="getListText(list)"
          :id="list.id"
          :highlight-text="searchQuery"
          :dropdown-items="getListDropdownItems(list)"
          @click="handleListClick(list)"
        />
      </div>

      <StickyBar
        v-model:search-query="searchQuery"
        :all-item-ids="filteredLists.map(l => l.id)"
        :filters-enabled="false"
        @new-clicked="showCreateModal = true"
        @choose-action-clicked="handleChooseAction"
      />

      <!-- Create List Modal -->
      <Teleport to="body">
        <div
          v-if="showCreateModal"
          class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          @click.self="showCreateModal = false"
        >
          <div class="bg-gray-800 rounded-lg w-full max-w-md p-6">
            <h2 class="text-xl font-semibold text-white mb-4">{{ I18N.MODALS.CREATE_LIST }}</h2>
            
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-300 mb-2">
                {{ I18N.FORM.LIST_NAME }}
              </label>
              <input
                v-model="newListName"
                type="text"
                maxlength="50"
                class="w-full px-4 py-2 bg-gray-900 border rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                :class="createError ? 'border-red-500' : 'border-gray-700'"
                :placeholder="I18N.PLACEHOLDERS.LIST_NAME"
                @keyup.enter="handleCreateSubmit"
                @input="createError = ''"
              />
              <p v-if="createError" class="mt-1 text-sm text-red-400">
                {{ createError }}
              </p>
              <p class="mt-1 text-xs text-gray-500">
                {{ I18N.COUNTERS.CHAR_COUNT(newListName.length, 50) }}
              </p>
            </div>
            
            <div class="flex gap-3">
              <button
                @click="showCreateModal = false"
                class="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                {{ I18N.BUTTONS.CANCEL }}
              </button>
              <button
                @click="handleCreateSubmit"
                :disabled="isCreating"
                class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {{ isCreating ? I18N.LOADING.CREATING : I18N.BUTTONS.CREATE }}
              </button>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- Rename List Modal -->
      <Teleport to="body">
        <div
          v-if="showRenameModal && listToRename"
          class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          @click.self="showRenameModal = false"
        >
          <div class="bg-gray-800 rounded-lg w-full max-w-md p-6">
            <h2 class="text-xl font-semibold text-white mb-4">{{ I18N.MODALS.RENAME_LIST }}</h2>
            
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-300 mb-2">
                {{ I18N.FORM.LIST_NAME }}
              </label>
              <input
                v-model="renameListName"
                type="text"
                maxlength="50"
                class="w-full px-4 py-2 bg-gray-900 border rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                :class="renameError ? 'border-red-500' : 'border-gray-700'"
                :placeholder="I18N.PLACEHOLDERS.LIST_NAME"
                @keyup.enter="handleRenameSubmit"
                @input="renameError = ''"
              />
              <p v-if="renameError" class="mt-1 text-sm text-red-400">
                {{ renameError }}
              </p>
              <p class="mt-1 text-xs text-gray-500">
                {{ I18N.COUNTERS.CHAR_COUNT(renameListName.length, 50) }}
              </p>
            </div>
            
            <div class="flex gap-3">
              <button
                @click="showRenameModal = false"
                class="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                {{ I18N.BUTTONS.CANCEL }}
              </button>
              <button
                @click="handleRenameSubmit"
                :disabled="isRenaming"
                class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
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
import { useUiStore } from '@/stores/ui'
import { useDrawerStore } from '@/stores/drawer'
import { MESSAGES } from '@/constants/messages'
import { I18N } from '@/constants/i18n'
import { ROUTES } from '@/constants/routes'
import { normalizeText, foldAccents } from '@/utils/validation'
import { executeOperation } from '@/utils/operations'
import { usePageLoad } from '@/composables/usePageLoad'
import { supabase } from '@/lib/supabase'
import AppHeader from '@/components/AppHeader.vue'
import Card from '@/components/Card.vue'
import StickyBar from '@/components/StickyBar.vue'
import BulkActionsDrawer from '@/components/BulkActionsDrawer.vue'
import type { BulkAction } from '@/components/BulkActionsDrawer.vue'
import ConfirmDrawer from '@/components/ConfirmDrawer.vue'
import type { List } from '@/types/database'

const router = useRouter()
const listsStore = useListsStore()
const authStore = useAuthStore()
const uiStore = useUiStore()
const drawerStore = useDrawerStore()

const searchQuery = ref('')

const filteredLists = computed(() => {
  const q = foldAccents(searchQuery.value.trim())
  if (!q) return listsStore.listsByName
  return listsStore.listsByName.filter(l => foldAccents(l.name).includes(q))
})

const listSongCounts = ref<Map<string, number>>(new Map())
const showCreateModal = ref(false)

function getListText(list: List): string {
  return I18N.PLURALS.SONG_COUNT(listSongCounts.value.get(list.id) ?? 0)
}

function getListDropdownItems(list: List) {
  return [
    { label: I18N.DROPDOWN.RENAME, callback: () => handleRename(list) },
    { label: I18N.DROPDOWN.DELETE, variant: 'danger' as const, callback: () => handleDelete(list) },
  ]
}

function handleListClick(list: List) {
  uiStore.showOperationOverlay('Loading list...')
  router.push(`${ROUTES.LISTS}/${list.id}`)
}
const newListName = ref('')
const createError = ref('')
const isCreating = ref(false)

const showRenameModal = ref(false)
const listToRename = ref<List | null>(null)
const renameListName = ref('')
const renameError = ref('')
const isRenaming = ref(false)


function handleChooseAction() {
  const actions: BulkAction[] = [
    { label: I18N.BULK_ACTIONS.DELETE_LISTS, variant: 'danger', keepDrawerOpen: true, onClick: handleBulkDelete },
  ]
  drawerStore.push(BulkActionsDrawer, { actions })
}

const { execute } = usePageLoad()

onMounted(() => {
  execute(async () => {
    const personalProjectId = authStore.activeProjectId
    if (!personalProjectId) return

    await listsStore.fetchLists(personalProjectId)

    const listIds = listsStore.lists.map(l => l.id)
    if (listIds.length) {
      const { data } = await supabase
        .from('list_items')
        .select('list_id')
        .eq('type', 'song')
        .in('list_id', listIds)
      const counts = new Map(listIds.map(id => [id, 0]))
      data?.forEach((row: { list_id: string }) => {
        counts.set(row.list_id, (counts.get(row.list_id) ?? 0) + 1)
      })
      listSongCounts.value = counts
    }
  }, {
    errorMessage: 'Failed to load lists'
  })
})

function handleBulkDelete() {
  const ids = [...uiStore.selectedIds]
  const count = ids.length
  drawerStore.push(ConfirmDrawer, {
    title: I18N.MODAL_CONTENT.BULK_DELETE_LISTS_TITLE(count),
    message: I18N.MODAL_CONTENT.BULK_DELETE_LISTS_MESSAGE(count),
    confirmLabel: I18N.BUTTONS.DELETE,
    cancelLabel: I18N.BUTTONS.CANCEL,
    confirmVariant: 'danger',
    confirmCallback: async () => {
      try {
        const projectId = authStore.activeProjectId
        if (!projectId) throw new Error('Project not found')
        await listsStore.bulkDeleteLists(ids, projectId)
        uiStore.showToast(I18N.TOAST.BULK_DELETED_LISTS(count), 'success')
        uiStore.exitSelectionMode()
        drawerStore.popAll()
      } catch (err) {
        uiStore.showErrorToast('delete lists', err as Error)
        drawerStore.popAll()
      }
    },
  })
}

async function handleCreateSubmit() {
  const name = normalizeText(newListName.value)
  
  if (!name) {
    createError.value = I18N.VALIDATION.LIST_NAME_REQUIRED
    return
  }
  
  if (name.length > 50) {
    createError.value = I18N.VALIDATION.LIST_NAME_TOO_LONG
    return
  }
  
  // Check for duplicate names
  const duplicate = listsStore.lists.find(
    list => normalizeText(list.name) === name
  )
  if (duplicate) {
    createError.value = I18N.VALIDATION.LIST_ALREADY_EXISTS
    return
  }
  
  isCreating.value = true
  
  const personalProjectId = authStore.activeProjectId
  
  if (!personalProjectId) {
    createError.value = I18N.VALIDATION.PROJECT_NOT_FOUND
    isCreating.value = false
    return
  }
  
  await executeOperation(
    () => listsStore.createList(personalProjectId, newListName.value),
    {
      loadingMessage: 'Creating list...',
      successMessage: MESSAGES.SUCCESS.LIST_CREATED,
      errorContext: 'create list',
      onSuccess: () => {
        showCreateModal.value = false
        newListName.value = ''
        createError.value = ''
      },
      onError: (error) => {
        createError.value = error || 'Failed to create list'
      },
    }
  )
  
  isCreating.value = false
}

function handleRename(list: List) {
  listToRename.value = list
  renameListName.value = list.name
  renameError.value = ''
  showRenameModal.value = true
}

async function handleRenameSubmit() {
  if (!listToRename.value) return
  
  const name = normalizeText(renameListName.value)
  
  if (!name) {
    renameError.value = I18N.VALIDATION.LIST_NAME_REQUIRED
    return
  }
  
  if (name.length > 50) {
    renameError.value = I18N.VALIDATION.LIST_NAME_TOO_LONG
    return
  }
  
  // Check for duplicate names (excluding current list)
  const duplicate = listsStore.lists.find(
    list => list.id !== listToRename.value?.id && normalizeText(list.name) === name
  )
  if (duplicate) {
    renameError.value = I18N.VALIDATION.LIST_ALREADY_EXISTS
    return
  }
  
  isRenaming.value = true
  const result = await listsStore.updateList(listToRename.value.id, { name: renameListName.value })
  isRenaming.value = false
  
  if (result.success) {
    uiStore.showToast(MESSAGES.SUCCESS.LIST_RENAMED, 'success')
    showRenameModal.value = false
    listToRename.value = null
    renameListName.value = ''
    renameError.value = ''
  } else {
    renameError.value = result.error || 'Failed to rename list'
  }
}

async function handleDelete(list: List) {
  const confirmed = await uiStore.showConfirm(
    I18N.MODALS.DELETE_LIST,
    MESSAGES.CONFIRM_DELETE_LIST(list.name),
    I18N.BUTTONS.DELETE,
    I18N.BUTTONS.CANCEL
  )
  
  if (confirmed) {
    await executeOperation(
      () => listsStore.deleteList(list.id),
      {
        loadingMessage: 'Deleting list...',
        successMessage: MESSAGES.SUCCESS.LIST_DELETED,
        errorContext: 'delete list',
      }
    )
  }
}
</script>
