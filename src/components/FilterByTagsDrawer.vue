<template>
  <!-- Header -->
  <div class="flex-shrink-0 bg-gray-800 border-b border-gray-700 p-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold text-white">{{ I18N.MODALS.FILTER_BY_TAGS }}</h2>
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

    <!-- AND / OR toggle -->
    <div v-if="selectedTagIds.length > 1" class="flex items-center gap-3 mt-3">
      <span class="text-sm text-gray-400">Match</span>
      <div class="flex rounded-lg overflow-hidden border border-gray-600">
        <button
          @click="filterMode = 'and'"
          class="px-3 py-1 text-sm font-medium transition-colors"
          :class="filterMode === 'and' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'"
        >AND</button>
        <button
          @click="filterMode = 'or'"
          class="px-3 py-1 text-sm font-medium transition-colors"
          :class="filterMode === 'or' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'"
        >OR</button>
      </div>
      <span class="text-sm text-gray-400">{{ filterMode === 'and' ? 'all selected tags' : 'any selected tag' }}</span>
    </div>
  </div>

  <!-- Selected tags strip -->
  <div v-if="selectedTagIds.length > 0" class="flex-shrink-0 p-4 border-b border-gray-700">
    <div class="flex items-center justify-between mb-3">
      <span class="text-sm font-medium text-gray-300">{{ I18N.FILTER.SELECTED_TAGS }}:</span>
      <button @click="selectedTagIds = []" class="text-sm text-blue-400 hover:text-blue-300 transition-colors">
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
        <button @click="toggleTag(tagId)" class="hover:text-blue-300 transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>
  </div>

  <!-- Tag list (scrollable) -->
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

  <!-- Apply button -->
  <div class="flex-shrink-0 p-4 border-t border-gray-700">
    <button
      @click="handleApply"
      class="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
    >
      {{ I18N.FILTER.APPLY }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTagsStore } from '@/stores/tags'
import { useDrawerStore } from '@/stores/drawer'
import { I18N } from '@/constants/i18n'

const props = defineProps<{
  initialTagIds: string[]
  initialFilterMode: 'and' | 'or'
  applyCallback: (tagIds: string[], mode: 'and' | 'or') => void
}>()

const tagsStore = useTagsStore()
const drawerStore = useDrawerStore()

const selectedTagIds = ref<string[]>([...props.initialTagIds])
const filterMode = ref<'and' | 'or'>(props.initialFilterMode)

const sortedTags = computed(() =>
  [...tagsStore.tags].sort((a, b) => a.name.localeCompare(b.name))
)

function toggleTag(tagId: string) {
  const idx = selectedTagIds.value.indexOf(tagId)
  if (idx > -1) selectedTagIds.value.splice(idx, 1)
  else selectedTagIds.value.push(tagId)
}

function getTagName(tagId: string): string {
  return tagsStore.tags.find(t => t.id === tagId)?.name || ''
}

function handleApply() {
  props.applyCallback(selectedTagIds.value, filterMode.value)
  drawerStore.pop()
}
</script>
