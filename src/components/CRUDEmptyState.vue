<template>
  <div class="text-center py-12 px-4">
    <svg class="w-24 h-24 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="iconPath"/>
    </svg>
    <h2 class="text-xl font-semibold text-white mb-2">{{ title }}</h2>
    <p class="text-gray-400 mb-6">{{ subtitle }}</p>
    
    <button
      @click="emit('create')"
      class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
      </svg>
      {{ ctaText }}
    </button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  title: string
  subtitle: string
  ctaText: string
  iconPath: string
}>()

const emit = defineEmits<{
  create: []
}>()
</script>
