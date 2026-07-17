<template>
  <div class="flex-shrink-0 bg-gray-800 border-b border-gray-700 p-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold text-white">{{ I18N.MODALS.ADD_SONG_TO_LIBRARY }}</h2>
      <button
        @click="drawerStore.pop()"
        class="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
        :aria-label="I18N.ARIA.CLOSE"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  </div>

  <div class="flex-1 overflow-y-auto p-4 space-y-4">
    <div>
      <label class="block text-sm font-medium text-gray-300 mb-2">{{ I18N.MODALS.SONG_NAME }}</label>
      <button
        @click="openSongNameDrawer"
        type="button"
        data-testid="song-name-btn"
        class="w-full text-left px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white hover:border-gray-600 transition-colors"
      >
        <span v-if="songTitle">{{ songTitle }}</span>
        <span v-else class="text-gray-500">{{ I18N.PLACEHOLDERS.SONG_TITLE }}</span>
      </button>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-300 mb-2">{{ I18N.FORM.ARTISTS }}</label>
      <button
        @click="openArtistSelectionDrawer"
        type="button"
        data-testid="artist-btn"
        class="w-full text-left px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white hover:border-gray-600 transition-colors"
      >
        <span v-if="artistNames.length > 0">{{ artistNames.join(', ') }}</span>
        <span v-else class="text-gray-500">{{ I18N.PLACEHOLDERS.SEARCH_OR_ADD_ARTISTS }}</span>
      </button>
    </div>

    <p v-if="isDuplicate" data-testid="duplicate-warning" class="text-sm text-red-400">{{ MESSAGES.ERROR.SONG_ALREADY_IN_LIBRARY }}</p>
    <p v-if="errorMessage" class="text-sm text-red-400">{{ errorMessage }}</p>
  </div>

  <div class="flex-shrink-0 p-4 border-t border-gray-700">
    <button
      @click="handleAddToLibrary"
      :disabled="!canSubmit || isSubmitting"
      data-testid="add-to-library-btn"
      class="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
    >
      <svg v-if="isSubmitting" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
      {{ isSubmitting ? I18N.LOADING.SAVING : I18N.BUTTONS.ADD_TO_LIBRARY }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDrawerStore } from '@/stores/drawer'
import { useGlobalSongsStore } from '@/stores/globalSongs'
import { useLibraryStore } from '@/stores/library'
import { useUiStore } from '@/stores/ui'
import { useSettingsStore } from '@/stores/settings'
import { I18N } from '@/constants/i18n'
import { MESSAGES } from '@/constants/messages'
import { normalizeText } from '@/utils/validation'
import SongNameSearchDrawer from './SongNameSearchDrawer.vue'
import ArtistDeductionDrawer from './ArtistDeductionDrawer.vue'
import ArtistSelectionDrawer from './ArtistSelectionDrawer.vue'
import SongNotesDrawer from './SongNotesDrawer.vue'
import LiveLyricsDrawer from './LiveLyricsDrawer.vue'

const drawerStore = useDrawerStore()
const globalSongsStore = useGlobalSongsStore()
const libraryStore = useLibraryStore()
const uiStore = useUiStore()
const settingsStore = useSettingsStore()

const songTitle = ref('')
const artistNames = ref<string[]>([])
const isSubmitting = ref(false)
const errorMessage = ref('')

const isDuplicate = computed(() => {
  const title = normalizeText(songTitle.value).toLowerCase()
  if (!title) return false
  const artists = [...artistNames.value].map(a => normalizeText(a).toLowerCase()).sort()
  return libraryStore.librarySongs.some(ls => {
    if (ls.song.title.trim().toLowerCase() !== title) return false
    const existing = (ls.song.artists ?? []).map(a => a.name.toLowerCase()).sort()
    return existing.length === artists.length && existing.every((name, i) => name === artists[i])
  })
})

const canSubmit = computed(() => songTitle.value.trim() !== '' && !isDuplicate.value)

function openSongNameDrawer() {
  drawerStore.push(SongNameSearchDrawer, {
    initialQuery: songTitle.value,
    onSelectSuggestion: (title: string, artistSets: string[][]) => {
      songTitle.value = title
      if (artistSets.length > 0) openArtistDeductionDrawer(artistSets)
    },
    onContinueWithRaw: (rawQuery: string) => {
      songTitle.value = rawQuery
    },
  })
}

function openArtistDeductionDrawer(artistSets: string[][]) {
  drawerStore.push(ArtistDeductionDrawer, {
    artistSets,
    currentArtists: [...artistNames.value],
    onPickArtistSet: (set: string[]) => {
      artistNames.value = set
    },
    onChooseAnother: openArtistSelectionDrawer,
  })
}

function openArtistSelectionDrawer() {
  drawerStore.push(ArtistSelectionDrawer, {
    initialChips: [...artistNames.value],
    onConfirm: (chips: string[]) => {
      artistNames.value = chips
    },
  })
}

async function handleAddToLibrary() {
  if (!canSubmit.value || isSubmitting.value) return
  isSubmitting.value = true
  errorMessage.value = ''
  try {
    const artistIds: string[] = []
    for (const name of artistNames.value) {
      const artist = await globalSongsStore.getOrCreateArtist(name)
      artistIds.push(artist.id)
    }

    const { song, created } = await globalSongsStore.getOrCreateSong(songTitle.value, artistIds)
    const librarySong = await libraryStore.addToLibrary(song.id)

    uiStore.showToast(
      created ? MESSAGES.SUCCESS.SONG_CREATED : MESSAGES.SUCCESS.SONG_ADDED_TO_LIBRARY,
      'success'
    )

    drawerStore.pop()
    const drawer = settingsStore.songClickShowsLyrics ? LiveLyricsDrawer : SongNotesDrawer
    drawerStore.push(drawer, { librarySongId: librarySong.id })
  } catch (err) {
    uiStore.showErrorToast('add song to library', err as Error)
  } finally {
    isSubmitting.value = false
  }
}
</script>
