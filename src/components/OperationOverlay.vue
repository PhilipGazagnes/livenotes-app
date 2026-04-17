<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="uiStore.operationOverlay.isVisible"
        class="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        @click.prevent.stop
      >
        <div class="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-8 max-w-sm w-full mx-4">
          <!-- Spinner -->
          <div class="flex justify-center mb-6">
            <div class="relative">
              <div class="w-16 h-16 rounded-full border-4 border-gray-700 border-t-blue-500 animate-spin"></div>
            </div>
          </div>
          
          <!-- Message -->
          <p class="text-center text-white text-lg font-medium">
            {{ uiStore.operationOverlay.message }}
          </p>
          
          <!-- Subtext -->
          <p class="text-center text-gray-400 text-sm mt-2">
            Please wait...
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useUiStore } from '@/stores/ui'

const uiStore = useUiStore()
</script>
