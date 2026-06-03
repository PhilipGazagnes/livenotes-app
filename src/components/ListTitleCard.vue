<template>
  <div class="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden flex items-stretch">
    <!-- Main content area -->
    <div class="flex items-center gap-3 px-4 py-3 flex-1 min-w-0">
      <!-- Title Icon -->
      <div class="flex-shrink-0">
        <svg class="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/>
        </svg>
      </div>

      <!-- Title Text -->
      <div class="flex-1 min-w-0">
        <h3 class="text-lg font-semibold text-yellow-400 truncate">
          {{ item.title }}
        </h3>
      </div>

      <DropdownMenu v-if="!uiStore.selectionMode" :items="dropdownItems" />
    </div>

    <!-- Drag handle zone (only in draggable contexts, not in selection mode) -->
    <div
      v-if="draggable && !uiStore.selectionMode"
      class="drag-handle w-10 flex-shrink-0 border-l border-gray-700/50 bg-gray-900/30 flex items-center justify-center"
      @click.stop
    >
      <svg class="w-2.5 h-5 text-gray-600" viewBox="0 0 10 20" fill="currentColor" aria-hidden="true">
        <circle cx="3" cy="4" r="1.5"/>
        <circle cx="7" cy="4" r="1.5"/>
        <circle cx="3" cy="10" r="1.5"/>
        <circle cx="7" cy="10" r="1.5"/>
        <circle cx="3" cy="16" r="1.5"/>
        <circle cx="7" cy="16" r="1.5"/>
      </svg>
    </div>

  </div>
</template>

<script setup lang="ts">
import type { ListItem } from '@/types/database'
import { useUiStore } from '@/stores/ui'
import DropdownMenu from '@/components/DropdownMenu.vue'

defineProps<{
  item: ListItem
  draggable?: boolean
}>()

const emit = defineEmits<{
  edit: []
  delete: []
}>()

const uiStore = useUiStore()

const dropdownItems = [
  { label: 'Edit', callback: () => emit('edit') },
  { label: 'Delete', variant: 'danger' as const, callback: () => emit('delete') },
]
</script>
