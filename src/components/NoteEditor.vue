<template>
  <!-- Header -->
  <div class="flex-shrink-0 bg-gray-800 border-b border-gray-700 p-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold text-white">
        {{ isEditing ? `${I18N.BUTTONS.EDIT} ${noteTypeLabel}` : I18N.NOTES.NEW_NOTE(noteTypeLabel) }}
      </h2>
      <button
        @click="drawerStore.pop()"
        :aria-label="I18N.ARIA.CLOSE"
        class="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  </div>

  <!-- Content -->
  <div class="flex-1 overflow-y-auto p-6">
    <form @submit.prevent="handleSave" class="space-y-4 h-full flex flex-col">
      <!-- Title -->
      <div class="flex-shrink-0">
        <label class="block text-sm font-medium text-gray-300 mb-2">{{ I18N.FORM.TITLE }}</label>
        <input
          v-model="formData.title"
          type="text"
          :maxlength="VALIDATION.NOTE_TITLE_MAX_LENGTH"
          :placeholder="I18N.PLACEHOLDERS.NOTE_TITLE"
          class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <p class="text-xs text-gray-500 mt-1">{{ formData.title.length }} / {{ VALIDATION.NOTE_TITLE_MAX_LENGTH }}</p>
      </div>

      <!-- Content (varies by note type) -->
      <div v-if="effectiveNoteType !== 'looper'" class="flex flex-col flex-1 min-h-0">
        <label class="block text-sm font-medium text-gray-300 mb-2 flex-shrink-0">{{ I18N.NOTES.URL_CONTENT }}</label>

        <input
          v-if="isUrlType"
          v-model="formData.content"
          type="url"
          :placeholder="urlPlaceholder"
          class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />

        <textarea
          v-else-if="isFormattedType"
          v-model="formData.content"
          :maxlength="VALIDATION.NOTE_CONTENT_MAX_LENGTH"
          :placeholder="contentPlaceholder"
          class="flex-1 w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono text-sm resize-none"
        />

        <textarea
          v-else
          v-model="formData.content"
          :maxlength="VALIDATION.NOTE_CONTENT_MAX_LENGTH"
          :rows="10"
          :placeholder="contentPlaceholder"
          class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
        />

        <p v-if="!isUrlType" class="text-xs text-gray-500 mt-1 flex-shrink-0">
          {{ formData.content.length }} / {{ VALIDATION.NOTE_CONTENT_MAX_LENGTH }}
        </p>
      </div>

      <!-- Looper form -->
      <div v-else class="space-y-4 flex-shrink-0">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">{{ I18N.NOTES.LOOPER_BPM }}</label>
          <input v-model="looperData.bpm" type="text" :placeholder="I18N.PLACEHOLDERS.LOOPER_BPM"
            class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">{{ I18N.NOTES.LOOPER_PATTERN }} 1</label>
          <input v-model="looperData.pattern1" type="text" :placeholder="I18N.PLACEHOLDERS.LOOPER_PATTERN"
            class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">{{ I18N.NOTES.LOOPER_PATTERN }} 1 Variation</label>
          <input v-model="looperData.pattern1_var" type="text" :placeholder="I18N.PLACEHOLDERS.LOOPER_PATTERN"
            class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">{{ I18N.NOTES.LOOPER_PATTERN }} 2</label>
          <input v-model="looperData.pattern2" type="text" :placeholder="I18N.PLACEHOLDERS.LOOPER_PATTERN"
            class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">{{ I18N.NOTES.LOOPER_PATTERN }} 2 Variation</label>
          <input v-model="looperData.pattern2_var" type="text" :placeholder="I18N.PLACEHOLDERS.LOOPER_PATTERN"
            class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">{{ I18N.NOTES.LOOPER_ADDITIONAL_NOTES }}</label>
          <textarea v-model="looperData.comment" rows="3" :placeholder="I18N.PLACEHOLDERS.LOOPER_NOTES"
            class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none" />
        </div>
      </div>
    </form>
  </div>

  <!-- Footer -->
  <div class="flex-shrink-0 bg-gray-800 border-t border-gray-700 p-4 flex gap-3">
    <button
      @click="drawerStore.pop()"
      class="flex-1 px-4 py-3 text-gray-400 hover:text-white transition-colors rounded-lg"
    >
      {{ I18N.BUTTONS.CANCEL }}
    </button>
    <button
      @click="handleSave"
      :disabled="isSaving"
      class="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {{ isSaving ? I18N.LOADING.SAVING : (isEditing ? I18N.BUTTONS.SAVE : I18N.BUTTONS.CREATE) }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDrawerStore } from '@/stores/drawer'
