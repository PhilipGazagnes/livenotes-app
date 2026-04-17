<template>
  <Teleport to="body">
    <div class="fixed top-0 left-0 right-0 z-[200] p-4 pointer-events-none">
      <TransitionGroup
        tag="div"
        enter-active-class="transition-all duration-300"
        leave-active-class="transition-all duration-300"
        enter-from-class="opacity-0 -translate-y-2"
        leave-to-class="opacity-0 translate-y-2"
        class="flex flex-col items-center gap-2"
      >
        <div
          v-for="toast in uiStore.toasts"
          :key="toast.id"
          :class="[
            'pointer-events-auto max-w-md w-full px-4 py-3 rounded-lg shadow-lg flex items-center gap-3',
            toast.type === 'success' 
              ? 'bg-green-900 border border-green-700' 
              : 'bg-red-900 border border-red-700'
          ]"
        >
          <!-- Icon -->
          <div class="flex-shrink-0">
            <svg
              v-if="toast.type === 'success'"
              class="w-5 h-5 text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            <svg
              v-else
              class="w-5 h-5 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </div>

          <!-- Message -->
          <div :class="toast.type === 'success' ? 'text-green-100' : 'text-red-100'" class="flex-1">
            <p class="text-sm font-medium">
              {{ toast.message }}
            </p>
            <!-- Context/Error Details -->
            <p v-if="toast.context" class="text-xs mt-1 opacity-90">
              {{ toast.context }}
            </p>
          </div>

          <!-- Close Button -->
          <button
            @click="uiStore.removeToast(toast.id)"
            :class="toast.type === 'success' ? 'text-green-400 hover:text-green-300' : 'text-red-400 hover:text-red-300'"
            class="flex-shrink-0 p-1 transition-colors"
            :aria-label="I18N.ARIA.CLOSE"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useUiStore } from '@/stores/ui'
import { I18N } from '@/constants/i18n'

const uiStore = useUiStore()
</script>
