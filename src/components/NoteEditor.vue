<template>
  <CRUDModal
    :isOpen="true"
    :title="isEditing ? 'Edit Note' : `New ${noteTypeLabel} Note`"
    :primaryAction="isEditing ? 'Save' : 'Create'"
    :isPrimaryDisabled="!isValid"
    @close="$emit('close')"
    @primary="handleSave"
  >
    <form @submit.prevent="handleSave" class="space-y-4">
      <!-- Title -->
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">
          Title <span class="text-red-500">*</span>
        </label>
        <input
          v-model="formData.title"
          type="text"
          :maxlength="NOTE_TITLE_MAX_LENGTH"
          placeholder="Enter note title"
          class="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <p class="text-xs text-gray-500 mt-1">
          {{ formData.title.length }} / {{ NOTE_TITLE_MAX_LENGTH }}
        </p>
      </div>

      <!-- Content (varies by note type) -->
      <div>
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
          :maxlength="NOTE_CONTENT_MAX_LENGTH"
          :rows="15"
          :placeholder="contentPlaceholder"
          class="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono text-sm resize-none"
        />

        <!-- Textarea for text types -->
        <textarea
          v-else
          v-model="formData.content"
          :maxlength="NOTE_CONTENT_MAX_LENGTH"
          :rows="10"
          :placeholder="contentPlaceholder"
          class="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
        />

        <p v-if="!isUrlType" class="text-xs text-gray-500 mt-1">
          {{ formData.content.length }} / {{ NOTE_CONTENT_MAX_LENGTH }}
        </p>
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
  </CRUDModal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useNotesStore } from '@/stores/notes'
import { useUiStore } from '@/stores/ui'
import type { Note, NoteType } from '@/types/database'
import { NOTE_TITLE_MAX_LENGTH, NOTE_CONTENT_MAX_LENGTH } from '@/constants/validation'
import { MESSAGES } from '@/constants/messages'
import CRUDModal from './CRUDModal.vue'

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
  return formData.value.title.trim().length > 0 && 
         formData.value.content.trim().length > 0
})

// Methods
onMounted(() => {
  if (props.note) {
    formData.value.title = props.note.title
    formData.value.content = props.note.content
  }
})

async function handleSave() {
  if (!isValid.value) return

  try {
    if (isEditing.value) {
      await notesStore.updateNote(props.note!.id, formData.value, props.librarySongId)
      uiStore.showToast(MESSAGES.SUCCESS.NOTE_UPDATED, 'success')
    } else {
      await notesStore.createNote(
        props.librarySongId,
        effectiveNoteType.value,
        formData.value.content.trim(),
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
