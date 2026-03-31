<template>
  <div 
    class="bg-gray-800 rounded-lg p-4 border transition-colors"
    :class="{
      'border-blue-500 bg-gray-700': uiStore.selectionMode && isSelected,
      'border-gray-700 hover:border-gray-600': !uiStore.selectionMode || !isSelected,
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
          {{ song.title }}
        </h3>

        <!-- Artist -->
        <p v-if="song.artist" class="text-gray-400 text-sm mb-2 truncate">
          {{ song.artist }}
        </p>

        <!-- Tags -->
        <div v-if="song.tags && song.tags.length > 0" class="flex flex-wrap gap-2">
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
      </div>

      <!-- Up/Down Arrows & Dropdown -->
      <div v-if="!uiStore.selectionMode" class="flex flex-col items-center gap-2 flex-shrink-0">
        <!-- Up Arrow -->
        <button
          @click="$emit('moveUp')"
          :disabled="!canMoveUp"
          class="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          :aria-label="I18N.ARIA.MOVE_UP"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
          </svg>
        </button>

        <!-- Dropdown Menu Button -->
        <button
          @click.stop.prevent="toggleDropdown"
          class="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          :aria-label="I18N.ARIA.SONG_OPTIONS"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
          </svg>
        </button>

        <!-- Down Arrow -->
        <button
          @click="$emit('moveDown')"
          :disabled="!canMoveDown"
          class="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          :aria-label="I18N.ARIA.MOVE_DOWN"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Dropdown Menu -->
    <ListSongDropdownMenu
      v-if="isDropdownOpen"
      :song="song"
      @close="isDropdownOpen = false"
      @remove="handleRemove"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ListItem, SongWithTags } from '@/types/database'
import ListSongDropdownMenu from './ListSongDropdownMenu.vue'
import { useUiStore } from '@/stores/ui'
import { I18N } from '@/constants/i18n'

const props = defineProps<{
  item: ListItem & { song: SongWithTags }
  canMoveUp: boolean
  canMoveDown: boolean
}>()

const emit = defineEmits<{
  moveUp: []
  moveDown: []
  remove: []
}>()

const uiStore = useUiStore()
const isDropdownOpen = ref(false)

const song = computed(() => props.item.song)
const isSelected = computed(() => uiStore.isSelected(props.item.song.id))

function toggleDropdown() {
  isDropdownOpen.value = !isDropdownOpen.value
}

function handleCardClick() {
  if (uiStore.selectionMode) {
    uiStore.toggleSelection(props.item.song.id)
  }
}

function handleRemove() {
  isDropdownOpen.value = false
  emit('remove')
}
</script>
