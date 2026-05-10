<template>
  <!-- Content wrapper: fills remaining height, zoom buttons float over it -->
  <div class="flex-1 relative overflow-hidden">
    <div class="h-full overflow-y-auto p-5 pb-16">
      <div v-if="sections.length === 0" class="text-center py-12">
        <p class="text-gray-400 text-sm">No lyrics found</p>
      </div>
      <div v-else class="space-y-7">
        <div v-for="(section, index) in sections" :key="index">
          <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2.5 pb-1.5 border-b border-gray-800">
            {{ section.name }}
          </h3>
          <div class="space-y-1">
            <p
              v-for="(lyric, lineIndex) in section.lyrics"
              :key="lineIndex"
              :class="lyricClass(lyric.style)"
              :style="{ fontSize: `${fontSize}rem`, lineHeight: '1.7' }"
            >
              <span
                v-for="(segment, segIndex) in parseVocalSegments(lyric.text)"
                :key="segIndex"
                :class="vocalClass(segment.vocal)"
              >{{ segment.text }}</span>
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Zoom controls — absolute within the non-scrolling wrapper, always visible -->
    <div class="absolute bottom-4 right-4 flex items-center gap-1">
      <button
        @click="zoomOut"
        :disabled="fontSize <= FONT_MIN"
        class="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="Zoom out"
      >
        <span class="text-base font-semibold leading-none" style="font-size: 0.8rem">A</span>
        <span class="text-xs leading-none ml-0.5">−</span>
      </button>
      <button
        @click="zoomIn"
        :disabled="fontSize >= FONT_MAX"
        class="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="Zoom in"
      >
        <span class="text-lg font-semibold leading-none" style="font-size: 1.1rem">A</span>
        <span class="text-xs leading-none ml-0.5">+</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { LivenotesJson } from '@/types/database'

const props = defineProps<{ livenotesJson: LivenotesJson | null }>()

const FONT_MIN = 0.75
const FONT_MAX = 1.75
const FONT_STEP = 0.125
const fontSize = ref(1)

function zoomIn() {
  if (fontSize.value < FONT_MAX) fontSize.value = Math.round((fontSize.value + FONT_STEP) * 1000) / 1000
}
function zoomOut() {
  if (fontSize.value > FONT_MIN) fontSize.value = Math.round((fontSize.value - FONT_STEP) * 1000) / 1000
}

const sections = computed(() => {
  if (!props.livenotesJson?.sections) return []
  return props.livenotesJson.sections.filter(s => s.lyrics?.length > 0)
})

type VocalType = 'normal' | 'male' | 'female'
interface Segment { text: string; vocal: VocalType }

function parseVocalSegments(text: string): Segment[] {
  const segments: Segment[] = []
  const pattern = /\{m\{(.*?)\}\}|\{l\{(.*?)\}\}/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) segments.push({ text: text.slice(lastIndex, match.index), vocal: 'normal' })
    if (match[1] !== undefined) segments.push({ text: match[1], vocal: 'male' })
    else segments.push({ text: match[2], vocal: 'female' })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) segments.push({ text: text.slice(lastIndex), vocal: 'normal' })
  return segments
}

function vocalClass(vocal: VocalType): string {
  if (vocal === 'male') return 'text-sky-300'
  if (vocal === 'female') return 'text-pink-300'
  return ''
}

function lyricClass(style: string): string {
  switch (style) {
    case 'info': return 'text-gray-400 italic'
    case 'musician':
    case 'musicianInfo': return 'text-amber-400'
    default: return 'text-white'
  }
}
</script>
