<template>
  <!-- Header -->
  <div class="flex-shrink-0 bg-gray-800 border-b border-gray-700 p-4">
    <div class="flex items-start justify-between">
      <h2 class="text-xl font-semibold text-white">{{ I18N.PUBLIC_CONTACT.CONTACT_CARD_TITLE(project.name) }}</h2>
      <button
        @click="drawerStore.pop()"
        :aria-label="I18N.ARIA.CLOSE"
        class="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  </div>

  <!-- Content -->
  <div class="flex-1 overflow-y-auto p-6">
    <!-- Thumbnail + name -->
    <div class="flex flex-col items-center mb-8">
      <img
        v-if="project.thumbnail_url"
        :src="project.thumbnail_url"
        :alt="project.name"
        class="w-24 h-24 rounded-full object-cover border-2 border-gray-600 mb-4"
      />
      <div v-else class="w-24 h-24 rounded-full bg-gray-700 border-2 border-gray-600 flex items-center justify-center mb-4">
        <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
        </svg>
      </div>
      <h3 class="text-2xl font-bold text-white text-center">{{ project.name }}</h3>
      <p v-if="project.description" class="mt-2 text-sm text-gray-400 text-center leading-relaxed">{{ project.description }}</p>
    </div>

    <!-- Contact fields -->
    <div v-if="hasContactInfo" class="space-y-4 mb-8">
      <a v-if="contact.phone" :href="`tel:${contact.phone}`" class="flex items-center gap-4 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
        <div class="w-9 h-9 bg-green-900/40 rounded-full flex items-center justify-center flex-shrink-0">
          <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
          </svg>
        </div>
        <div>
          <p class="text-xs text-gray-400 uppercase tracking-wide">{{ I18N.SETTINGS.CONTACT_PHONE }}</p>
          <p class="text-white font-medium">{{ contact.phone }}</p>
        </div>
      </a>

      <a v-if="contact.email" :href="`mailto:${contact.email}`" class="flex items-center gap-4 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
        <div class="w-9 h-9 bg-blue-900/40 rounded-full flex items-center justify-center flex-shrink-0">
          <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
        </div>
        <div>
          <p class="text-xs text-gray-400 uppercase tracking-wide">{{ I18N.SETTINGS.CONTACT_EMAIL }}</p>
          <p class="text-white font-medium">{{ contact.email }}</p>
        </div>
      </a>

      <div v-if="contact.location" class="flex items-center gap-4 p-3 bg-gray-800 rounded-lg">
        <div class="w-9 h-9 bg-yellow-900/40 rounded-full flex items-center justify-center flex-shrink-0">
          <svg class="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </div>
        <div>
          <p class="text-xs text-gray-400 uppercase tracking-wide">{{ I18N.SETTINGS.CONTACT_LOCATION }}</p>
          <p class="text-white font-medium">{{ contact.location }}</p>
        </div>
      </div>

      <a v-if="contact.website" :href="contact.website" target="_blank" rel="noopener" class="flex items-center gap-4 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
        <div class="w-9 h-9 bg-purple-900/40 rounded-full flex items-center justify-center flex-shrink-0">
          <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
          </svg>
        </div>
        <div>
          <p class="text-xs text-gray-400 uppercase tracking-wide">{{ I18N.SETTINGS.CONTACT_WEBSITE }}</p>
          <p class="text-white font-medium truncate">{{ contact.website }}</p>
        </div>
      </a>

      <a v-if="contact.facebook" :href="contact.facebook" target="_blank" rel="noopener" class="flex items-center gap-4 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
        <div class="w-9 h-9 bg-blue-900/40 rounded-full flex items-center justify-center flex-shrink-0">
          <svg class="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </div>
        <div>
          <p class="text-xs text-gray-400 uppercase tracking-wide">{{ I18N.SETTINGS.CONTACT_FACEBOOK }}</p>
          <p class="text-white font-medium truncate">{{ contact.facebook }}</p>
        </div>
      </a>

      <a v-if="contact.instagram" :href="contact.instagram" target="_blank" rel="noopener" class="flex items-center gap-4 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
        <div class="w-9 h-9 bg-pink-900/40 rounded-full flex items-center justify-center flex-shrink-0">
          <svg class="w-5 h-5 text-pink-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        </div>
        <div>
          <p class="text-xs text-gray-400 uppercase tracking-wide">{{ I18N.SETTINGS.CONTACT_INSTAGRAM }}</p>
          <p class="text-white font-medium truncate">{{ contact.instagram }}</p>
        </div>
      </a>

      <a v-if="contact.x" :href="contact.x" target="_blank" rel="noopener" class="flex items-center gap-4 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
        <div class="w-9 h-9 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
          <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </div>
        <div>
          <p class="text-xs text-gray-400 uppercase tracking-wide">{{ I18N.SETTINGS.CONTACT_X }}</p>
          <p class="text-white font-medium truncate">{{ contact.x }}</p>
        </div>
      </a>

      <a v-if="contact.youtube" :href="contact.youtube" target="_blank" rel="noopener" class="flex items-center gap-4 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
        <div class="w-9 h-9 bg-red-900/40 rounded-full flex items-center justify-center flex-shrink-0">
          <svg class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        </div>
        <div>
          <p class="text-xs text-gray-400 uppercase tracking-wide">{{ I18N.SETTINGS.CONTACT_YOUTUBE }}</p>
          <p class="text-white font-medium truncate">{{ contact.youtube }}</p>
        </div>
      </a>
    </div>

    <!-- Download vCard -->
    <button
      v-if="hasContactInfo"
      @click="handleDownload"
      class="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
      {{ I18N.PUBLIC_CONTACT.DOWNLOAD_VCARD }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { ContactInfo } from '@/types/database'
import { useDrawerStore } from '@/stores/drawer'
import { downloadVCard } from '@/utils/vcard'
import { I18N } from '@/constants/i18n'
import { computed } from 'vue'

interface ProjectPublicInfo {
  name: string
  description: string | null
  thumbnail_url: string | null
  contact_enabled: boolean
  contact_info: ContactInfo | null
}

const props = defineProps<{ project: ProjectPublicInfo }>()
const drawerStore = useDrawerStore()

const contact = computed(() => props.project.contact_info ?? {})

const hasContactInfo = computed(() =>
  Object.values(contact.value).some(v => v && String(v).trim())
)

function handleDownload() {
  downloadVCard(props.project.name, contact.value)
}
</script>
