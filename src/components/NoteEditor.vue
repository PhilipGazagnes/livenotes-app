<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[60] bg-black/50" @mousedown.self="$emit('close')"></div>
    <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
      <div class="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col pointer-events-auto">
        <div class="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 class="text-xl font-semibold text-white">{{ isEditing ? 'Edit Note' : `New ${noteTypeLabel} Note` }}</h2>
          <button @click="$emit('close')" class="p-1 text-gray-400 hover:text-white transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="flex-1 overflow-y-auto p-6">
    <form @submit.prevent="handleSave" class="space-y-4">
      <!-- Title -->
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">
          Title <span class="text-red-500">*</span>
        </label>
        <input
          v-model="formData.title"
          type="text"
          :maxlength="VALIDATION.NOTE_TITLE_MAX_LENGTH"
          placeholder="Enter note title"
          class="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <p class="text-xs text-gray-500 mt-1">
          {{ formData.title.length }} / {{ VALIDATION.NOTE_TITLE_MAX_LENGTH }}
        </p>
      </div>

      <!-- Content (varies by note type) -->
      <div v-if="effectiveNoteType !== 'looper'">
        <label class="block text-sm font-medium text-gray-300 mb-2">
          Content <span class="text-red-500">*</span>
        </label>

        <!-- URL input for media types -->
        <input
          v-if="isUrlType"
          v-model="formData.content"
          type="url"
          :placeholder="urlPlaceholder"
          class="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />

        <!-- Textarea for formatted types (songcode, tablature) -->
        <textarea
          v-else-if="isFormattedType"
          v-model="formData.content"
          :maxlength="VALIDATION.NOTE_CONTENT_MAX_LENGTH"
          :rows="15"
          :placeholder="contentPlaceholder"
          class="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono text-sm resize-none"
        />

        <!-- Textarea for text types -->
        <textarea
          v-else
          v-model="formData.content"
          :maxlength="VALIDATION.NOTE_CONTENT_MAX_LENGTH"
          :rows="10"
          :placeholder="contentPlaceholder"
          class="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
        />

        <p v-if="!isUrlType" class="text-xs text-gray-500 mt-1">
          {{ formData.content.length }} / {{ VALIDATION.NOTE_CONTENT_MAX_LENGTH }}
        </p>
      </div>

      <!-- Custom form for looper type -->
      <div v-else class="space-y-4">
        <!-- BPM -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            BPM <span class="text-red-500">*</span>
          </label>
          <input
            v-model.number="looperData.bpm"
            type="number"
            min="1"
            max="300"
            placeholder="120"
            class="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <!-- Pattern 1 -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Pattern 1 <span class="text-red-500">*</span>
          </label>
          <input
            v-model="looperData.pattern1"
            type="text"
            placeholder="e.g., Kick-Snare-Kick-Snare"
            class="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <!-- Pattern 1 Variation -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Pattern 1 Variation
          </label>
          <input
            v-model="looperData.pattern1_var"
            type="text"
            placeholder="e.g., Double time on chorus"
            class="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <!-- Pattern 2 -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Pattern 2
          </label>
          <input
            v-model="looperData.pattern2"
            type="text"
            placeholder="e.g., Bass line loop"
            class="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <!-- Pattern 2 Variation -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Pattern 2 Variation
          </label>
          <input
            v-model="looperData.pattern2_var"
            type="text"
            placeholder="e.g., Variation for bridge"
            class="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <!-- Comment -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Comment
          </label>
          <textarea
            v-model="looperData.comment"
            rows="3"
            placeholder="Additional notes about the looper setup..."
            class="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>
      </div>

      <!-- SongCode Converter Hint -->
      <div 
        v-if="effectiveNoteType === 'songcode'" 
        class="bg-blue-900/20 border border-blue-800/30 rounded-lg p-3"
      >
        <p class="text-sm text-blue-300">
          💡 <strong>Tip:</strong> You can paste traditional chord charts and use the SongCode drawer to convert them to SongCode format.
        </p>
      </div>
    </form>
        </div>
        <div class="flex justify-end gap-3 p-6 border-t border-gray-700">
          <button @click="$emit('close')" class="px-6 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
          <button
            @click="handleSave"
            :disabled="!isValid"
            class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ isEditing ? 'Save' : 'Create' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useNotesStore } from '@/stores/notes'
