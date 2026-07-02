<template>
  <button
    data-testid="card-menu-btn"
    @click.stop.prevent="toggle"
    @mousedown.stop
    @touchstart.stop
    @pointerdown.stop
    class="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
  >
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
    </svg>
  </button>

  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-40 bg-black bg-opacity-20"
      @mousedown.self="isOpen = false"
    />
    <div
      v-if="isOpen"
      class="fixed z-50 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden"
      :style="position"
    >
      <div class="py-1">
        <template v-for="(item, index) in items" :key="item.label">
          <div
            v-if="index > 0 && (item.variant ?? 'default') !== (items[index - 1].variant ?? 'default')"
            class="border-t border-gray-700 my-1"
          />
          <button
            data-testid="dropdown-item"
            @click="handleClick(item)"
            class="w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors"
            :class="item.variant === 'danger' ? 'text-red-400 hover:text-red-300' : item.variant === 'warning' ? 'text-yellow-400 hover:text-yellow-300' : 'text-gray-300 hover:text-white'"
          >
            {{ item.label }}
          </button>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'

export interface DropdownMenuItem {
  label: string
  callback: () => void
  variant?: 'default' | 'warning' | 'danger'
}

defineProps<{
  items: DropdownMenuItem[]
}>()

const isOpen = ref(false)
const position = ref({ top: '0px', left: '0px' })

function toggle(event: MouseEvent) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  position.value = {
    top: `${rect.bottom}px`,
    left: `${rect.right - 192}px`,
  }
  isOpen.value = !isOpen.value
}

function handleClick(item: DropdownMenuItem) {
  isOpen.value = false
  item.callback()
}
</script>
