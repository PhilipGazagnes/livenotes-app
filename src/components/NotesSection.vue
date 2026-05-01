<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold text-white">Notes</h2>
      <button
        @click="showAddNoteMenu = !showAddNoteMenu"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
      >
        + Add Note
      </button>
    </div>

    <!-- Add Note Type Menu -->
    <div v-if="showAddNoteMenu" class="bg-gray-900 rounded-lg p-4">
      <p class="text-sm text-gray-400 mb-3">Select note type:</p>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <button
          v-for="type in NOTE_TYPES"
          :key="type"
          @click="handleAddNote(type)"
          class="px-3 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 transition-colors text-left"
        >
          {{ noteTypeLabel(type) }}
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="notesStore.isLoading" class="flex items-center justify-center py-8">
      <LoadingSpinner />
    </div>

    <!-- Notes grouped by type -->
    <div v-else-if="hasNotes" class="space-y-6">
      <div
        v-for="(typeNotes, type) in notesWithContent"
        :key="type"
        class="space-y-3"
      >
        <h3 class="text-lg font-medium text-gray-300">
          {{ noteTypeLabel(type as NoteType) }}
          <span class="text-sm text-gray-500 ml-2">({{ typeNotes.length }})</span>
        </h3>
        
        <div class="space-y-2">
          <NoteCard
            v-for="note in typeNotes"
            :key="note.id"
            :note="note"
            @edit="handleEditNote"
            @delete="handleDeleteNote"
          />
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <CRUDEmptyState
      v-else
      :title="MESSAGES.EMPTY_NO_NOTES"
      :subtitle="MESSAGES.EMPTY_NO_NOTES_SUBTITLE"
      ctaText="Add Note"
      iconPath="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      @create="showAddNoteMenu = true"
    />

    <!-- Note Editor Modal -->
    <NoteEditor
      v-if="showEditor"
      :note="editingNote"
      :library-song-id="librarySongId"
      :note-type="newNoteType"
      @close="closeEditor"
      @saved="handleNoteSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useNotesStore } from '@/stores/notes'
import { useUiStore } from '@/stores/ui'
import type { Note, NoteType } from '@/types/database'
import { NOTE_TYPES } from '@/constants/validation'
import { MESSAGES } from '@/constants/messages'
import NoteCard from './NoteCard.vue'
import NoteEditor from './NoteEditor.vue'
import CRUDEmptyState from './CRUDEmptyState.vue'
import LoadingSpinner from './LoadingSpinner.vue'

interface Props {
  librarySongId: string
}

const props = defineProps<Props>()

const notesStore = useNotesStore()
const uiStore = useUiStore()

const showAddNoteMenu = ref(false)
const showEditor = ref(false)
const editingNote = ref<Note | null>(null)
const newNoteType = ref<NoteType | null>(null)

// Computed
const hasNotes = computed(() => notesStore.noteCount > 0)

const notesWithContent = computed(() => {
  const grouped = notesStore.notesByType
  // Only return types that have notes
  return Object.fromEntries(
    Object.entries(grouped).filter(([_, notes]) => notes.length > 0)
  )
})

// Methods
onMounted(async () => {
  await notesStore.loadNotes(props.librarySongId)
})

function noteTypeLabel(type: NoteType): string {
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
  return labels[type] || type
}

function handleAddNote(type: NoteType) {
  editingNote.value = null
  newNoteType.value = type
  showEditor.value = true
  showAddNoteMenu.value = false
}

function handleEditNote(note: Note) {
  editingNote.value = note
  newNoteType.value = null
  showEditor.value = true
}

async function handleDeleteNote(note: Note) {
  const confirmed = await uiStore.showConfirm(
    'Delete Note',
    MESSAGES.CONFIRM_DELETE_NOTE(note.title),
    'Delete',
    'Cancel'
  )

  if (!confirmed) return

  try {
    await notesStore.deleteNote(note.id, props.librarySongId)
    uiStore.showToast(MESSAGES.SUCCESS.NOTE_DELETED, 'success')
  } catch (err) {
    uiStore.showErrorToast('delete note', err as Error)
  }
}

function closeEditor() {
  showEditor.value = false
  editingNote.value = null
  newNoteType.value = null
}

async function handleNoteSaved() {
  closeEditor()
  // Notes are already reloaded in the store after save
}
</script>
