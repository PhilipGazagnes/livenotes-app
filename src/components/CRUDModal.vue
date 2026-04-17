<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
    @click.self="emit('close')"
  >
    <div class="bg-gray-800 rounded-lg p-6 w-full max-w-md">
      <h3 class="text-xl font-semibold text-white mb-4">{{ title }}</h3>
      
      <div class="mb-4">
        <label :for="inputId" class="block text-sm font-medium text-gray-300 mb-2">
          {{ label }} <span class="text-red-400">*</span>
        </label>
        <input
          :id="inputId"
          :value="modelValue"
          @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
          type="text"
          :maxlength="maxLength"
          class="w-full px-4 py-3 bg-gray-900 border rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          :class="error ? 'border-red-500' : 'border-gray-700'"
          :placeholder="placeholder"
          @keyup.enter="emit('submit')"
          :autofocus="autofocus"
        />
        <p v-if="error" class="mt-1 text-sm text-red-400">
          {{ error }}
        </p>
      </div>

      <div class="flex gap-3">
        <button
          @click="emit('close')"
          class="flex-1 px-6 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
        >
          {{ cancelText }}
        </button>
        <button
          @click="emit('submit')"
          :disabled="isSubmitting"
          class="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ isSubmitting ? loadingText : submitText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  isOpen: boolean
  title: string
  label: string
  modelValue: string
  error?: string
  placeholder?: string
  maxLength?: number
  isSubmitting?: boolean
  submitText?: string
  loadingText?: string
  cancelText?: string
  autofocus?: boolean
}>(), {
  maxLength: 50,
  isSubmitting: false,
  submitText: 'Save',
  loadingText: 'Saving...',
  cancelText: 'Cancel',
  autofocus: true,
  placeholder: '',
  error: '',
})

const emit = defineEmits<{
  close: []
  submit: []
  'update:modelValue': [value: string]
}>()

const inputId = `crud-modal-input-${Math.random().toString(36).substring(7)}`
</script>
