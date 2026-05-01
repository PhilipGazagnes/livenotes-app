<template>
  <div class="relative">
    <!-- Input Field -->
    <div class="relative">
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="placeholder"
        class="w-full px-4 py-3 bg-gray-900 border rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        :class="error ? 'border-red-500' : 'border-gray-700'"
        @input="handleInput"
        @focus="showDropdown = true"
        @keydown.down.prevent="navigateDown"
        @keydown.up.prevent="navigateUp"
        @keydown.enter.prevent="selectHighlighted"
        @keydown.escape="closeDropdown"
      />
      
      <!-- Clear Button -->
      <button
        v-if="selectedArtist"
        @click="handleClearSelection"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
        type="button"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <!-- Error Message -->
    <p v-if="error" class="mt-1 text-sm text-red-400">
      {{ error }}
    </p>

    <!-- Dropdown Suggestions -->
    <div
      v-if="showDropdown && (filteredArtists.length > 0 || canCreateNew)"
      class="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto"
    >
      <!-- Existing Artists -->
      <button
        v-for="(artist, index) in filteredArtists"
        :key="artist.id"
        type="button"
        @click="handleSelectArtist(artist)"
        @mouseenter="highlightedIndex = index"
        class="w-full px-4 py-3 text-left text-gray-300 hover:bg-gray-700 transition-colors flex items-center gap-2"
        :class="{ 'bg-gray-700': highlightedIndex === index }"
      >
        <svg class="w-4 h-4 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
        </svg>
        <span>{{ artist.name }}</span>
      </button>

      <!-- Create New Option -->
      <button
        v-if="canCreateNew"
        type="button"
        @click="handleCreateNewArtist"
        @mouseenter="highlightedIndex = filteredArtists.length"
        class="w-full px-4 py-3 text-left text-blue-400 hover:bg-gray-700 transition-colors flex items-center gap-2 border-t border-gray-700"
        :class="{ 'bg-gray-700': highlightedIndex === filteredArtists.length }"
      >
        <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        <span>Create new: <strong>{{ searchQuery.trim() }}</strong></span>
      </button>
    </div>

    <!-- Click Outside to Close -->
    <div
      v-if="showDropdown"
      class="fixed inset-0 z-0"
      @click="closeDropdown"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useArtistsStore } from '@/stores/artists'
import type { Artist } from '@/types/database'

const props = defineProps<{
  modelValue: string | null  // artist ID
  placeholder?: string
  error?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
  'artistCreated': [artist: Artist]
}>()

const artistsStore = useArtistsStore()

const searchQuery = ref('')
const showDropdown = ref(false)
const highlightedIndex = ref(0)
const selectedArtist = ref<Artist | null>(null)

// Initialize with existing artist if provided
watch(() => props.modelValue, (newVal) => {
  if (newVal && !selectedArtist.value) {
    const artist = artistsStore.getArtistById(newVal)
    if (artist) {
      selectedArtist.value = artist
      searchQuery.value = artist.name
    }
  } else if (!newVal) {
    selectedArtist.value = null
    searchQuery.value = ''
  }
}, { immediate: true })

// Filtered artists based on search query
const filteredArtists = computed(() => {
  if (!searchQuery.value.trim()) return []
  return artistsStore.searchArtists(searchQuery.value, 5)
})

// Can create new artist if query doesn't match any existing (case-insensitive)
const canCreateNew = computed(() => {
  const query = searchQuery.value.trim()
  if (!query) return false
  
  const exactMatch = artistsStore.findExactMatch(query)
  return !exactMatch
})

function handleInput() {
  // Clear selection when user types
  if (selectedArtist.value) {
    selectedArtist.value = null
    emit('update:modelValue', null)
  }
  
  showDropdown.value = true
  highlightedIndex.value = 0
}

function handleSelectArtist(artist: Artist) {
  selectedArtist.value = artist
  searchQuery.value = artist.name
  emit('update:modelValue', artist.id)
  closeDropdown()
}

async function handleCreateNewArtist() {
  const query = searchQuery.value.trim()
  if (!query) return
  
  // Get project ID from auth store
  const { useAuthStore } = await import('@/stores/auth')
  const authStore = useAuthStore()
  const projectId = await authStore.getPersonalProjectId()
  
  if (!projectId) return
  
  const result = await artistsStore.createArtist(projectId, query)
  
  if (result.success && result.data) {
    const artist = result.data as unknown as Artist
    selectedArtist.value = artist
    searchQuery.value = artist.name
    emit('update:modelValue', artist.id)
    emit('artistCreated', artist)
    closeDropdown()
  }
}

function handleClearSelection() {
  selectedArtist.value = null
  searchQuery.value = ''
  emit('update:modelValue', null)
  showDropdown.value = false
}

function closeDropdown() {
  showDropdown.value = false
  highlightedIndex.value = 0
}

function navigateDown() {
  const maxIndex = canCreateNew.value ? filteredArtists.value.length : filteredArtists.value.length - 1
  if (highlightedIndex.value < maxIndex) {
    highlightedIndex.value++
  }
}

function navigateUp() {
  if (highlightedIndex.value > 0) {
    highlightedIndex.value--
  }
}

function selectHighlighted() {
  if (filteredArtists.value.length === 0 && !canCreateNew.value) {
    return
  }
  
  if (highlightedIndex.value < filteredArtists.value.length) {
    handleSelectArtist(filteredArtists.value[highlightedIndex.value])
  } else if (canCreateNew.value) {
    handleCreateNewArtist()
  }
}
</script>
