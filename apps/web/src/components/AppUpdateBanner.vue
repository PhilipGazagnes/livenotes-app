<template>
  <div
    v-if="updateAvailable"
    role="status"
    class="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg shadow-lg text-sm text-gray-200"
  >
    <span>{{ I18N.APP_UPDATE.AVAILABLE }}</span>
    <button
      @click="reloadApp"
      class="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
    >
      {{ I18N.APP_UPDATE.RELOAD }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { updateAvailable, reloadApp } from '@/lib/appUpdates'
import { I18N } from '@/constants/i18n'
</script>
