<template>
  <div 
    class="bg-gray-800 rounded-lg p-4 border border-gray-700 cursor-pointer hover:border-purple-500 transition-colors"
    @click="handleCardClick"
  >
    <div class="flex items-start justify-between gap-3">
      <!-- Artist Info -->
      <div class="flex-1 min-w-0">
        <!-- Artist Name -->
        <h3 class="text-lg font-semibold text-white mb-1 truncate flex items-center gap-2">
          <svg class="w-5 h-5 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
          </svg>
          {{ artist.name }}
        </h3>

        <!-- Song Count -->
        <p class="text-gray-400 text-sm ml-7">
          {{ songCount }} {{ songCount === 1 ? 'song' : 'songs' }}
        </p>
      </div>

      <DropdownMenu :items="dropdownItems" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { ArtistWithCount } from '@/types/database'
import { ROUTES } from '@/constants/routes'
import DropdownMenu from '@/components/DropdownMenu.vue'

const router = useRouter()

const props = defineProps<{
  artist: ArtistWithCount
}>()

const emit = defineEmits<{
  rename: [artist: ArtistWithCount]
  delete: [artist: ArtistWithCount]
}>()

const songCount = props.artist.song_count

const dropdownItems = [
  { label: 'Rename', callback: () => emit('rename', props.artist) },
  { label: 'Delete', variant: 'danger' as const, callback: () => emit('delete', props.artist) },
]

function handleCardClick() {
  router.push({
    path: ROUTES.LIBRARY,
    query: {
      artist: props.artist.id,
      artistName: props.artist.name
    }
  })
}
</script>
