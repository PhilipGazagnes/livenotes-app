<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="uiStore.confirmDialog"
        class="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/50"
        @mousedown.self="!uiStore.confirmDialog.isLoading && handleCancel()"
      >
        <Transition
          enter-active-class="transition-all duration-200"
          leave-active-class="transition-all duration-200"
          enter-from-class="opacity-0 scale-95"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="uiStore.confirmDialog"
            class="bg-gray-900 border border-gray-800 rounded-lg shadow-xl max-w-md w-full"
            @click.stop
          >
            <!-- Header -->
            <div class="px-6 py-4 border-b border-gray-800">
              <h3 class="text-lg font-semibold text-white">
                {{ uiStore.confirmDialog.title }}
              </h3>
            </div>

            <!-- Body -->
            <div class="px-6 py-4">
              <p class="text-gray-300">
                {{ uiStore.confirmDialog.message }}
              </p>
            </div>

            <!-- Footer -->
            <div class="px-6 py-4 border-t border-gray-800 flex justify-end gap-3">
              <button
                @click="handleCancel"
                :disabled="uiStore.confirmDialog.isLoading"
                class="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ uiStore.confirmDialog.cancelText }}
              </button>
              <button
                @click="handleConfirm"
                :disabled="uiStore.confirmDialog.isLoading"
                class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <!-- Spinner when loading -->
                <div
                  v-if="uiStore.confirmDialog.isLoading"
                  class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"
                ></div>
                <span>{{ uiStore.confirmDialog.confirmText }}</span>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useUiStore } from '@/stores/ui'

const uiStore = useUiStore()

function handleConfirm() {
  if (uiStore.confirmDialog?.onConfirm) {
    uiStore.confirmDialog.onConfirm()
  }
}

function handleCancel() {
  if (uiStore.confirmDialog?.onCancel) {
    uiStore.confirmDialog.onCancel()
  } else {
    uiStore.closeConfirm()
  }
}
</script>
