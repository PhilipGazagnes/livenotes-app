<template>
  <div
    v-if="show"
    :class="[
      'flex items-center justify-center',
      overlay ? 'fixed inset-0 z-[400] bg-black/30' : ''
    ]"
  >
    <div class="relative">
      <!-- Spinner -->
      <div
        :class="[
          'inline-block rounded-full border-4 border-gray-700 border-t-blue-500 animate-spin',
          size === 'sm' ? 'w-6 h-6' : size === 'md' ? 'w-10 h-10' : 'w-16 h-16'
        ]"
      ></div>
      
      <!-- Optional Text -->
      <p v-if="text" class="mt-4 text-gray-300 text-center">{{ text }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    show?: boolean
    size?: 'sm' | 'md' | 'lg'
    overlay?: boolean
    text?: string
  }>(),
  {
    show: true,
    size: 'md',
    overlay: false,
  }
)
</script>
