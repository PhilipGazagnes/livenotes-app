<template>
  <!-- Header -->
  <div class="flex-shrink-0 bg-gray-800 border-b border-gray-700 p-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold text-white">{{ title }}</h2>
      <button
        @click="drawerStore.pop()"
        :disabled="isLoading"
        class="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Close"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  </div>

  <!-- Body -->
  <div class="flex-1 p-6">
    <p class="text-gray-300 text-base leading-relaxed">{{ message }}</p>
  </div>

  <!-- Footer -->
  <div class="flex-shrink-0 p-4 border-t border-gray-700 flex gap-3">
    <button
      @click="drawerStore.pop()"
      :disabled="isLoading"
      class="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
    >
      {{ cancelLabel }}
    </button>
    <button
      @click="handleConfirm"
      :disabled="isLoading"
      class="flex-1 px-4 py-3 rounded-lg transition-colors font-medium text-white flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
      :class="confirmVariant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'"
    >
      <svg v-if="isLoading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
      {{ confirmLabel }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDrawerStore } from '@/stores/drawer'

const props = defineProps<{
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  confirmVariant?: 'danger' | 'default'
  confirmCallback: () => Promise<void>
}>()

const drawerStore = useDrawerStore()
const isLoading = ref(false)

async function handleConfirm() {
  isLoading.value = true
  try {
    await props.confirmCallback()
  } finally {
    isLoading.value = false
  }
}
</script>
