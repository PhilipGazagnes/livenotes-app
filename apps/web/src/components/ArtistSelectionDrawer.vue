<template>
  <div class="flex-shrink-0 bg-gray-800 border-b border-gray-700 p-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold text-white">{{ I18N.FORM.ARTISTS }}</h2>
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
    <div v-if="chips.length > 0" class="flex flex-wrap gap-2">
      <div
        v-for="(chip, index) in chips"
        :key="`${chip}-${index}`"
        data-testid="artist-chip"
        class="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white text-sm rounded-full"
      >
        <span>{{ chip }}</span>
        <button @click="removeChip(index)" type="button" class="hover:text-gray-200">×</button>
      </div>
    </div>

    <input
      ref="inputRef"
      v-model="query"
      type="text"
      data-testid="artist-search-input"
      class="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
      :placeholder="I18N.PLACEHOLDERS.SEARCH_OR_ADD_ARTISTS"
      @input="handleInput"
    />

    <div class="space-y-1">
      <button
        v-for="artist in suggestions"
        :key="artist.name"
        type="button"
        data-testid="artist-suggestion"
        @click="addChip(artist.name)"
        class="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors text-white"
      >
        {{ artist.name }}
      </button>

      <button
        v-if="query.trim()"
        type="button"
        data-testid="artist-continue-raw"
        @click="continueWithRaw"
        class="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors text-blue-400"
      >
        {{ I18N.BUTTONS.CONTINUE_WITH(query.trim()) }}
      </button>
    </div>
  </div>

  <div class="flex-shrink-0 p-4 border-t border-gray-700">
    <button
      @click="confirm"
      type="button"
      data-testid="artist-selection-ok"
      class="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
    >
      {{ I18N.BUTTONS.OK }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useDrawerStore } from '@/stores/drawer'
import { searchArtistNames, type ArtistSuggestion } from '@/services/songSearchService'
import { I18N } from '@/constants/i18n'
import { logger } from '@/utils/logger'

const props = defineProps<{
  initialChips: string[]
  onConfirm: (chips: string[]) => void
}>()

const drawerStore = useDrawerStore()

const chips = ref<string[]>([...props.initialChips])
const query = ref('')
const suggestions = ref<ArtistSuggestion[]>([])
const inputRef = ref<HTMLInputElement | null>(null)

let searchTimeout: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
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
  try {
    const results = await searchArtistNames(q)
    const chipNamesLower = chips.value.map(c => c.toLowerCase())
    suggestions.value = results.filter(a => !chipNamesLower.includes(a.name.toLowerCase()))
  } catch (err) {
    logger.error('Artist search error:', err)
    suggestions.value = []
  }
}

function addChip(name: string) {
  if (!chips.value.some(c => c.toLowerCase() === name.toLowerCase())) {
    chips.value.push(name)
  }
  query.value = ''
  suggestions.value = []
  nextTick(() => inputRef.value?.focus())
}

function continueWithRaw() {
  addChip(query.value.trim())
}

function removeChip(index: number) {
  chips.value.splice(index, 1)
}

function confirm() {
  drawerStore.pop()
  props.onConfirm(chips.value)
}
</script>
