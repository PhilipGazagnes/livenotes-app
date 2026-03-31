<template>
  <header class="sticky top-0 z-50 bg-gray-900 border-b border-gray-800">
    <div class="flex items-center justify-between px-4 py-3">
      <!-- Left: Hamburger Menu Icon -->
      <button
        @click="openMenu"
        class="p-2 -ml-2 text-gray-300 hover:text-white transition-colors"
        :aria-label="I18N.ARIA.MENU"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>

      <!-- Center: Title -->
      <h1 class="text-xl font-bold text-white">{{ title }}</h1>

      <!-- Right: Action Button Slot -->
      <div class="w-10">
        <slot name="action" />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useUiStore } from '@/stores/ui'
import { I18N } from '@/constants/i18n'

defineProps<{
  title: string
}>()

const uiStore = useUiStore()

function openMenu() {
  uiStore.openHamburgerMenu()
}
</script>
