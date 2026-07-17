<template>
  <div class="fixed bottom-0 left-0 right-0 z-10">
    <!-- Selection strip — slides in above the main bar when bulk mode is active -->
    <Transition name="strip-slide">
      <div
        v-if="uiStore.selectionMode"
        class="bg-gray-900 border-t border-gray-700 px-4 py-2 flex items-center gap-3"
      >
        <span class="text-white text-sm font-medium flex-shrink-0">
          {{ uiStore.selectedIds.length }} selected
        </span>
        <button
          @click="uiStore.deselectAll()"
          class="p-1 text-gray-500 hover:text-white transition-colors flex-shrink-0"
          aria-label="Deselect all"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
        <div class="flex-1" />
        <button
          @click="uiStore.selectAll(allItemIds)"
          class="text-sm text-gray-300 hover:text-white transition-colors flex-shrink-0"
        >
          Select all
        </button>
        <button
          :disabled="uiStore.selectedIds.length === 0"
          @click="emit('chooseActionClicked')"
          class="px-3 py-1 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex-shrink-0"
        >
          Choose action
        </button>
      </div>
    </Transition>

    <!-- Main bar -->
    <div class="bg-gray-800 border-t border-gray-700 p-3">
      <div class="max-w-2xl mx-auto flex items-center gap-2">

        <!-- Search input -->
        <div class="relative flex-1">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
          <input
            v-model="localQuery"
            type="text"
            placeholder="Search..."
            class="w-full pl-10 pr-10 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          <button
            v-if="localQuery"
            @click="localQuery = ''"
            class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white transition-colors"
            aria-label="Clear search"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Filter button -->
        <button
          :disabled="!filtersEnabled"
          @click="filtersEnabled && emit('filtersClicked')"
          class="flex-shrink-0 p-2.5 rounded-lg border transition-colors"
          :class="!filtersEnabled
            ? 'border-gray-700 text-gray-600 bg-gray-900 cursor-not-allowed'
            : filtersActive
            ? 'border-blue-500 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20'
            : 'border-gray-700 text-gray-400 bg-gray-900 hover:text-white hover:border-gray-600'"
          aria-label="Filters"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
          </svg>
        </button>

        <!-- Bulk selection button -->
        <button
          v-if="authStore.isEditor"
          @click="toggleBulkMode"
          class="flex-shrink-0 p-2.5 rounded-lg border transition-colors"
          :class="uiStore.selectionMode
            ? 'border-blue-500 text-blue-400 bg-blue-500/10'
            : 'border-gray-700 text-gray-400 bg-gray-900 hover:text-white hover:border-gray-600'"
          aria-label="Bulk selection"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H18a2 2 0 012 2v10a2 2 0 01-2 2"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8a2 2 0 012-2z"/>
          </svg>
        </button>

        <!-- New button -->
        <button
          v-if="authStore.isEditor"
          @click="emit('newClicked')"
          data-testid="sticky-bar-new-btn"
          class="flex-shrink-0 p-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          aria-label="Create new"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
        </button>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{
  searchQuery: string
  allItemIds: string[]
  filtersEnabled?: boolean
  filtersActive?: boolean
}>()

const emit = defineEmits<{
  'update:searchQuery': [value: string]
  filtersClicked: []
  newClicked: []
  chooseActionClicked: []
}>()

const uiStore = useUiStore()
const authStore = useAuthStore()

const localQuery = computed({
  get: () => props.searchQuery,
  set: (v) => emit('update:searchQuery', v),
})

function toggleBulkMode() {
  if (uiStore.selectionMode) {
    uiStore.exitSelectionMode()
  } else {
    uiStore.enterSelectionMode()
  }
}
</script>

<style scoped>
.strip-slide-enter-active,
.strip-slide-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.strip-slide-enter-from,
.strip-slide-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
