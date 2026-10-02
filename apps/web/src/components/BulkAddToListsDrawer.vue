<template>
  <div class="flex-shrink-0 bg-gray-800 border-b border-gray-700 p-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold text-white">{{ I18N.MODAL_CONTENT.BULK_ADD_TO_LISTS_TITLE }}</h2>
      <button
        @click="drawerStore.pop()"
        class="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
        :aria-label="I18N.ARIA.CLOSE"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  </div>

  <div class="flex-1 overflow-y-auto p-4 space-y-4" :class="{ 'pointer-events-none opacity-60': isLoading }">
    <!-- Create new list -->
    <div class="border-b border-gray-700 pb-4">
      <label class="block text-sm font-medium text-gray-300 mb-2">{{ I18N.MODAL_CONTENT.CREATE_NEW_LIST }}</label>
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
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ I18N.BUTTONS.ADD }}
        </button>
      </div>
      <p v-if="createError" class="mt-1 text-sm text-red-400">{{ createError }}</p>
    </div>

    <!-- Available lists -->
    <div>
      <label class="block text-sm font-medium text-gray-300 mb-2">{{ I18N.MODAL_CONTENT.AVAILABLE_LISTS }}</label>
      <div v-if="availableLists.length === 0" class="text-center py-8 text-gray-400">
        {{ I18N.EMPTY_STATES.NO_LISTS_IN_MODAL }}
      </div>
      <div v-else class="space-y-1">
        <label
          v-for="list in availableLists"
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
  </div>

  <div class="flex-shrink-0 p-4 border-t border-gray-700 flex gap-3">
    <button
      @click="drawerStore.pop()"
      :disabled="isLoading"
      class="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
    >
      {{ I18N.BUTTONS.CANCEL }}
    </button>
    <button
      @click="handleApply"
      :disabled="selectedListIds.length === 0 || isLoading"
      class="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
    >
      <svg v-if="isLoading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
      {{ isLoading ? I18N.LOADING.SAVING : I18N.BUTTONS.ADD }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useListsStore } from '@/stores/lists'
import { useAuthStore } from '@/stores/auth'
import { useDrawerStore } from '@/stores/drawer'
import { I18N } from '@/constants/i18n'
import { normalizeText } from '@/utils/validation'

const props = defineProps<{
  applyCallback: (listIds: string[]) => void
  excludeListId?: string
}>()

const listsStore = useListsStore()
const authStore = useAuthStore()
const drawerStore = useDrawerStore()

const availableLists = computed(() =>
  props.excludeListId
    ? listsStore.lists.filter(l => l.id !== props.excludeListId)
    : listsStore.lists
)

onMounted(async () => {
  const projectId = authStore.activeProjectId
  if (projectId) await listsStore.fetchLists(projectId)
})

const selectedListIds = ref<string[]>([])
const newListName = ref('')
const createError = ref('')
const isCreatingList = ref(false)
const isLoading = ref(false)

function toggleList(listId: string) {
  const idx = selectedListIds.value.indexOf(listId)
  if (idx > -1) selectedListIds.value.splice(idx, 1)
  else selectedListIds.value.push(listId)
}

async function handleCreateList() {
  createError.value = ''
  const name = normalizeText(newListName.value)
  if (!name) { createError.value = I18N.VALIDATION.LIST_NAME_REQUIRED; return }
  if (name.length > 50) { createError.value = I18N.VALIDATION.LIST_NAME_TOO_LONG; return }
  if (listsStore.lists.find(l => normalizeText(l.name) === name)) {
    createError.value = I18N.VALIDATION.LIST_ALREADY_EXISTS; return
  }
  isCreatingList.value = true
  const projectId = authStore.activeProjectId
  if (!projectId) { isCreatingList.value = false; return }
  const result = await listsStore.createList(projectId, name)
  if (result.success && result.data) {
    selectedListIds.value.push(result.data.id)
    newListName.value = ''
  } else {
    createError.value = result.error || 'Failed to create list'
  }
  isCreatingList.value = false
}

async function handleApply() {
  isLoading.value = true
  try {
    await props.applyCallback(selectedListIds.value)
  } finally {
    isLoading.value = false
  }
}
</script>
