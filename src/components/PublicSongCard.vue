<template>
  <div
    class="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer"
    @click="$emit('click')"
  >
    <h3 class="text-lg font-semibold text-white mb-1 truncate">
      <template v-if="titleSegments.length > 1">
        <template v-for="seg in titleSegments" :key="seg.text + seg.highlighted">
          <mark v-if="seg.highlighted" class="bg-yellow-400/30 text-yellow-200 rounded-sm not-italic">{{ seg.text }}</mark>
          <span v-else>{{ seg.text }}</span>
        </template>
      </template>
      <template v-else>{{ song.custom_title || song.song?.title }}</template>
    </h3>

    <p v-if="song.song?.artists?.length" class="text-gray-400 text-sm truncate">
      <template v-for="(artist, i) in song.song.artists" :key="artist.id">
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
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FuseResultMatch } from 'fuse.js'
import type { LibrarySongWithDetails } from '@/types/database'
import { getSegments } from '@/utils/highlight'

const props = defineProps<{
  song: LibrarySongWithDetails
  matches?: FuseResultMatch[]
}>()

defineEmits<{ click: [] }>()

const titleSegments = computed(() => {
  const displayTitle = props.song.custom_title || props.song.song?.title || ''
  const titleKey = props.song.custom_title ? 'custom_title' : 'song.title'
  const match = props.matches?.find(m => m.key === titleKey)
  return match ? getSegments(displayTitle, match.indices) : []
})

function getArtistSegments(artistName: string) {
  const match = props.matches?.find(m => m.key === 'song.artists.name' && m.value === artistName)
  return match ? getSegments(artistName, match.indices) : []
}
</script>
