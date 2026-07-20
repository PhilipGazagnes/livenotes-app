<template>
  <div class="flex-shrink-0 bg-gray-800 border-b border-gray-700 p-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold text-white">{{ I18N.MODALS.SONG_NAME }}</h2>
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

  <div class="flex-1 overflow-y-auto p-4 space-y-2">
    <input
      ref="inputRef"
      v-model="query"
      type="text"
      data-testid="song-name-input"
      class="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
      :placeholder="I18N.PLACEHOLDERS.SEARCH_SONGS"
      @input="handleInput"
    />

    <div v-if="isSearching" class="flex items-center justify-center py-8">
      <BaseLoadingSpinner />
    </div>

    <div v-else class="space-y-1">
      <button
        v-for="suggestion in suggestions"
        :key="suggestion.title"
        type="button"
        data-testid="song-suggestion"
        @click="selectSuggestion(suggestion)"
        class="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors text-white notranslate"
        translate="no"
      >
        {{ suggestion.title }}
      </button>

      <button
        v-if="query.trim()"
        type="button"
        data-testid="song-continue-raw"
        @click="continueWithRaw"
        class="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors text-blue-400"
      >
        {{ I18N.BUTTONS.CONTINUE_WITH(query.trim()) }}
      </button>
    </div>

    <p v-if="errorMessage" class="text-sm text-red-400">{{ errorMessage }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDrawerStore } from '@/stores/drawer'
import { I18N } from '@/constants/i18n'
import { searchSongTitles, type SongTitleSuggestion } from '@/services/songSearchService'
import BaseLoadingSpinner from './BaseLoadingSpinner.vue'
import { logger } from '@/utils/logger'

const props = defineProps<{
  initialQuery?: string
  onSelectSuggestion: (title: string, artistSets: string[][]) => void
  onContinueWithRaw: (rawQuery: string) => void
}>()

const drawerStore = useDrawerStore()

const query = ref(props.initialQuery ?? '')
const suggestions = ref<SongTitleSuggestion[]>([])
const isSearching = ref(false)
const errorMessage = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

let searchTimeout: ReturnType<typeof setTimeout> | null = null

onMounted(async () => {
  if (query.value.trim()) await performSearch()
  // Delay focus until the drawer's slide-in transition finishes — focusing
  // immediately opens the mobile keyboard mid-transition and causes jank.
  setTimeout(() => inputRef.value?.focus(), 300)
})

function handleInput() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(performSearch, 300)
}

async function performSearch() {
  const q = query.value.trim()
  if (!q) {
    suggestions.value = []
    return
  }
  isSearching.value = true
  errorMessage.value = ''
  try {
    suggestions.value = await searchSongTitles(q)
  } catch (err) {
    errorMessage.value = I18N.TOAST.SEARCH_SONGS_FAILED
    logger.error('Song title search error:', err)
    suggestions.value = []
  } finally {
    isSearching.value = false
  }
}

function selectSuggestion(suggestion: SongTitleSuggestion) {
  drawerStore.pop()
  props.onSelectSuggestion(suggestion.title, suggestion.artistSets)
}

function continueWithRaw() {
  drawerStore.pop()
  props.onContinueWithRaw(query.value.trim())
}
</script>