import { useUiStore } from '@/stores/ui'
import type { Note, NoteType, LooperContent } from '@/types/database'
import { VALIDATION } from '@/constants/validation'
import { MESSAGES } from '@/constants/messages'
interface Props {
  note?: Note | null
  librarySongId: string
  noteType?: NoteType | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const notesStore = useNotesStore()
const uiStore = useUiStore()

const formData = ref({
  title: '',
  content: ''
})

const looperData = ref<LooperContent>({
  bpm: 120,
  pattern1: '',
  pattern1_var: '',
  pattern2: '',
  pattern2_var: '',
  comment: ''
})

// Computed
const isEditing = computed(() => !!props.note)

const effectiveNoteType = computed(() => {
  return props.note?.type || props.noteType!
})

const noteTypeLabel = computed(() => {
  const labels: Record<NoteType, string> = {
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
  return labels[effectiveNoteType.value] || effectiveNoteType.value
})

const isUrlType = computed(() => {
  return ['youtube', 'image', 'video', 'audio'].includes(effectiveNoteType.value)
})

const isFormattedType = computed(() => {
  return ['songcode', 'tablature'].includes(effectiveNoteType.value)
})

const urlPlaceholder = computed(() => {
  const placeholders: Record<string, string> = {
    youtube: 'https://youtube.com/watch?v=...',
    image: 'https://example.com/image.jpg',
    video: 'https://example.com/video.mp4',
    audio: 'https://example.com/audio.mp3'
  }
  return placeholders[effectiveNoteType.value] || 'Enter URL'
})

const contentPlaceholder = computed(() => {
  const placeholders: Record<string, string> = {
    songcode: 'Enter SongCode notation...\n\n[I]ntro\n[V]erse\n[C]horus',
    tablature: 'Enter tablature...\n\ne|--0--2--3--\nB|--0--0--0--\nG|--1--1--1--',
    plain_text: 'Enter your notes...',
    lyrics: 'Enter song lyrics...',
    chords: 'Enter chord progression...',
    looper_notes: 'Enter looper settings and notes...'
  }
  return placeholders[effectiveNoteType.value] || 'Enter content...'
})

const isValid = computed(() => {
  if (effectiveNoteType.value === 'looper') {
    // For looper type, require title, bpm, and pattern1
    return formData.value.title.trim().length > 0 && 
           looperData.value.bpm > 0 && 
           looperData.value.pattern1.trim().length > 0
  }
  return formData.value.title.trim().length > 0 && 
         formData.value.content.trim().length > 0
})

// Methods
onMounted(() => {
  if (props.note) {
    formData.value.title = props.note.title ?? ''
    formData.value.content = props.note.content
    
    // Parse looper data if it's a looper note
    if (props.note.type === 'looper') {
      try {
        const parsed = JSON.parse(props.note.content) as LooperContent
        looperData.value = parsed
      } catch (err) {
        console.error('Failed to parse looper content:', err)
      }
    }
  }
})

async function handleSave() {
  if (!isValid.value) return

  try {
    let content: string
    
    // Serialize looper data as JSON
    if (effectiveNoteType.value === 'looper') {
      content = JSON.stringify(looperData.value)
    } else {
      content = formData.value.content.trim()
    }
    
    if (isEditing.value) {
      await notesStore.updateNote(
        props.note!.id, 
        { title: formData.value.title, content }, 
        props.librarySongId
      )
      uiStore.showToast(MESSAGES.SUCCESS.NOTE_UPDATED, 'success')
    } else {
      await notesStore.createNote(
        props.librarySongId,
        effectiveNoteType.value,
        content,
        formData.value.title.trim()
      )
      uiStore.showToast(MESSAGES.SUCCESS.NOTE_CREATED, 'success')
    }
    
    emit('saved')
  } catch (err) {
    uiStore.showErrorToast(isEditing.value ? 'update note' : 'create note', err as Error)
  }
}
</script>
