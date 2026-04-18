<!--
  ListFilterBar.vue
  
  Search and filter bar for list songs
  
  Provides:
  - Text search input
  - Tag filter button with badge showing active filter count
  
  Props:
    - searchQuery: Current search text (v-model)
    - selectedTagIds: Array of selected tag IDs for filtering (v-model)
  
  Emits:
    - update:searchQuery: When search text changes
    - update:selectedTagIds: When tag filters change
  
  Note: Integrates FilterByTagsModal for tag selection
-->

<template>
  <div class="flex gap-2">
    <div class="relative flex-1">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
      </div>
      <input
        :value="searchQuery"
        @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
        type="text"
        :placeholder="I18N.PLACEHOLDERS.SEARCH_SONGS"
        class="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
    <button
      @click="showFilterModal = true"
      class="px-4 py-3 bg-gray-900 border rounded-lg transition-colors"
      :class="selectedTagIds.length > 0 ? 'border-blue-500 text-blue-400' : 'border-gray-700 text-gray-400 hover:text-white'"
      :aria-label="I18N.FILTER.FILTER_BY_TAGS"
    >
      <div class="flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
        </svg>
        <span v-if="selectedTagIds.length > 0" class="text-sm font-medium">{{ selectedTagIds.length }}</span>
      </div>
    </button>

    <!-- Filter Modal -->
    <FilterByTagsModal
      :isOpen="showFilterModal"
      :initialTagIds="selectedTagIds"
      @close="showFilterModal = false"
      @apply="handleApplyFilter"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, defineAsyncComponent } from 'vue'
import { I18N } from '@/constants/i18n'
// Lazy load modal for better performance
const FilterByTagsModal = defineAsyncComponent(() => import('./FilterByTagsModal.vue'))

const props = defineProps<{
  searchQuery: string
  selectedTagIds: string[]
}>()

const emit = defineEmits<{
  'update:searchQuery': [value: string]
  'update:selectedTagIds': [tagIds: string[]]
}>()

const showFilterModal = ref(false)

function handleApplyFilter(tagIds: string[]) {
  emit('update:selectedTagIds', tagIds)
}
</script>