import { useNotesStore } from '@/stores/notes'
import { useUiStore } from '@/stores/ui'
import type { Note, NoteType, LooperContent } from '@/types/database'
import { VALIDATION } from '@/constants/validation'
import { MESSAGES } from '@/constants/messages'
import { I18N } from '@/constants/i18n'

const props = defineProps<{
  note?: Note | null
  librarySongId: string
  noteType?: NoteType | null
  onSaved?: (updatedNote: Note) => void
}>()

const drawerStore = useDrawerStore()
const notesStore = useNotesStore()
const uiStore = useUiStore()

const isSaving = ref(false)

const formData = ref({ title: '', content: '' })

const looperData = ref<LooperContent>({
  bpm: '', pattern1: '', pattern1_var: '', pattern2: '', pattern2_var: '', comment: ''
})

onMounted(() => {
  formData.value.title = props.note?.title ?? ''
  formData.value.content = props.note?.content ?? ''
  if (props.note?.type === 'looper' && props.note.data) {
    looperData.value = props.note.data as LooperContent
  } else {
    looperData.value = { bpm: '', pattern1: '', pattern1_var: '', pattern2: '', pattern2_var: '', comment: '' }
  }
})

const isEditing = computed(() => !!props.note)
const effectiveNoteType = computed(() => props.note?.type || props.noteType!)

const noteTypeLabel = computed(() => {
  return (I18N.NOTES.TYPE_LABELS as Record<string, string>)[effectiveNoteType.value] ?? effectiveNoteType.value
})

const isUrlType = computed(() => ['youtube', 'image', 'video', 'audio'].includes(effectiveNoteType.value))
const isFormattedType = computed(() => ['songcode', 'tablature'].includes(effectiveNoteType.value))

const urlPlaceholder = computed(() => {
  const placeholders: Record<string, string> = {
    youtube: 'https://youtube.com/watch?v=...',
    image: 'https://example.com/image.jpg',
    video: 'https://example.com/video.mp4',
    audio: 'https://example.com/audio.mp3'
  }
  return placeholders[effectiveNoteType.value] || I18N.NOTES.URL_LABEL
})

const contentPlaceholder = computed(() => {
  const placeholders: Record<string, string> = {
    songcode: I18N.PLACEHOLDERS.NOTE_SONGCODE,
    tablature: I18N.PLACEHOLDERS.NOTE_SONGCODE,
    plain_text: I18N.PLACEHOLDERS.NOTE_CONTENT,
    lyrics: I18N.PLACEHOLDERS.NOTE_CONTENT,
    chords: I18N.PLACEHOLDERS.NOTE_CONTENT,
    looper_notes: I18N.PLACEHOLDERS.LOOPER_NOTES,
  }
  return placeholders[effectiveNoteType.value] || I18N.PLACEHOLDERS.NOTE_CONTENT
})

async function handleSave() {
  if (isSaving.value) return
  isSaving.value = true

  try {
    if (isEditing.value) {
      if (effectiveNoteType.value === 'looper') {
        await notesStore.updateNote(
          props.note!.id,
          { title: formData.value.title, data: looperData.value },
          props.librarySongId
        )
      } else {
        await notesStore.updateNote(
          props.note!.id,
          { title: formData.value.title, content: formData.value.content.trim() },
          props.librarySongId,
          effectiveNoteType.value
        )
      }
      uiStore.showToast(MESSAGES.SUCCESS.NOTE_UPDATED, 'success')
      // notesStore.updateNote calls loadNotes internally, so notes are fresh
      const updatedNote = notesStore.notes.find(n => n.id === props.note!.id)
      drawerStore.pop()
      if (updatedNote) props.onSaved?.(updatedNote)
    } else {
      if (effectiveNoteType.value === 'looper') {
        await notesStore.createNote(props.librarySongId, effectiveNoteType.value, null, formData.value.title.trim(), looperData.value)
      } else {
        await notesStore.createNote(props.librarySongId, effectiveNoteType.value, formData.value.content.trim(), formData.value.title.trim())
      }
      uiStore.showToast(MESSAGES.SUCCESS.NOTE_CREATED, 'success')
      drawerStore.pop()
      props.onSaved?.(null as unknown as Note)
    }
  } catch (err) {
    uiStore.showErrorToast(isEditing.value ? 'update note' : 'create note', err as Error)
  } finally {
    isSaving.value = false
  }
}
</script>
