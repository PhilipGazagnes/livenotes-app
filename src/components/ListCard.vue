<template>
  <div 
    @click="handleClick"
    class="bg-gray-800 rounded-lg p-4 border transition-colors"
    :class="{
      'border-blue-500 bg-gray-700': uiStore.selectionMode && isSelected,
      'border-gray-700 hover:border-gray-600': !uiStore.selectionMode || !isSelected,
      'cursor-pointer': true
    }"
  >
    <div class="flex items-start justify-between gap-3">
      <!-- Checkbox (Selection Mode) -->
      <div v-if="uiStore.selectionMode" class="flex-shrink-0 pt-1">
        <div class="w-5 h-5 rounded border-2 flex items-center justify-center"
             :class="isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-400'">
          <svg v-if="isSelected" class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
      </div>
      <!-- List Info -->
      <div class="flex-1 min-w-0">
        <!-- Name -->
        <div class="flex items-center gap-2 mb-1">
          <svg class="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
          </svg>
          <h3 class="text-lg font-semibold text-white truncate">
            {{ list.name }}
          </h3>
        </div>

        <!-- Song Count -->
        <p class="text-sm text-gray-400 ml-7">
          {{ I18N.PLURALS.SONG_COUNT(songCount) }}
        </p>
      </div>

      <!-- Dropdown Menu Button -->
      <button
        v-if="!uiStore.selectionMode"
        @click.stop="toggleDropdown"
        class="flex-shrink-0 p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
        :aria-label="I18N.ARIA.LIST_OPTIONS"
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
        :style="dropdownPosition"
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { List } from '@/types/database'
import { fetchListItemCount } from '@/services/listService'
import { useUiStore } from '@/stores/ui'
import { ROUTES } from '@/constants/routes'
import { I18N } from '@/constants/i18n'

const props = defineProps<{
  list: List
}>()

const emit = defineEmits<{
  rename: [list: List]
  delete: [list: List]
}>()

const router = useRouter()
const uiStore = useUiStore()
const isDropdownOpen = ref(false)
const dropdownPosition = ref({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' })
const songCount = ref(0)

const isSelected = computed(() => uiStore.isSelected(props.list.id))

onMounted(async () => {
  songCount.value = await fetchListItemCount(props.list.id)
})

function toggleDropdown() {
  isDropdownOpen.value = !isDropdownOpen.value
}

function handleClick() {
  if (uiStore.selectionMode) {
    uiStore.toggleSelection(props.list.id)
  } else {
    // Show overlay for loading state during navigation
    uiStore.showOperationOverlay('Loading list...')
    // Navigate to list detail page
    router.push(`${ROUTES.LISTS}/${props.list.id}`)
  }
}

function handleRename() {
  isDropdownOpen.value = false
  emit('rename', props.list)
}

function handleDelete() {
  isDropdownOpen.value = false
  emit('delete', props.list)
}
</script>
