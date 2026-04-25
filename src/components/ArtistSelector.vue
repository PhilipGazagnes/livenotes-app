<template>
  <div class="space-y-3">
    <!-- Selected Artists -->
    <div v-if="selectedArtists.length > 0" class="flex flex-wrap gap-2">
      <div
        v-for="artist in selectedArtists"
        :key="artist.id"
        class="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white text-sm rounded-full"
      >
        <span>{{ artist.name }}</span>
        <button
          @click="removeArtist(artist.id)"
          class="hover:text-gray-200"
          type="button"
        >
          ×
        </button>
      </div>
    </div>

    <!-- Artist Search Input -->
    <div class="relative">
      <input
        v-model="artistSearch"
        type="text"
        class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        placeholder="Search or add artists..."
        @input="handleArtistSearch"
        @keydown.enter.prevent="handleArtistEnter"
      />

      <!-- Artist Search Results Dropdown -->
      <div
        v-if="(artistSearchResults.length > 0 || artistSearch.trim()) && showDropdown"
        class="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto"
      >
        <!-- Existing Artists -->
        <button
          v-for="artist in artistSearchResults"
          :key="artist.id"
          @click="selectArtist(artist)"
          type="button"
          class="w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors text-white"
        >
          {{ artist.name }}
        </button>

        <!-- Create New Artist -->
        <button
          v-if="artistSearch.trim() && !exactArtistMatch"
          @click="createNewArtist"
          type="button"
          class="w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors text-green-400 border-t border-gray-700"
        >
          + Create "{{ artistSearch.trim() }}"
        </button>

        <!-- No Results -->
        <div
          v-if="artistSearchResults.length === 0 && !artistSearch.trim()"
          class="px-4 py-2 text-gray-500 text-sm"
        >
          Start typing to search artists...
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useGlobalSongsStore } from '@/stores/globalSongs'
import type { ArtistV2 } from '@/types/database'

interface Props {
  modelValue: string[] // Array of artist IDs
}

interface Emits {
  (e: 'update:modelValue', value: string[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const globalSongsStore = useGlobalSongsStore()

const artistSearch = ref('')
const artistSearchResults = ref<ArtistV2[]>([])
const selectedArtists = ref<ArtistV2[]>([])
const showDropdown = ref(false)
const isSearching = ref(false)

let searchTimeout: ReturnType<typeof setTimeout> | null = null

// Check if search query exactly matches an existing result
const exactArtistMatch = computed(() => {
  const query = artistSearch.value.trim().toLowerCase()
  return artistSearchResults.value.some(a => a.name.toLowerCase() === query)
})

// Watch for external changes to modelValue
watch(() => props.modelValue, async (newIds) => {
  if (newIds.length === 0) {
    selectedArtists.value = []
    return
  }

  // Load full artist objects for selected IDs
  // (In a real app, you might want to cache these or fetch them differently)
  const artists = []
  for (const id of newIds) {
    const results = await globalSongsStore.searchArtists('')
    const artist = results.find(a => a.id === id)
    if (artist) artists.push(artist)
  }
  selectedArtists.value = artists
}, { immediate: true })

function handleArtistSearch() {
  showDropdown.value = true

  // Clear previous timeout
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  // Debounce search
  searchTimeout = setTimeout(async () => {
    await performArtistSearch()
  }, 200)
}

async function performArtistSearch() {
  const query = artistSearch.value.trim()

  if (!query) {
    artistSearchResults.value = []
    return
  }

  isSearching.value = true

  try {
    const results = await globalSongsStore.searchArtists(query)
    // Filter out already selected artists
    artistSearchResults.value = results.filter(
      a => !props.modelValue.includes(a.id)
    )
  } catch (err) {
    console.error('Artist search error:', err)
    artistSearchResults.value = []
  } finally {
    isSearching.value = false
  }
}

function selectArtist(artist: ArtistV2) {
  selectedArtists.value.push(artist)
  emit('update:modelValue', [...props.modelValue, artist.id])
  artistSearch.value = ''
  artistSearchResults.value = []
  showDropdown.value = false
}

function removeArtist(artistId: string) {
  selectedArtists.value = selectedArtists.value.filter(a => a.id !== artistId)
  emit('update:modelValue', props.modelValue.filter(id => id !== artistId))
}

async function createNewArtist() {
  const name = artistSearch.value.trim()

  if (!name) return

  try {
    const newArtist = await globalSongsStore.createArtist(name)
    selectArtist(newArtist)
  } catch (err) {
    console.error('Create artist error:', err)
  }
}

async function handleArtistEnter() {
  const query = artistSearch.value.trim()

  if (!query) return

  // If there's an exact match, select it
  if (exactArtistMatch.value) {
    const artist = artistSearchResults.value.find(
      a => a.name.toLowerCase() === query.toLowerCase()
    )
    if (artist) {
      selectArtist(artist)
    }
    return
  }

  // Otherwise, create new artist
  await createNewArtist()
}

// Close dropdown when clicking outside
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.relative')) {
    showDropdown.value = false
  }
}

// Add click outside listener
if (typeof window !== 'undefined') {
  document.addEventListener('click', handleClickOutside)
}
</script>
