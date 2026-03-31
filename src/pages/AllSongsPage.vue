<template>
  <ion-page>
    <ion-content class="bg-gray-900">
      <!-- Header -->
      <AppHeader :title="I18N.PAGE_TITLES.ALL_SONGS">
        <template #action>
          <router-link :to="ROUTES.SONG_NEW" class="p-2 text-white hover:text-gray-300 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
          </router-link>
        </template>
      </AppHeader>

      <!-- Loading State -->
      <div v-if="songsStore.isLoading" class="flex items-center justify-center py-20">
        <LoadingSpinner />
      </div>

      <!-- Empty State -->
      <div v-else-if="!songsStore.isLoading && songsStore.songCount === 0" class="text-center py-12 px-4">
        <svg class="w-24 h-24 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
        </svg>
        <h2 class="text-xl font-semibold text-white mb-2">{{ MESSAGES.EMPTY_NO_SONGS }}</h2>
        <p class="text-gray-400 mb-6">{{ MESSAGES.EMPTY_NO_SONGS_SUBTITLE }}</p>
        
        <router-link
          :to="ROUTES.SONG_NEW"
          class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          {{ I18N.EMPTY_STATES.NO_SONGS.CTA }}
        </router-link>
      </div>

      <!-- Song List -->
      <div v-else class="pb-24">
        <div class="p-4 space-y-3">
          <SongCard
            v-for="song in displayedSongs"
            :key="song.id"
            :song="song"
          />
        </div>
      </div>

      <!-- Sticky Search Bar -->
      <div class="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4 z-10">
        <div class="max-w-2xl mx-auto">
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="I18N.PLACEHOLDERS.SEARCH_SONGS"
              class="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { IonPage, IonContent } from '@ionic/vue'
import { useSongsStore } from '@/stores/songs'
import { useAuthStore } from '@/stores/auth'
import AppHeader from '@/components/AppHeader.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import SongCard from '@/components/SongCard.vue'
import { ROUTES } from '@/constants/routes'
import { MESSAGES } from '@/constants/messages'
import { I18N } from '@/constants/i18n'

const songsStore = useSongsStore()
const authStore = useAuthStore()

const searchQuery = ref('')

const displayedSongs = computed(() => {
  if (!searchQuery.value.trim()) {
    return songsStore.songs
  }
  
  const query = searchQuery.value.toLowerCase()
  return songsStore.songs.filter(song => 
    song.title.toLowerCase().includes(query) ||
    song.artist?.toLowerCase().includes(query) ||
    song.livenotes_poc_id?.toLowerCase().includes(query) ||
    song.notes?.toLowerCase().includes(query)
  )
})

onMounted(async () => {
  // Ensure auth is initialized first
  if (!authStore.isInitialized) {
    await authStore.initialize()
  }
  
  // Fetch user's personal project and songs
  const personalProjectId = await authStore.getPersonalProjectId()
  
  if (personalProjectId) {
    await songsStore.fetchSongs(personalProjectId)
  }
})
</script>
