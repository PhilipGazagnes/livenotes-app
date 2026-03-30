<template>
  <ion-page>
    <ion-content class="bg-gray-900">
      <!-- Header -->
      <AppHeader
        title="Lists"
        :show-back="true"
        :show-menu="true"
      >
        <template #action>
          <button
            @click="showCreateModal = true"
            class="p-2 text-white hover:text-gray-300 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
          </button>
        </template>
      </AppHeader>

      <!-- Loading State -->
      <div v-if="listsStore.isLoading" class="flex items-center justify-center py-20">
        <LoadingSpinner />
      </div>

      <!-- Empty State -->
      <div v-else-if="!listsStore.isLoading && listsStore.listCount === 0" class="text-center py-12 px-4">
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
          Create Your First List
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

      <!-- Create List Modal -->
      <Teleport to="body">
        <div
          v-if="showCreateModal"
          class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          @click.self="showCreateModal = false"
        >
          <div class="bg-gray-800 rounded-lg w-full max-w-md p-6">
            <h2 class="text-xl font-semibold text-white mb-4">Create New List</h2>
            
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-300 mb-2">
                List Name
              </label>
              <input
                v-model="newListName"
                type="text"
                maxlength="50"
                class="w-full px-4 py-2 bg-gray-900 border rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                :class="createError ? 'border-red-500' : 'border-gray-700'"
                placeholder="Enter list name..."
                @keyup.enter="handleCreateSubmit"
                @input="createError = ''"
              />
              <p v-if="createError" class="mt-1 text-sm text-red-400">
                {{ createError }}
              </p>
              <p class="mt-1 text-xs text-gray-500">
                {{ newListName.length }} / 50 characters
              </p>
            </div>
            
            <div class="flex gap-3">
              <button
                @click="showCreateModal = false"
                class="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                @click="handleCreateSubmit"
                :disabled="isCreating"
                class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {{ isCreating ? 'Creating...' : 'Create' }}
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
            <h2 class="text-xl font-semibold text-white mb-4">Rename List</h2>
            
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-300 mb-2">
                List Name
              </label>
              <input
                v-model="renameListName"
                type="text"
                maxlength="50"
                class="w-full px-4 py-2 bg-gray-900 border rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                :class="renameError ? 'border-red-500' : 'border-gray-700'"
                placeholder="Enter list name..."
                @keyup.enter="handleRenameSubmit"
                @input="renameError = ''"
              />
              <p v-if="renameError" class="mt-1 text-sm text-red-400">
                {{ renameError }}
              </p>
              <p class="mt-1 text-xs text-gray-500">
                {{ renameListName.length }} / 50 characters
              </p>
            </div>
            
            <div class="flex gap-3">
              <button
                @click="showRenameModal = false"
                class="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                @click="handleRenameSubmit"
                :disabled="isRenaming"
                class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {{ isRenaming ? 'Saving...' : 'Save' }}
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
import { normalizeText } from '@/utils/validation'
import AppHeader from '@/components/AppHeader.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import ListCard from '@/components/ListCard.vue'
import type { List } from '@/types/database'

const listsStore = useListsStore()
const authStore = useAuthStore()
const uiStore = useUiStore()

const showCreateModal = ref(false)
const newListName = ref('')
const createError = ref('')
const isCreating = ref(false)

const showRenameModal = ref(false)
const listToRename = ref<List | null>(null)
const renameListName = ref('')
const renameError = ref('')
const isRenaming = ref(false)

onMounted(async () => {
  const personalProjectId = await authStore.getPersonalProjectId()
  if (personalProjectId) {
    await listsStore.fetchLists(personalProjectId)
  }
})

async function handleCreateSubmit() {
  const name = normalizeText(newListName.value)
  
  if (!name) {
    createError.value = 'List name is required'
    return
  }
  
  if (name.length > 50) {
    createError.value = 'List name must be 50 characters or less'
    return
  }
  
  // Check for duplicate names
  const duplicate = listsStore.lists.find(
    list => normalizeText(list.name) === name
  )
  if (duplicate) {
    createError.value = 'A list with this name already exists'
    return
  }
  
  isCreating.value = true
  const personalProjectId = await authStore.getPersonalProjectId()
  
  if (!personalProjectId) {
    createError.value = 'Project not found'
    isCreating.value = false
    return
  }
  
  const result = await listsStore.createList(personalProjectId, newListName.value)
  isCreating.value = false
  
  if (result.success) {
    uiStore.showToast(MESSAGES.SUCCESS.LIST_CREATED, 'success')
    showCreateModal.value = false
    newListName.value = ''
    createError.value = ''
  } else {
    createError.value = result.error || 'Failed to create list'
  }
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
    renameError.value = 'List name is required'
    return
  }
  
  if (name.length > 50) {
    renameError.value = 'List name must be 50 characters or less'
    return
  }
  
  // Check for duplicate names (excluding current list)
  const duplicate = listsStore.lists.find(
    list => list.id !== listToRename.value?.id && normalizeText(list.name) === name
  )
  if (duplicate) {
    renameError.value = 'A list with this name already exists'
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
    'Delete List',
    MESSAGES.CONFIRM_DELETE_LIST(list.name),
    'Delete',
    'Cancel'
  )
  
  if (confirmed) {
    const result = await listsStore.deleteList(list.id)
    
    if (result.success) {
      uiStore.showToast(MESSAGES.SUCCESS.LIST_DELETED, 'success')
    } else {
      uiStore.showToast(result.error || MESSAGES.ERROR.SAVE_FAILED, 'error')
    }
  }
}
</script>
