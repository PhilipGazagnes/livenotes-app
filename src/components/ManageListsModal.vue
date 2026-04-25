<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <div
      v-if="isOpen"
      class="fixed inset-0 z-[60] bg-black/50"
      @mousedown.self="handleCancel"
    ></div>

    <!-- Modal -->
    <div
      v-if="isOpen"
      class="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none"
    >
      <div class="bg-gray-800 rounded-lg w-full max-w-md max-h-[80vh] flex flex-col pointer-events-auto">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 class="text-xl font-semibold text-white truncate pr-4">
            {{ I18N.MODAL_CONTENT.MANAGE_LISTS_TITLE(songTitle) }}
          </h2>
          <button
            @click="handleCancel"
            class="flex-shrink-0 p-1 text-gray-400 hover:text-white transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Create New List -->
        <div class="p-6 border-b border-gray-700">
          <label class="block text-sm font-medium text-gray-300 mb-2">
            {{ I18N.MODAL_CONTENT.CREATE_NEW_LIST }}
          </label>
          <div class="flex gap-2">
            <input
              v-model="newListName"
              type="text"
              maxlength="50"
              class="flex-1 px-4 py-2 bg-gray-900 border rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              :class="createError ? 'border-red-500' : 'border-gray-700'"
              :placeholder="I18N.PLACEHOLDERS.LIST_NAME_SHORT"
              @keyup.enter="handleCreateList"
            />
            <button
              @click="handleCreateList"
              :disabled="isCreatingList"
              class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ I18N.BUTTONS.ADD }}
            </button>
          </div>
          <p v-if="createError" class="mt-1 text-sm text-red-400">
            {{ createError }}
          </p>
        </div>

        <!-- Available Lists (scrollable) -->
        <div class="flex-1 overflow-y-auto p-6">
          <label class="block text-sm font-medium text-gray-300 mb-4">
            {{ I18N.MODAL_CONTENT.AVAILABLE_LISTS }}
          </label>
          
          <div v-if="listsStore.lists.length === 0" class="text-center py-8 text-gray-400">
            {{ I18N.EMPTY_STATES.NO_LISTS_IN_MODAL }}
          </div>
          
          <div v-else class="space-y-3">
            <label
              v-for="list in sortedLists"
              :key="list.id"
              class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                :checked="selectedListIds.includes(list.id)"
                @change="toggleList(list.id)"
                class="w-5 h-5 rounded border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:ring-offset-gray-800 bg-gray-700"
              />
              <span class="text-white">{{ list.name }}</span>
            </label>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex gap-3 p-6 border-t border-gray-700">
          <button
            @click="handleCancel"
            class="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            {{ I18N.BUTTONS.CANCEL }}
          </button>
          <button
            @click="handleSave"
            :disabled="isSaving"
            class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ isSaving ? I18N.LOADING.SAVING : I18N.BUTTONS.SAVE }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useListsStore } from '@/stores/lists'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { MESSAGES } from '@/constants/messages'
import { I18N } from '@/constants/i18n'
import { normalizeText } from '@/utils/validation'

const props = defineProps<{
  isOpen: boolean
  librarySongId: string
  songTitle: string
  initialListIds: string[]
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const listsStore = useListsStore()
const authStore = useAuthStore()
const uiStore = useUiStore()

const selectedListIds = ref<string[]>([])
const newListName = ref('')
const createError = ref('')
const isCreatingList = ref(false)
const isSaving = ref(false)

// Sort lists alphabetically
const sortedLists = computed(() => {
  return [...listsStore.lists].sort((a, b) => a.name.localeCompare(b.name))
})

// Initialize selectedListIds when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    selectedListIds.value = [...props.initialListIds]
    newListName.value = ''
    createError.value = ''
  }
})

function toggleList(listId: string) {
  const index = selectedListIds.value.indexOf(listId)
  if (index > -1) {
    selectedListIds.value.splice(index, 1)
  } else {
    selectedListIds.value.push(listId)
  }
}

async function handleCreateList() {
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
  
  isCreatingList.value = true
  const personalProjectId = await authStore.getPersonalProjectId()
  
  if (!personalProjectId) {
    createError.value = I18N.VALIDATION.PROJECT_NOT_FOUND
    isCreatingList.value = false
    return
  }
  
  const result = await listsStore.createList(personalProjectId, newListName.value)
  isCreatingList.value = false
  
  if (result.success && result.data) {
    // Automatically select the newly created list
    selectedListIds.value.push(result.data.id)
    newListName.value = ''
    createError.value = ''
  } else {
    createError.value = result.error || 'Failed to create list'
  }
}

async function handleSave() {
  isSaving.value = true
  
  try {
    // Determine which lists to add to and which to remove from
    const listsToAdd = selectedListIds.value.filter(
      id => !props.initialListIds.includes(id)
    )
    const listsToRemove = props.initialListIds.filter(
      id => !selectedListIds.value.includes(id)
    )
    
    // Add library song to new lists
    for (const listId of listsToAdd) {
      const result = await listsStore.addLibrarySongToList(listId, props.librarySongId)
      if (!result.success) {
        uiStore.showToast(result.error || MESSAGES.ERROR.SAVE_FAILED, 'error')
        isSaving.value = false
        return
      }
    }
    
    // Remove library song from deselected lists
    for (const listId of listsToRemove) {
      const result = await listsStore.removeLibrarySongFromList(listId, props.librarySongId)
      if (!result.success) {
        uiStore.showToast(result.error || MESSAGES.ERROR.SAVE_FAILED, 'error')
        isSaving.value = false
        return
      }
    }
    
    uiStore.showToast(MESSAGES.SUCCESS.LISTS_UPDATED, 'success')
    emit('saved')
  } catch (err) {
    uiStore.showToast(MESSAGES.ERROR.SAVE_FAILED, 'error')
  } finally {
    isSaving.value = false
  }
}

function handleCancel() {
  emit('close')
}
</script>
