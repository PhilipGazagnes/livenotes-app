<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
    @click.self="emit('close')"
  >
    <div class="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <h3 class="text-xl font-semibold text-white mb-4">{{ I18N.MODALS.ADD_SONG_TO_LIBRARY }}</h3>

      <!-- Search Input -->
      <div class="mb-4">
        <label for="song-search" class="block text-sm font-medium text-gray-300 mb-2">
          {{ I18N.MODALS.SEARCH_FOR_SONG }}
        </label>
        <input
          id="song-search"
          v-model="searchQuery"
          type="text"
          class="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          :placeholder="I18N.PLACEHOLDERS.SEARCH_SONGS"
          autofocus
          @input="handleSearchInput"
        />
      </div>

      <!-- Search Results / Duplicates -->
      <div v-if="searchResults.length > 0" class="mb-6">
        <p class="text-sm text-gray-400 mb-3">
          {{ I18N.PLURALS.SONG_COUNT_FOUND(searchResults.length) }}
        </p>
        <div class="space-y-2 max-h-64 overflow-y-auto">
          <div
            v-for="song in searchResults"
            :key="song.id"
            class="flex items-center justify-between p-3 bg-gray-900 rounded-lg hover:bg-gray-750 transition-colors"
          >
            <div class="flex-1">
              <p class="text-white font-medium">{{ song.title }}</p>
              <p v-if="song.artists.length > 0" class="text-sm text-gray-400">
                {{ song.artists.map(a => a.name).join(', ') }}
              </p>
              <p class="text-xs text-gray-500 mt-1">
                {{ I18N.PLURALS.ADDED_COUNT(song.popularity_score ?? 0) }}
              </p>
            </div>
            <button
              @click="addExistingSong(song)"
              :disabled="isLoading"
              class="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ I18N.BUTTONS.ADD_TO_LIBRARY }}
            </button>
          </div>
        </div>
      </div>

      <!-- No Results / Create New -->
      <div v-if="searchQuery.trim() && searchResults.length === 0 && !isSearching" class="mb-6">
        <p class="text-sm text-gray-400 mb-4">
          {{ I18N.EMPTY_STATES.NO_SONGS_FOUND_CREATE }}
        </p>

        <div class="bg-gray-900 rounded-lg p-4 space-y-4">
          <div>
            <label for="new-song-title" class="block text-sm font-medium text-gray-300 mb-2">
              {{ I18N.FORM.SONG_TITLE }} <span class="text-red-400">{{ I18N.FORM.REQUIRED }}</span>
            </label>
            <input
              id="new-song-title"
              v-model="newSongTitle"
              type="text"
              class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              :placeholder="searchQuery || I18N.PLACEHOLDERS.SONG_TITLE"
            />
          </div>

          <div>
            <label for="new-song-artists" class="block text-sm font-medium text-gray-300 mb-2">
              {{ I18N.NAVIGATION.ARTISTS }}
            </label>
            <ArtistSelector v-model="selectedArtistIds" />
          </div>

          <button
            @click="createAndAddNewSong"
            :disabled="isLoading || !newSongTitle.trim()"
            class="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <span v-if="isLoading">{{ I18N.LOADING.CREATING }}</span>
            <span v-else>{{ I18N.BUTTONS.CREATE_AND_ADD }}</span>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isSearching" class="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>

      <!-- Error Message -->
      <p v-if="errorMessage" class="text-sm text-red-400 mb-4">
        {{ errorMessage }}
      </p>

      <!-- Close Button -->
      <div class="mt-6">
        <button
          @click="emit('close')"
          class="w-full px-6 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
        >
          {{ I18N.BUTTONS.CANCEL }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useGlobalSongsStore } from '@/stores/globalSongs'
import { useLibraryStore } from '@/stores/library'
import type { SongV2WithArtists } from '@/types/database'
import { MESSAGES } from '@/constants/messages'
import { I18N } from '@/constants/i18n'
import { useUiStore } from '@/stores/ui'
import ArtistSelector from './ArtistSelector.vue'
import LoadingSpinner from './LoadingSpinner.vue'

interface Props {
  isOpen: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'songAdded'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const globalSongsStore = useGlobalSongsStore()
const libraryStore = useLibraryStore()
const uiStore = useUiStore()

const searchQuery = ref('')
const searchResults = ref<SongV2WithArtists[]>([])
const isSearching = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

// New song creation
const newSongTitle = ref('')
const selectedArtistIds = ref<string[]>([])

let searchTimeout: ReturnType<typeof setTimeout> | null = null

// Watch for modal open/close to reset state
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    resetForm()
  }
})

// Pre-fill new song title with search query
watch(searchQuery, (query) => {
  if (query.trim()) {
    newSongTitle.value = query.trim()
  }
})

function resetForm() {
  searchQuery.value = ''
  searchResults.value = []
  newSongTitle.value = ''
  selectedArtistIds.value = []
  errorMessage.value = ''
  isSearching.value = false
  isLoading.value = false
}

function handleSearchInput() {
  // Clear previous timeout
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  // Debounce search
  searchTimeout = setTimeout(() => {
    performSearch()
  }, 300)
}

async function performSearch() {
  const query = searchQuery.value.trim()

  if (!query) {
    searchResults.value = []
    return
  }

  isSearching.value = true
  errorMessage.value = ''

  try {
    const results = await globalSongsStore.searchSongs(query)
    searchResults.value = results
  } catch (err) {
    errorMessage.value = I18N.TOAST.SEARCH_SONGS_FAILED
    console.error('Search error:', err)
  } finally {
    isSearching.value = false
  }
}

async function addExistingSong(song: SongV2WithArtists) {
  isLoading.value = true
  errorMessage.value = ''

  try {
    await libraryStore.addToLibrary(song.id)
    uiStore.showToast(MESSAGES.SUCCESS.SONG_ADDED_TO_LIBRARY, 'success')
    emit('songAdded')
    emit('close')
  } catch (err: any) {
    if (err?.message?.includes('unique') || err?.code === '23505') {
      errorMessage.value = MESSAGES.ERROR.SONG_ALREADY_IN_LIBRARY
    } else {
      errorMessage.value = I18N.TOAST.ADD_TO_LIBRARY_FAILED
    }
    console.error('Add to library error:', err)
  } finally {
    isLoading.value = false
  }
}

async function createAndAddNewSong() {
  const title = newSongTitle.value.trim()

  if (!title) {
    errorMessage.value = MESSAGES.ERROR.TITLE_REQUIRED
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    // 1. Create the song in the global catalog
    const newSong = await globalSongsStore.createSong(title, selectedArtistIds.value)

    // 2. Add to library
    await libraryStore.addToLibrary(newSong.id)

    uiStore.showToast(MESSAGES.SUCCESS.SONG_CREATED, 'success')
    emit('songAdded')
    emit('close')
  } catch (err) {
    errorMessage.value = I18N.TOAST.CREATE_SONG_FAILED
    console.error('Create song error:', err)
  } finally {
    isLoading.value = false
  }
}
</script>
