<template>
  <!-- Header -->
  <div class="flex-shrink-0 bg-gray-800 border-b border-gray-700 p-4">
    <div class="flex items-start justify-between">
      <div class="flex-1 min-w-0 mr-3">
        <h2 class="text-xl font-semibold text-white truncate mb-1">
          {{ librarySong?.custom_title || librarySong?.song?.title || '...' }}
        </h2>
        <p v-if="librarySong?.song?.artists?.length" class="text-sm text-gray-400 truncate">
          {{ librarySong.song.artists.map(a => a.name).join(', ') }}
        </p>
      </div>
      <button
        @click="drawerStore.pop()"
        class="flex-shrink-0 p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  </div>

  <!-- Loading -->
  <div v-if="isLoading" class="flex-1 flex items-center justify-center">
    <div class="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
  </div>

  <!-- No lyrics -->
  <div v-else-if="!lyricsNote" class="flex-1 flex flex-col items-center justify-center px-4 text-center gap-3">
    <svg class="w-16 h-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
    </svg>
    <p class="text-gray-400">No lyrics for this song</p>
  </div>

  <!-- Structured lyrics (songcode with livenotes_json) -->
  <SongcodeLyricsContent
    v-else-if="livenotesJson"
    :livenotesJson="livenotesJson"
    :show-pattern="false"
    :default-font-size="settingsStore.lyricsDefaultFontSize"
  />

  <!-- Fallback: plain text -->
  <div v-else class="flex-1 overflow-y-auto p-4">
    <p class="text-gray-200 whitespace-pre-wrap break-words text-sm leading-relaxed">{{ lyricsNote.content }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDrawerStore } from '@/stores/drawer'
import { useSettingsStore } from '@/stores/settings'
import { fetchLibrarySongWithDetails } from '@/services/libraryService'
import type { LibrarySongWithDetails, Note, SongcodeNoteData, LivenotesJson } from '@/types/database'
import SongcodeLyricsContent from './SongcodeLyricsContent.vue'

const props = defineProps<{ librarySongId: string }>()

const drawerStore = useDrawerStore()
const settingsStore = useSettingsStore()
const librarySong = ref<LibrarySongWithDetails | null>(null)
const isLoading = ref(true)

const lyricsNote = computed((): Note | null => {
  if (!librarySong.value?.notes) return null
  return [...librarySong.value.notes]
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
    .find(n => n.type === 'songcode' || n.type === 'lyrics') ?? null
})

const livenotesJson = computed((): LivenotesJson | null => {
  if (lyricsNote.value?.type !== 'songcode') return null
  return (lyricsNote.value.data as SongcodeNoteData)?.livenotes_json ?? null
})

onMounted(async () => {
  try {
    librarySong.value = await fetchLibrarySongWithDetails(props.librarySongId)
  } finally {
    isLoading.value = false
  }
})
</script>
