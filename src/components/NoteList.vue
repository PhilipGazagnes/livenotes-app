<template>
  <div class="flex-1 overflow-y-auto p-4">
    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="notes.length === 0" class="text-center py-12">
      <svg class="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
      <h3 class="text-lg font-semibold text-white mb-2">{{ I18N.EMPTY_STATES.NO_NOTES_YET }}</h3>
      <p class="text-gray-400 text-sm">Add notes to this song to see them here</p>
    </div>

    <!-- Notes Cards -->
    <div v-else class="space-y-3">
      <template v-for="note in notes" :key="note.id">
        <div
          @click="emit('note-opened', note)"
          class="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 cursor-pointer transition-colors group"
        >
          <div class="flex items-start justify-between mb-2">
            <div class="flex items-center gap-2">
              <div class="flex-shrink-0">
                <component :is="getNoteIcon(note.type)" class="w-5 h-5" :class="getNoteIconColor(note.type)" />
              </div>
              <h3 class="text-base font-semibold text-white">
                {{ note.title || getNoteTypeLabel(note.type) }}
              </h3>
            </div>
            <svg class="w-5 h-5 text-gray-400 group-hover:text-white transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </div>
          <!-- Looper preview -->
          <template v-if="note.type === 'looper' && note.data">
            <div class="space-y-1">
              <div class="text-cyan-400 font-bold text-sm">{{ getLooperData(note)!.bpm }} BPM</div>
              <div class="flex flex-wrap items-baseline gap-x-2">
                <span class="bg-violet-700/60 text-violet-200 font-semibold px-2 py-0.5 rounded text-xs">{{ getLooperData(note)!.pattern1 }}</span>
                <span v-if="getLooperData(note)!.pattern1_var" class="text-white text-xs">{{ getLooperData(note)!.pattern1_var }}</span>
                <template v-if="getLooperData(note)!.pattern2">
                  <span class="bg-violet-700/60 text-violet-200 font-semibold px-2 py-0.5 rounded text-xs">{{ getLooperData(note)!.pattern2 }}</span>
                  <span v-if="getLooperData(note)!.pattern2_var" class="text-white text-xs">{{ getLooperData(note)!.pattern2_var }}</span>
                </template>
              </div>
              <p v-if="getLooperData(note)!.comment" class="text-gray-400 text-xs pt-1 line-clamp-2">{{ getLooperData(note)!.comment }}</p>
            </div>
          </template>
          <p v-else class="text-sm text-gray-400 line-clamp-2">{{ getContentPreview(note) }}</p>
          <div class="flex items-center gap-3 mt-3 text-xs text-gray-500">
            <span>{{ formatDate(note.updated_at ?? '') }}</span>
            <span v-if="note.is_public" class="flex items-center gap-1">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Public
            </span>
          </div>
        </div>

        <!-- Synthetic lyrics card injected after the songcode card when livenotes_json exists -->
        <div
          v-if="note.type === 'songcode' && getLivenotesJson(note)"
          @click="emit('lyrics-opened', note)"
          class="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 cursor-pointer transition-colors group"
        >
          <div class="flex items-start justify-between mb-2">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-pink-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
              </svg>
              <h3 class="text-base font-semibold text-white">Lyrics</h3>
            </div>
            <svg class="w-5 h-5 text-gray-400 group-hover:text-white transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </div>
          <p class="text-sm text-gray-400 line-clamp-2 notranslate" translate="no">{{ getLyricsPreview(note) }}</p>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import type { Note, LooperContent, LivenotesJson, SongcodeNoteData } from '@/types/database'
import { I18N } from '@/constants/i18n'

defineProps<{ notes: Note[]; isLoading: boolean }>()
const emit = defineEmits<{
  'note-opened': [note: Note]
  'lyrics-opened': [note: Note]
}>()

function getLooperData(note: Note): LooperContent | null {
  if (note.type !== 'looper' || !note.data) return null
  return note.data as LooperContent
}

function getSongcodeData(note: Note): SongcodeNoteData | null {
  if (note.type !== 'songcode' || !note.data) return null
  return note.data as SongcodeNoteData
}

function getLivenotesJson(note: Note): LivenotesJson | null {
  return getSongcodeData(note)?.livenotes_json ?? null
}

function getLyricsPreview(note: Note): string {
  const sections = getLivenotesJson(note)?.sections
  if (!sections) return ''
  for (const section of sections) {
    for (const lyric of (section.lyrics ?? [])) {
      if (lyric.style === 'normal') return lyric.text
    }
  }
  return ''
}

function getNoteTypeLabel(type: string): string {
  return (I18N.NOTES.TYPE_LABELS as Record<string, string>)[type] ?? type
}

function getContentPreview(note: Note): string {
  if (!note.content) return I18N.EMPTY_STATES.NO_CONTENT
  const cleaned = note.content.replace(/\s+/g, ' ').trim()
  return cleaned.length > 100 ? cleaned.substring(0, 100) + '...' : cleaned
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 1) return I18N.TIME.JUST_NOW
  if (diffMins < 60) return I18N.TIME.MINUTES_AGO(diffMins)
  if (diffHours < 24) return I18N.TIME.HOURS_AGO(diffHours)
  if (diffDays < 7) return I18N.TIME.DAYS_AGO(diffDays)
  return date.toLocaleDateString()
}

function getNoteIcon(type: string) {
  const icons: Record<string, () => ReturnType<typeof h>> = {
    songcode: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' }),
    ]),
    plain_text: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M4 6h16M4 12h16M4 18h16' }),
    ]),
    youtube: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z' }),
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }),
    ]),
    image: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' }),
    ]),
    video: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' }),
    ]),
    audio: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3' }),
    ]),
    tablature: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3' }),
    ]),
    looper_notes: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' }),
    ]),
    looper: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' }),
    ]),
    lyrics: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' }),
    ]),
    chords: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3' }),
    ]),
  }
  return icons[type] ?? icons.plain_text
}

function getNoteIconColor(type: string): string {
  const colors: Record<string, string> = {
    songcode: 'text-purple-400', plain_text: 'text-gray-400', youtube: 'text-red-400',
    image: 'text-green-400', video: 'text-blue-400', audio: 'text-yellow-400',
    tablature: 'text-orange-400', looper_notes: 'text-cyan-400', looper: 'text-cyan-400',
    lyrics: 'text-pink-400', chords: 'text-indigo-400',
  }
  return colors[type] ?? 'text-gray-400'
}
</script>
