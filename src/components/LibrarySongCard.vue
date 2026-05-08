<template>
  <div 
    class="bg-gray-800 rounded-lg p-4 border transition-colors relative"
    :class="{
      'border-blue-500 bg-gray-700': uiStore.selectionMode && isSelected,
      'border-gray-700 hover:border-gray-600': !uiStore.selectionMode || !isSelected,
      'cursor-pointer': true,
    }"
    @click="handleCardClick"
  >
    <div class="flex items-start gap-3">
      <!-- Checkbox (Selection Mode) -->
      <div v-if="uiStore.selectionMode" class="flex-shrink-0 pt-1">
        <div class="w-5 h-5 rounded border-2 flex items-center justify-center"
             :class="isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-400'">
          <svg v-if="isSelected" class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
      </div>
      
      <!-- Song Info -->
      <div class="flex-1 min-w-0">
        <!-- Title -->
        <h3 class="text-lg font-semibold text-white mb-1 truncate">
          <template v-if="titleSegments.length > 1">
            <template v-for="seg in titleSegments" :key="seg.text + seg.highlighted">
              <mark v-if="seg.highlighted" class="bg-yellow-400/30 text-yellow-200 rounded-sm not-italic">{{ seg.text }}</mark>
              <span v-else>{{ seg.text }}</span>
            </template>
          </template>
          <template v-else>{{ librarySong.custom_title || librarySong.song?.title }}</template>
        </h3>

        <!-- Artists -->
        <p v-if="librarySong.song?.artists && librarySong.song.artists.length > 0" class="text-gray-400 text-sm mb-2 truncate">
          <svg class="w-3 h-3 inline mr-1 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
          </svg>
          <template v-for="(artist, i) in librarySong.song.artists" :key="artist.id">
            <template v-if="i > 0">, </template>
            <template v-if="getArtistSegments(artist.name).length > 1">
              <template v-for="seg in getArtistSegments(artist.name)" :key="seg.text + seg.highlighted">
                <mark v-if="seg.highlighted" class="bg-yellow-400/30 text-yellow-200 rounded-sm not-italic">{{ seg.text }}</mark>
                <span v-else>{{ seg.text }}</span>
              </template>
            </template>
            <template v-else>{{ artist.name }}</template>
          </template>
        </p>
        
        <!-- Tags -->
        <div v-if="librarySong.tags && librarySong.tags.length > 0" class="flex flex-wrap gap-2 mb-2">
          <span
            v-for="tag in librarySong.tags"
            :key="tag.id"
            class="inline-flex items-center px-2 py-1 bg-blue-900/30 border border-blue-700 rounded text-blue-400 text-xs"
          >
            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
            </svg>
            {{ tag.name }}
          </span>
        </div>

        <!-- Lists -->
        <div v-if="librarySong.lists && librarySong.lists.length > 0" class="flex flex-wrap gap-2">
          <span
            v-for="list in librarySong.lists"
            :key="list.id"
            class="inline-flex items-center px-2 py-1 bg-green-900/30 border border-green-700 rounded text-green-400 text-xs"
          >
            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
            </svg>
            {{ list.name }}
          </span>
        </div>
      </div>

      <!-- Dropdown Menu Button -->
      <div v-if="!uiStore.selectionMode" class="flex-shrink-0">
        <button
          @click.stop.prevent="toggleDropdown"
          @mousedown.stop
          @touchstart.stop
          @pointerdown.stop
          class="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Dropdown Menu -->
    <div v-if="isDropdownOpen">
      <!-- Backdrop -->
      <div
        @click="isDropdownOpen = false"
        class="fixed inset-0 z-10"
      />
      
      <!-- Menu -->
      <div class="absolute right-0 top-10 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-20 overflow-hidden">
        <button
          @click="handleManageTags"
          class="w-full text-left px-4 py-2 text-white hover:bg-gray-800 transition-colors"
        >
          Manage Tags
        </button>
        <button
          @click="handleManageLists"
          class="w-full text-left px-4 py-2 text-white hover:bg-gray-800 transition-colors"
        >
          Manage Lists
        </button>
        <button
          @click="handleRemoveFromLibrary"
          class="w-full text-left px-4 py-2 text-red-400 hover:bg-gray-800 transition-colors"
        >
          Remove from Library
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { FuseResultMatch } from 'fuse.js'
import type { LibrarySongWithDetails } from '@/types/database'
import { useUiStore } from '@/stores/ui'
import { useDrawerStore } from '@/stores/drawer'
import SongNotesDrawer from '@/components/SongNotesDrawer.vue'
import { getSegments } from '@/utils/highlight'

const props = defineProps<{
  librarySong: LibrarySongWithDetails
  matches?: FuseResultMatch[]
}>()

const emit = defineEmits<{
  manageTags: [librarySong: LibrarySongWithDetails]
  manageLists: [librarySong: LibrarySongWithDetails]
  removeFromLibrary: [librarySong: LibrarySongWithDetails]
}>()

const uiStore = useUiStore()
const drawerStore = useDrawerStore()
const isDropdownOpen = ref(false)

const isSelected = computed(() => uiStore.isSelected(props.librarySong.id))

const titleSegments = computed(() => {
  const displayTitle = props.librarySong.custom_title || props.librarySong.song?.title || ''
  const titleKey = props.librarySong.custom_title ? 'custom_title' : 'song.title'
  const match = props.matches?.find(m => m.key === titleKey)
  return match ? getSegments(displayTitle, match.indices) : []
})

function getArtistSegments(artistName: string) {
  const match = props.matches?.find(m => m.key === 'song.artists.name' && m.value === artistName)
  return match ? getSegments(artistName, match.indices) : []
}

function toggleDropdown() {
  isDropdownOpen.value = !isDropdownOpen.value
}

function handleCardClick() {
  if (uiStore.selectionMode) {
    uiStore.toggleSelection(props.librarySong.id)
  } else {
    drawerStore.push(SongNotesDrawer, { librarySongId: props.librarySong.id })
  }
}

function handleManageTags() {
  isDropdownOpen.value = false
  emit('manageTags', props.librarySong)
}

function handleManageLists() {
  isDropdownOpen.value = false
  emit('manageLists', props.librarySong)
}

function handleRemoveFromLibrary() {
  isDropdownOpen.value = false
  emit('removeFromLibrary', props.librarySong)
}
</script>
