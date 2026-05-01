<template>
  <div
    class="bg-gray-800 rounded-lg border transition-colors flex items-stretch"
    :class="{
      'border-blue-500 bg-gray-700': uiStore.selectionMode && isSelected,
      'border-gray-700 hover:border-gray-600': !uiStore.selectionMode || !isSelected,
    }"
  >
    <!-- Main clickable area -->
    <div
      class="flex-1 p-4 min-w-0 cursor-pointer"
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
            {{ song.title }}
          </h3>

          <!-- Artists (new many-to-many relationship) -->
          <p v-if="settingsStore.showArtistsInLists && song.artists && song.artists.length > 0" class="text-gray-400 text-sm mb-2 truncate">
            <svg class="w-3 h-3 inline mr-1 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            {{ song.artists.map(a => a.name).join(', ') }}
          </p>

          <!-- Legacy Artist (fallback for old data) -->
          <p v-else-if="settingsStore.showArtistsInLists && song.artist" class="text-gray-400 text-sm mb-2 truncate">
            <svg class="w-3 h-3 inline mr-1 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            {{ song.artist }}
          </p>

          <!-- Tags -->
          <div v-if="settingsStore.showTagsInLists && song.tags && song.tags.length > 0" class="flex flex-wrap gap-2 mb-2">
            <span
              v-for="tag in song.tags"
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
          <div v-if="settingsStore.showListsInLists && song.lists && song.lists.length > 0" class="flex flex-wrap gap-2">
            <span
              v-for="list in song.lists"
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
            :aria-label="I18N.ARIA.SONG_OPTIONS"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Dropdown Menu -->
      <SongDropdownMenu
        v-if="isDropdownOpen"
        :song="song"
        :librarySongId="(props.item as any).library_song_id"
        :showRemoveFromList="true"
        :showDuplicate="false"
        @close="isDropdownOpen = false"
        @remove="handleRemove"
        @songDeleted="(songId) => emit('songDeleted', songId)"
        @tagsUpdated="handleTagsUpdated"
        @listsUpdated="(songId) => emit('listsUpdated', songId)"
      />
    </div>

    <!-- Drag handle zone (only in draggable contexts, not in selection mode) -->
    <div
      v-if="draggable && !uiStore.selectionMode"
      class="drag-handle w-10 flex-shrink-0 border-l border-gray-700/50 bg-gray-900/30 flex items-center justify-center"
      @click.stop
    >
      <svg class="w-2.5 h-5 text-gray-600" viewBox="0 0 10 20" fill="currentColor" aria-hidden="true">
        <circle cx="3" cy="4" r="1.5"/>
        <circle cx="7" cy="4" r="1.5"/>
        <circle cx="3" cy="10" r="1.5"/>
        <circle cx="7" cy="10" r="1.5"/>
        <circle cx="3" cy="16" r="1.5"/>
        <circle cx="7" cy="16" r="1.5"/>
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ListItem, SongWithTags } from '@/types/database'
import SongDropdownMenu from './SongDropdownMenu.vue'
import { useUiStore } from '@/stores/ui'
import { useSettingsStore } from '@/stores/settings'
import { I18N } from '@/constants/i18n'

const props = defineProps<{
  item: ListItem & { song: SongWithTags }
  draggable?: boolean
}>()

const emit = defineEmits<{
  remove: []
  songDeleted: [songId: string]
  tagsUpdated: [songId: string]
  listsUpdated: [songId: string]
  openNotes: [item: ListItem & { song: SongWithTags }]
}>()

const uiStore = useUiStore()
const settingsStore = useSettingsStore()
const isDropdownOpen = ref(false)

const song = computed(() => props.item.song)
const isSelected = computed(() => uiStore.isSelected(props.item.id))

function toggleDropdown() {
  isDropdownOpen.value = !isDropdownOpen.value
}

function handleCardClick() {
  if (uiStore.selectionMode) {
    uiStore.toggleSelection(props.item.id)
  } else {
    // Open notes drawer - need to fetch full library song first
    emit('openNotes', props.item)
  }
}

function handleRemove() {
  isDropdownOpen.value = false
  emit('remove')
}

function handleTagsUpdated(songId: string) {
  // Propagate event to parent page which will refresh the list
  emit('tagsUpdated', songId)
}
</script>
