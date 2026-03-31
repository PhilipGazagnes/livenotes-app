<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" @click.self="$emit('close')">
    <div class="bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-gray-700">
        <h2 class="text-xl font-semibold text-white">{{ I18N.MODAL_CONTENT.BULK_ADD_TO_LISTS_TITLE }}</h2>
        <button @click="$emit('close')" class="p-1 text-gray-400 hover:text-white transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <!-- Create New List -->
        <div class="border-b border-gray-700 pb-4">
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

        <!-- Available Lists -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            {{ I18N.MODAL_CONTENT.AVAILABLE_LISTS }}
          </label>
          <div v-if="listsStore.lists.length === 0" class="text-center py-8 text-gray-400">
            {{ I18N.EMPTY_STATES.NO_LISTS_IN_MODAL }}
          </div>
          <div v-else class="space-y-2">
            <label
              v-for="list in listsStore.lists"
              :key="list.id"
              class="flex items-center gap-3 p-3 bg-gray-900 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
            >
              <input
                type="checkbox"
                :checked="selectedListIds.includes(list.id)"
                @change="toggleList(list.id)"
                class="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <div class="flex-1 min-w-0">
                <div class="text-white font-medium truncate">{{ list.name }}</div>
                <div v-if="list.description" class="text-sm text-gray-400 truncate">{{ list.description }}</div>
              </div>
            </label>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex gap-3 p-4 border-t border-gray-700">
        <button
          @click="$emit('close')"
          class="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
        >
          {{ I18N.BUTTONS.CANCEL }}
        </button>
        <button
          @click="handleApply"
          :disabled="selectedListIds.length === 0"
          class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          {{ I18N.BUTTONS.ADD }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useListsStore } from '@/stores/lists'
import { useAuthStore } from '@/stores/auth'
import { I18N } from '@/constants/i18n'
import { normalizeText } from '@/utils/validation'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
  apply: [listIds: string[]]
}>()

const listsStore = useListsStore()
const authStore = useAuthStore()

const selectedListIds = ref<string[]>([])
const newListName = ref('')
const createError = ref('')
const isCreatingList = ref(false)

function toggleList(listId: string) {
  const index = selectedListIds.value.indexOf(listId)
  if (index > -1) {
    selectedListIds.value.splice(index, 1)
  } else {
    selectedListIds.value.push(listId)
  }
}

async function handleCreateList() {
  createError.value = ''
  
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
    isCreatingList.value = false
    return
  }
  
  const result = await listsStore.createList(personalProjectId, name)
  
  if (result.success && result.data) {
    // Automatically select the newly created list
    selectedListIds.value.push(result.data.id)
    newListName.value = ''
    createError.value = ''
  } else {
    createError.value = result.error || 'Failed to create list'
  }
  
  isCreatingList.value = false
}

function handleApply() {
  emit('apply', selectedListIds.value)
  selectedListIds.value = []
  newListName.value = ''
  createError.value = ''
  emit('close')
}
</script>
