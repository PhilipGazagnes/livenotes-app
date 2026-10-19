<template>
  <div
    v-if="showUpdateBanner"
    role="status"
    class="fixed bottom-4 left-1/2 -translate-x-1/2 z-60 flex items-center gap-3 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg shadow-lg text-sm text-gray-200"
  >
    <span>{{ I18N.APP_UPDATE.AVAILABLE }}</span>
    <button
      @click="reloadApp"
      class="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
    >
      {{ I18N.APP_UPDATE.RELOAD }}
    </button>
    <button
      @click="dismissUpdateBanner"
      class="p-1 text-gray-500 hover:text-white transition-colors"
      :aria-label="I18N.APP_UPDATE.DISMISS"
      :title="I18N.APP_UPDATE.DISMISS"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
// Closing hides the banner for a day (ADR-015); "Reload app" stays in the project menu
import { showUpdateBanner, reloadApp, dismissUpdateBanner } from '@/lib/appUpdates'
import { I18N } from '@/constants/i18n'
</script>
