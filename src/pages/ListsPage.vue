<template>
  <ion-page>
    <ion-content class="bg-gray-900">
      <!-- Header -->
      <AppHeader
        :title="I18N.PAGE_TITLES.LISTS"
        :show-back="true"
        :show-menu="true"
      >
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
              <button
                @click="handleCreateClick"
                class="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-gray-700 transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                {{ I18N.DROPDOWN.CREATE_NEW_LIST }}
              </button>
              <button
                v-if="listsStore.listCount > 0"
                @click="handleEnterSelectionMode"
                class="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-gray-700 transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                </svg>
                {{ I18N.DROPDOWN.SELECT_LISTS }}
              </button>
            </div>
          </div>
        </template>
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
        <ListCard
          v-for="list in listsStore.listsByName"
          :key="list.id"
          :list="list"
          @rename="handleRename"
          @delete="handleDelete"
        />
      </div>

      <!-- Sticky Bottom Bar -->
      <div v-if="uiStore.selectionMode" class="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4 z-10">
        <div class="max-w-2xl mx-auto space-y-3">
          <!-- Action Buttons -->
          <div v-if="uiStore.selectedIds.length > 0" class="flex gap-2">
            <button
              @click="handleBulkDelete"
              class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {{ I18N.BULK_ACTIONS.DELETE_LISTS }}
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
      </div>

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
import { ref, onMounted } from 'vue'
import { IonPage, IonContent } from '@ionic/vue'
import { useListsStore } from '@/stores/lists'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { MESSAGES } from '@/constants/messages'
import { I18N } from '@/constants/i18n'
import { normalizeText } from '@/utils/validation'
import { executeOperation } from '@/utils/operations'
import { usePageLoad } from '@/composables/usePageLoad'
import AppHeader from '@/components/AppHeader.vue'
import ListCard from '@/components/ListCard.vue'
import type { List } from '@/types/database'

const listsStore = useListsStore()
const authStore = useAuthStore()
const uiStore = useUiStore()

const isPageMenuOpen = ref(false)
const showCreateModal = ref(false)
const newListName = ref('')
const createError = ref('')
const isCreating = ref(false)

const showRenameModal = ref(false)
const listToRename = ref<List | null>(null)
const renameListName = ref('')
const renameError = ref('')
const isRenaming = ref(false)

function handleCreateClick() {
  isPageMenuOpen.value = false
  showCreateModal.value = true
}

function handleEnterSelectionMode() {
  isPageMenuOpen.value = false
  uiStore.enterSelectionMode()
}

function handleSelectAll() {
  const allListIds = listsStore.listsByName.map(list => list.id)
  uiStore.selectAll(allListIds)
}

const { execute } = usePageLoad()

onMounted(() => {
  execute(async () => {
    const personalProjectId = await authStore.getPersonalProjectId()
    if (personalProjectId) {
      await listsStore.fetchLists(personalProjectId)
    }
  }, {
    errorMessage: 'Failed to load lists'
  })
})

async function handleBulkDelete() {
  const count = uiStore.selectedIds.length
  const confirmed = await uiStore.showConfirm(
    I18N.MODAL_CONTENT.BULK_DELETE_LISTS_TITLE(count),
    I18N.MODAL_CONTENT.BULK_DELETE_LISTS_MESSAGE(count),
    I18N.BUTTONS.DELETE,
    I18N.BUTTONS.CANCEL
  )
  
  if (confirmed) {
    const projectId = await authStore.getPersonalProjectId()
    if (projectId) {
      await executeOperation(
        () => listsStore.bulkDeleteLists(uiStore.selectedIds, projectId),
        {
          loadingMessage: 'Deleting lists...',
          successMessage: I18N.TOAST.BULK_DELETED_LISTS(count),
          errorContext: 'delete lists',
          onSuccess: () => {
            uiStore.exitSelectionMode()
          },
        }
      )
    }
  }
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
  
  const personalProjectId = await authStore.getPersonalProjectId()
  
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
