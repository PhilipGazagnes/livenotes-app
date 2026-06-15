<template>
  <div v-if="project.contact_enabled" class="bg-gray-800 border-b border-gray-700 px-4 py-3">
    <button
      @click="$emit('open')"
      class="flex items-center gap-3 w-full text-left"
    >
      <!-- Thumbnail -->
      <div class="flex-shrink-0">
        <img
          v-if="project.thumbnail_url"
          :src="project.thumbnail_url"
          :alt="project.name"
          class="w-10 h-10 rounded-full object-cover border border-gray-600"
        />
        <div v-else class="w-10 h-10 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center">
          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
          </svg>
        </div>
      </div>
      <!-- Text -->
      <div class="flex-1 min-w-0">
        <p class="text-sm text-gray-300 leading-snug">
          {{ I18N.PUBLIC_CONTACT.BROUGHT_BY }}
          <strong class="text-white">{{ project.name }}</strong>
        </p>
      </div>
      <!-- CTA -->
      <span class="flex-shrink-0 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium rounded-lg transition-colors whitespace-nowrap">
        {{ I18N.PUBLIC_CONTACT.SEE_CONTACT }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { ContactInfo } from '@/types/database'
import { I18N } from '@/constants/i18n'

interface ProjectPublicInfo {
  name: string
  description: string | null
  thumbnail_url: string | null
  contact_enabled: boolean
  contact_info: ContactInfo | null
}

defineProps<{ project: ProjectPublicInfo }>()
defineEmits<{ open: [] }>()
</script>
