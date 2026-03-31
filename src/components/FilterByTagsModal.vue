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
          <h2 class="text-xl font-semibold text-white">
            {{ I18N.MODALS.FILTER_BY_TAGS }}
          </h2>
          <button
            @click="handleCancel"
            class="flex-shrink-0 p-1 text-gray-400 hover:text-white transition-colors"
            :aria-label="I18N.ARIA.CLOSE"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Selected Tags Display -->
        <div v-if="selectedTagIds.length > 0" class="p-6 border-b border-gray-700">
          <div class="flex items-center justify-between mb-3">
            <label class="text-sm font-medium text-gray-300">
              {{ I18N.FILTER.SELECTED_TAGS }}:
            </label>
            <button
              @click="clearAll"
              class="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              {{ I18N.FILTER.UNCHECK_ALL }}
            </button>
          </div>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="tagId in selectedTagIds"
              :key="tagId"
              class="inline-flex items-center gap-2 px-3 py-1 bg-blue-900/30 border border-blue-700 rounded text-blue-400 text-sm"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
              </svg>
              <span>{{ getTagName(tagId) }}</span>
              <button
                @click="toggleTag(tagId)"
                class="hover:text-blue-300 transition-colors"
                :aria-label="I18N.BUTTONS.REMOVE"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Available Tags (scrollable) -->
        <div class="flex-1 overflow-y-auto p-6">
          <label class="block text-sm font-medium text-gray-300 mb-4">
            {{ I18N.FILTER.AVAILABLE_TAGS }}:
          </label>
          
          <div v-if="tagsStore.tags.length === 0" class="text-center py-8 text-gray-400">
            {{ I18N.EMPTY_STATES.NO_TAGS_IN_MODAL }}
          </div>
          
          <div v-else class="space-y-3">
            <label
              v-for="tag in sortedTags"
              :key="tag.id"
              class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                :checked="selectedTagIds.includes(tag.id)"
                @change="toggleTag(tag.id)"
                class="w-5 h-5 rounded border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:ring-offset-gray-800 bg-gray-700"
              />
              <span class="text-white">{{ tag.name }}</span>
            </label>
          </div>
        </div>

        <!-- Footer Buttons -->
        <div class="flex gap-3 p-6 border-t border-gray-700">
          <button
            @click="handleCancel"
            class="flex-1 px-6 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
          >
            {{ I18N.BUTTONS.CANCEL }}
          </button>
          <button
            @click="handleApply"
            class="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {{ I18N.FILTER.APPLY }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTagsStore } from '@/stores/tags'
import { I18N } from '@/constants/i18n'

const props = defineProps<{
  isOpen: boolean
  initialTagIds: string[]
}>()

const emit = defineEmits<{
  close: []
  apply: [tagIds: string[]]
}>()

const tagsStore = useTagsStore()
const selectedTagIds = ref<string[]>([])

// Sort tags alphabetically
const sortedTags = computed(() => {
  return [...tagsStore.tags].sort((a, b) => a.name.localeCompare(b.name))
})

// Initialize selectedTagIds when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    selectedTagIds.value = [...props.initialTagIds]
  }
})

function toggleTag(tagId: string) {
  const index = selectedTagIds.value.indexOf(tagId)
  if (index > -1) {
    selectedTagIds.value.splice(index, 1)
  } else {
    selectedTagIds.value.push(tagId)
  }
}

function clearAll() {
  selectedTagIds.value = []
}

function getTagName(tagId: string): string {
  return tagsStore.tags.find(t => t.id === tagId)?.name || ''
}

function handleCancel() {
  emit('close')
}

function handleApply() {
  emit('apply', selectedTagIds.value)
  emit('close')
}
</script>
