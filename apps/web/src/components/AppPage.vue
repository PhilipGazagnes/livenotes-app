<template>
  <!-- Full-screen page with its own scroll container (replaced Ionic's ion-page + ion-content, ADR-003) -->
  <div class="absolute inset-0 flex flex-col bg-gray-900">
    <div ref="scrollElement" class="flex-1 overflow-y-auto overscroll-contain">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const scrollElement = ref<HTMLElement | null>(null)

defineExpose({ scrollElement })
</script>
