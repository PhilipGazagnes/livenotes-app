<template>
  <!-- Header -->
  <div class="flex-shrink-0 bg-gray-800 border-b border-gray-700 p-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold text-white">Choose action</h2>
        <p class="text-sm text-gray-400 mt-0.5">
          {{ selectedCount }} item{{ selectedCount !== 1 ? 's' : '' }} selected
        </p>
      </div>
      <button
        @click="drawerStore.pop()"
        class="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
        aria-label="Close"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  </div>

  <!-- Actions list -->
  <div class="flex-1 overflow-y-auto p-4">
    <div class="space-y-2">
      <button
        v-for="action in actions"
        :key="action.label"
        @click="handleAction(action)"
        class="w-full px-4 py-3 text-left rounded-lg font-medium transition-colors border"
        :class="action.variant === 'danger'
          ? 'text-red-400 hover:bg-red-500/10 border-red-900/50 hover:border-red-500/50'
          : action.variant === 'warning'
          ? 'text-orange-400 hover:bg-orange-500/10 border-orange-900/50 hover:border-orange-500/50'
          : 'text-white hover:bg-gray-700 border-gray-700'"
      >
        {{ action.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDrawerStore } from '@/stores/drawer'
import { useUiStore } from '@/stores/ui'
import type { BulkAction } from '@/types/bulkAction'

export type { BulkAction }

defineProps<{
  actions: BulkAction[]
}>()

const drawerStore = useDrawerStore()
const uiStore = useUiStore()

const selectedCount = computed(() => uiStore.selectedIds.length)

function handleAction(action: BulkAction) {
  if (!action.keepDrawerOpen) drawerStore.pop()
  action.onClick()
}
</script>
