<template>
  <div class="flex-shrink-0 bg-gray-800 border-b border-gray-700 p-4">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-white">{{ headerText }}</h2>
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

  <div class="flex-1 overflow-y-auto p-4 space-y-1">
    <button
      v-for="(set, index) in artistSets"
      :key="index"
      type="button"
      data-testid="artist-set-option"
      @click="pickSet(set)"
      class="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors text-white"
    >
      {{ set.join(', ') }}
    </button>

    <button
      v-if="currentArtists.length > 0"
      type="button"
      data-testid="artist-keep-current"
      @click="keepCurrent"
      class="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors text-white"
    >
      {{ I18N.BUTTONS.KEEP_ARTISTS(currentArtists.join(', ')) }}
    </button>

    <button
      type="button"
      data-testid="artist-choose-another"
      @click="chooseAnother"
      class="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors text-blue-400"
    >
      {{ I18N.BUTTONS.CHOOSE_ANOTHER_ARTIST }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDrawerStore } from '@/stores/drawer'
import { I18N } from '@/constants/i18n'

const props = defineProps<{
  artistSets: string[][]
  currentArtists: string[]
  onPickArtistSet: (set: string[]) => void
  onChooseAnother: () => void
}>()

const drawerStore = useDrawerStore()

const headerText = computed(() =>
  props.artistSets.length === 1
    ? I18N.MODAL_CONTENT.ARTIST_DEDUCTION_SINGLE(props.artistSets[0].join(', '))
    : I18N.MODAL_CONTENT.ARTIST_DEDUCTION_MULTIPLE
)

function pickSet(set: string[]) {
  drawerStore.pop()
  props.onPickArtistSet(set)
}

function keepCurrent() {
  drawerStore.pop()
}

function chooseAnother() {
  drawerStore.pop()
  props.onChooseAnother()
}
</script>
