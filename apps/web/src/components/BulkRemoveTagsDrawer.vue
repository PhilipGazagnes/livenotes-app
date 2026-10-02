<template>
  <div class="flex-shrink-0 bg-gray-800 border-b border-gray-700 p-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold text-white">{{ I18N.MODAL_CONTENT.BULK_REMOVE_TAGS_TITLE }}</h2>
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

  <div class="flex-1 overflow-y-auto p-4">
    <div v-if="tagsStore.tags.length === 0" class="text-center py-8 text-gray-400">
      {{ I18N.EMPTY_STATES.NO_TAGS_IN_MODAL }}
    </div>
    <div v-else class="space-y-1">
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
      :disabled="selectedTagIds.length === 0 || isLoading"
      class="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
    >
      <svg v-if="isLoading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
      {{ I18N.BUTTONS.REMOVE }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTagsStore } from '@/stores/tags'
import { useDrawerStore } from '@/stores/drawer'
import { I18N } from '@/constants/i18n'

const props = defineProps<{
  applyCallback: (tagIds: string[]) => Promise<void>
}>()

const tagsStore = useTagsStore()
const drawerStore = useDrawerStore()
const selectedTagIds = ref<string[]>([])
const isLoading = ref(false)

const sortedTags = computed(() => [...tagsStore.tags].sort((a, b) => a.name.localeCompare(b.name)))

function toggleTag(tagId: string) {
  const idx = selectedTagIds.value.indexOf(tagId)
  if (idx > -1) selectedTagIds.value.splice(idx, 1)
  else selectedTagIds.value.push(tagId)
}

async function handleApply() {
  isLoading.value = true
  try {
    await props.applyCallback(selectedTagIds.value)
  } finally {
    isLoading.value = false
  }
}
</script>
