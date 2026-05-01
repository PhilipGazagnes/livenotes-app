<template>
  <!-- Backdrop -->
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black/50 z-50 transition-opacity"
    :class="isOpen ? 'opacity-100' : 'opacity-0'"
    @click="handleClose"
  />
  
  <!-- Drawer (stacks on top of SongNotesDrawer) -->
  <div
    class="fixed top-0 right-0 h-full w-full md:w-[500px] bg-gray-900 shadow-2xl z-[60] transform transition-transform duration-300 flex flex-col"
    :class="isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'"
  >
    <!-- Header -->
    <div class="flex-shrink-0 bg-gray-800 border-b border-gray-700 p-4">
      <div class="flex items-start justify-between">
        <div class="flex-1 min-w-0 mr-3">
          <div class="flex items-center gap-2 mb-1">
            <component :is="getNoteIcon(note?.type || 'plain_text')" class="w-5 h-5" :class="getNoteIconColor(note?.type || 'plain_text')" />
            <h2 class="text-xl font-semibold text-white truncate">
              {{ note?.title || getNoteTypeLabel(note?.type || 'plain_text') }}
            </h2>
          </div>
          <p class="text-sm text-gray-400">
            {{ formatDate(note?.updated_at || '') }}
          </p>
        </div>
        <button
          @click="handleClose"
          class="flex-shrink-0 p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-6">
      <div v-if="note" class="space-y-4">
        <!-- Public/Shareable badges -->
        <div v-if="note.is_public || note.is_shareable" class="flex gap-2">
          <span v-if="note.is_public" class="inline-flex items-center gap-1 px-3 py-1 bg-green-900/30 border border-green-700 text-green-400 text-xs rounded">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Public
          </span>
          <span v-if="note.is_shareable" class="inline-flex items-center gap-1 px-3 py-1 bg-blue-900/30 border border-blue-700 text-blue-400 text-xs rounded">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
            </svg>
            Shareable
          </span>
        </div>

        <!-- Note Content -->
        <div class="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <!-- Looper structured display -->
          <div v-if="note.type === 'looper' && looperContent" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1">BPM</label>
                <div class="text-2xl font-bold text-cyan-400">{{ looperContent.bpm }}</div>
              </div>
            </div>
            
            <div class="space-y-3">
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1">Pattern 1</label>
                <div class="text-gray-200 bg-gray-900/50 rounded px-3 py-2">{{ looperContent.pattern1 || '—' }}</div>
              </div>
              
              <div v-if="looperContent.pattern1_var">
                <label class="block text-xs font-medium text-gray-400 mb-1">Pattern 1 Variation</label>
                <div class="text-gray-200 bg-gray-900/50 rounded px-3 py-2">{{ looperContent.pattern1_var }}</div>
              </div>
              
              <div v-if="looperContent.pattern2">
                <label class="block text-xs font-medium text-gray-400 mb-1">Pattern 2</label>
                <div class="text-gray-200 bg-gray-900/50 rounded px-3 py-2">{{ looperContent.pattern2 }}</div>
              </div>
              
              <div v-if="looperContent.pattern2_var">
                <label class="block text-xs font-medium text-gray-400 mb-1">Pattern 2 Variation</label>
                <div class="text-gray-200 bg-gray-900/50 rounded px-3 py-2">{{ looperContent.pattern2_var }}</div>
              </div>
              
              <div v-if="looperContent.comment">
                <label class="block text-xs font-medium text-gray-400 mb-1">Comment</label>
                <div class="text-gray-200 bg-gray-900/50 rounded px-3 py-2 whitespace-pre-wrap">{{ looperContent.comment }}</div>
              </div>
            </div>
          </div>
          
          <!-- SongCode gets special formatting -->
          <pre v-else-if="note.type === 'songcode'" class="font-mono text-sm text-gray-200 whitespace-pre-wrap break-words overflow-x-auto">{{ note.content }}</pre>
          
          <!-- YouTube embed -->
          <div v-else-if="note.type === 'youtube'" class="space-y-3">
            <div v-if="getYouTubeId(note.content ?? '')" class="aspect-video bg-gray-900 rounded overflow-hidden">
              <iframe
                :src="`https://www.youtube.com/embed/${getYouTubeId(note.content ?? '')}`"
                class="w-full h-full"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
              ></iframe>
            </div>
            <p class="text-sm text-gray-400 break-all">{{ note.content }}</p>
          </div>
          
          <!-- Image -->
          <div v-else-if="note.type === 'image'" class="space-y-3">
            <img v-if="isValidUrl(note.content ?? '')" :src="note.content ?? undefined" alt="Note image" class="w-full rounded border border-gray-700" />
            <p class="text-sm text-gray-400 break-all">{{ note.content }}</p>
          </div>
          
          <!-- Default text content -->
          <p v-else class="text-gray-200 whitespace-pre-wrap break-words">{{ note.content }}</p>
        </div>

        <!-- Metadata -->
        <div class="text-xs text-gray-500 space-y-1">
          <p>Created: {{ formatFullDate(note.created_at ?? '') }}</p>
          <p>Last updated: {{ formatFullDate(note.updated_at ?? '') }}</p>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="text-center py-12">
        <svg class="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <h3 class="text-lg font-semibold text-white mb-2">No note selected</h3>
      </div>
    </div>

    <!-- Footer Actions -->
    <div class="flex-shrink-0 bg-gray-800 border-t border-gray-700 p-4 flex gap-3">
      <button
        @click="handleEdit"
        class="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
        </svg>
        Edit
      </button>
      <button
        @click="handleDelete"
        class="px-4 py-3 bg-red-600/20 hover:bg-red-600/30 border border-red-600 text-red-400 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
        Delete
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h, watch, computed } from 'vue'
import type { Note, LooperContent } from '@/types/database'

