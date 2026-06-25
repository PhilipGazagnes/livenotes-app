<template>
  <!-- Header -->
  <div class="flex-shrink-0 bg-gray-800 border-b border-gray-700 p-4">
    <div class="flex items-start justify-between">
      <div class="flex-1 min-w-0 mr-3">
        <h2 class="text-xl font-semibold text-white truncate mb-1">
          {{ librarySong?.custom_title || librarySong?.song?.title || 'Song Notes' }}
        </h2>
        <p v-if="librarySong?.song?.artists && librarySong.song.artists.length > 0" class="text-sm text-gray-400 truncate">
          {{ librarySong.song.artists.map(a => a.name).join(', ') }}
        </p>
      </div>
      <button
        @click="drawerStore.pop()"
        :aria-label="I18N.ARIA.CLOSE"
        class="flex-shrink-0 p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  </div>

  <NoteList
    :notes="sortedNotes"
    :is-loading="isLoading"
    @note-opened="openNote"
    @lyrics-opened="openLyrics"
  />

  <!-- Footer -->
  <div v-if="authStore.isEditor" class="flex-shrink-0 bg-gray-800 border-t border-gray-700 p-4">
    <button
      @click="openNoteCreation"
      class="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
      </svg>
      {{ I18N.NOTES.ADD_NOTE }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useDrawerStore } from '@/stores/drawer'
import { useAuthStore } from '@/stores/auth'
import { fetchLibrarySongWithDetails } from '@/services/libraryService'
import type { LibrarySongWithDetails, LivenotesJson, Note } from '@/types/database'
import NoteList from './NoteList.vue'
import NoteContentDrawer from './NoteContentDrawer.vue'
import NoteCreationDrawer from './NoteCreationDrawer.vue'
import SongcodeLyricsDrawer from './SongcodeLyricsDrawer.vue'
import { I18N } from '@/constants/i18n'

const props = defineProps<{ librarySongId: string }>()

const drawerStore = useDrawerStore()
const authStore = useAuthStore()

const librarySong = ref<LibrarySongWithDetails | null>(null)
const isLoading = ref(true)

onMounted(async () => { await refresh() })

async function refresh() {
  isLoading.value = true
  try {
    librarySong.value = await fetchLibrarySongWithDetails(props.librarySongId)
  } catch {
    // data unavailable (offline with no cache, or network error)
  } finally {
    isLoading.value = false
  }
}

const sortedNotes = computed(() => {
  if (!librarySong.value?.notes) return []
  return [...librarySong.value.notes].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
})

function openNote(note: Note) {
  drawerStore.push(NoteContentDrawer, { note, librarySongId: props.librarySongId, onNoteChanged: refresh })
}

function openNoteCreation() {
  drawerStore.push(NoteCreationDrawer, { librarySongId: props.librarySongId, onSaved: refresh })
}

function openLyrics(note: Note) {
  const data = note.data as ({ livenotes_json?: LivenotesJson } | null)
  const livenotesJson = data?.livenotes_json ?? null
  drawerStore.push(SongcodeLyricsDrawer, { livenotesJson })
}
</script>
