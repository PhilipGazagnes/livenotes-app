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

      <DropdownMenu v-if="!uiStore.selectionMode" :items="dropdownItems" />
    </div>
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
import DropdownMenu from '@/components/DropdownMenu.vue'

const props = defineProps<{
  list: List
}>()

const emit = defineEmits<{
  rename: [list: List]
  delete: [list: List]
}>()

const router = useRouter()
const uiStore = useUiStore()
const songCount = ref(0)

const isSelected = computed(() => uiStore.isSelected(props.list.id))

const dropdownItems = [
  { label: I18N.DROPDOWN.RENAME, callback: () => emit('rename', props.list) },
  { label: I18N.DROPDOWN.DELETE, variant: 'danger' as const, callback: () => emit('delete', props.list) },
]

onMounted(async () => {
  songCount.value = await fetchListItemCount(props.list.id)
})

function handleClick() {
  if (uiStore.selectionMode) {
    uiStore.toggleSelection(props.list.id)
  } else {
    uiStore.showOperationOverlay('Loading list...')
    router.push(`${ROUTES.LISTS}/${props.list.id}`)
  }
}
</script>
