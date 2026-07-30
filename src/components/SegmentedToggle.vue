<template>
  <div class="flex items-center gap-3 mt-3">
    <span class="text-sm text-gray-400">{{ label }}</span>
    <div class="flex rounded-lg overflow-hidden border border-gray-600">
      <button
        v-for="option in options"
        :key="option.value"
        @click="emit('update:modelValue', option.value)"
        class="px-3 py-1 text-sm font-medium transition-colors"
        :class="modelValue === option.value ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'"
      >{{ option.label }}</button>
    </div>
    <span v-if="description" class="text-sm text-gray-400">{{ description }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  modelValue: string
  options: { value: string; label: string }[]
  description?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()
</script>