interface Props {
  isOpen: boolean
  note: Note | null
}

interface Emits {
  (e: 'close'): void
  (e: 'edit', note: Note): void
  (e: 'delete', note: Note): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const looperContent = computed(() => {
  if (props.note?.type === 'looper' && props.note.data) {
    return props.note.data as LooperContent
  }
  return null
})

// Debug log when note changes
watch(() => props.note, (newNote) => {
  console.log('📄 NoteContentDrawer: Note prop changed:', {
    note: newNote,
    id: newNote?.id,
    type: newNote?.type,
    title: newNote?.title,
    content_length: newNote?.content?.length || 0,
    content_preview: newNote?.content?.substring(0, 100)
  })
}, { immediate: true })

function handleClose() {
  emit('close')
}

function handleEdit() {
  if (props.note) {
    emit('edit', props.note)
  }
}

function handleDelete() {
  if (props.note) {
    emit('delete', props.note)
  }
}

function getNoteTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    songcode: 'SongCode',
    plain_text: 'Plain Text',
    youtube: 'YouTube',
    image: 'Image',
    video: 'Video',
    audio: 'Audio',
    tablature: 'Tablature',
    looper_notes: 'Looper Notes',
    looper: 'Looper',
    lyrics: 'Lyrics',
    chords: 'Chords',
  }
  return labels[type] || type
}

function getNoteIcon(type: string) {
  const icons: Record<string, any> = {
    songcode: () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' })
    ]),
    plain_text: () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M4 6h16M4 12h16M4 18h16' })
    ]),
    youtube: () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z' }),
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M21 12a9 9 0 11-18 0 9 9 0 0118 0z' })
    ]),
    image: () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' })
    ]),
    video: () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' })
    ]),
    audio: () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3' })
    ]),
    tablature: () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3' })
    ]),
    looper_notes: () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' })
    ]),
    looper: () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' })
    ]),
    lyrics: () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' })
    ]),
    chords: () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3' })
    ]),
  }
  return icons[type] || icons.plain_text
}

function getNoteIconColor(type: string): string {
  const colors: Record<string, string> = {
    songcode: 'text-purple-400',
    plain_text: 'text-gray-400',
    youtube: 'text-red-400',
    image: 'text-green-400',
    video: 'text-blue-400',
    audio: 'text-yellow-400',
    tablature: 'text-orange-400',
    looper_notes: 'text-cyan-400',
    looper: 'text-cyan-400',
    lyrics: 'text-pink-400',
    chords: 'text-indigo-400',
  }
  return colors[type] || 'text-gray-400'
}

function formatDate(dateString: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString()
}

function formatFullDate(dateString: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString()
}

function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
    /youtube\.com\/embed\/([^&\s]+)/,
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  
  return null
}

function isValidUrl(string: string): boolean {
  try {
    new URL(string)
    return true
  } catch {
    return false
  }
}
</script>
