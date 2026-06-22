<template>
  <div class="flex-shrink-0 bg-gray-800 border-b border-gray-700 p-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold text-white">{{ title }}</h2>
      <button
        @click="drawerStore.pop()"
        :disabled="isLoading"
        class="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        :aria-label="I18N.ARIA.CLOSE"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  </div>

  <div class="flex-1 p-6">
    <label class="block text-sm font-medium text-gray-300 mb-2">{{ label }}</label>
    <input
      ref="inputRef"
      v-model="name"
      type="text"
      :maxlength="maxLength"
      :placeholder="placeholder"
      :disabled="isLoading"
      class="w-full px-4 py-2 bg-gray-900 border rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
      :class="error ? 'border-red-500' : 'border-gray-700'"
      @input="error = ''"
      @keyup.enter="handleSubmit"
    />
    <p v-if="error" class="mt-1 text-sm text-red-400">{{ error }}</p>
    <p v-if="maxLength !== undefined" class="mt-1 text-xs text-gray-500">{{ name.length }} / {{ maxLength }}</p>
  </div>

  <div class="flex-shrink-0 p-4 border-t border-gray-700 flex gap-3">
    <button
      @click="drawerStore.pop()"
      :disabled="isLoading"
      class="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
    >
      {{ I18N.BUTTONS.CANCEL }}
    </button>
    <button
      @click="handleSubmit"
      :disabled="isLoading"
      class="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
    >
      <svg v-if="isLoading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
      {{ submitLabel ?? I18N.BUTTONS.CREATE }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDrawerStore } from '@/stores/drawer'
import { useUiStore } from '@/stores/ui'
import { I18N } from '@/constants/i18n'

const props = defineProps<{
  title: string
  label: string
  placeholder?: string
  maxLength?: number
  submitLabel?: string
  successMessage: string
  initialValue?: string
  validateFn?: (name: string) => string
  submitCallback: (name: string) => Promise<{ success: boolean; error?: string }>
}>()

const drawerStore = useDrawerStore()
const uiStore = useUiStore()

const name = ref(props.initialValue ?? '')
const error = ref('')
const isLoading = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

onMounted(() => setTimeout(() => inputRef.value?.focus(), 320))

async function handleSubmit() {
  error.value = ''
  const trimmed = name.value.trim()

  if (props.validateFn) {
    const validationError = props.validateFn(trimmed)
    if (validationError) { error.value = validationError; return }
  }

  isLoading.value = true
  try {
    const result = await props.submitCallback(trimmed)
    if (result.success) {
      uiStore.showToast(props.successMessage, 'success')
      drawerStore.pop()
    } else {
      error.value = result.error ?? 'Failed to create'
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An error occurred'
  } finally {
    isLoading.value = false
  }
}
</script>
