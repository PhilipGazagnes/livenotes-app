<template>
  <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
    <div class="flex items-start justify-between gap-3">
      <!-- Tag Info -->
      <div class="flex-1 min-w-0">
        <!-- Tag Name -->
        <h3 class="text-lg font-semibold text-white mb-1 truncate flex items-center gap-2">
          <svg class="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
          </svg>
          {{ tag.name }}
        </h3>

        <!-- Song Count -->
        <p class="text-gray-400 text-sm ml-7">
          {{ I18N.PLURALS.SONG_COUNT(songCount) }}
        </p>
      </div>

      <!-- Dropdown Menu Button -->
      <button
        @click.stop.prevent="toggleDropdown"
        class="flex-shrink-0 p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
        :aria-label="I18N.ARIA.TAG_OPTIONS"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
        </svg>
      </button>
    </div>

    <!-- Dropdown Menu -->
    <Teleport to="body">
      <div
        v-if="isDropdownOpen"
        class="fixed inset-0 z-40 bg-black bg-opacity-20"
        @mousedown.self="isDropdownOpen = false"
      ></div>

      <div
        v-if="isDropdownOpen"
        class="fixed z-50 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl"
        :style="menuPosition"
      >
        <div class="py-1">
          <button
            @click="handleRename"
            class="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
            <span>{{ I18N.DROPDOWN.RENAME }}</span>
          </button>

          <div class="border-t border-gray-700 my-1"></div>

          <button
            @click="handleDelete"
            class="w-full flex items-center gap-3 px-4 py-3 text-left text-red-400 hover:text-red-300 hover:bg-gray-700 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
            <span>{{ I18N.DROPDOWN.DELETE }}</span>
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Tag } from '@/types/database'
import { supabase } from '@/utils/supabase'
import { I18N } from '@/constants/i18n'

const props = defineProps<{
  tag: Tag
}>()

const emit = defineEmits<{
  rename: [tag: Tag]
  delete: [tag: Tag]
}>()

const isDropdownOpen = ref(false)
const menuPosition = ref({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' })
const songCount = ref(0)

onMounted(async () => {
  // Load song count for this tag
  const { count } = await supabase
    .from('song_tags')
    .select('*', { count: 'exact', head: true })
    .eq('tag_id', props.tag.id)
  
  songCount.value = count || 0
})

function toggleDropdown() {
  isDropdownOpen.value = !isDropdownOpen.value
}

function handleRename() {
  emit('rename', props.tag)
  isDropdownOpen.value = false
}

function handleDelete() {
  emit('delete', props.tag)
  isDropdownOpen.value = false
}
</script>
