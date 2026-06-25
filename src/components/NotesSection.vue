<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold text-white">Notes</h2>
      <button
        v-if="authStore.isEditor"
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
      <BaseLoadingSpinner />
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
            @edited="handleEditNote"
            @deleted="handleDeleteNote"
          />
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <CRUDEmptyState
      v-else
      :title="MESSAGES.EMPTY_NO_NOTES"
      :subtitle="MESSAGES.EMPTY_NO_NOTES_SUBTITLE"
      :ctaText="authStore.isEditor ? 'Add Note' : undefined"
      iconPath="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      @created="showAddNoteMenu = true"
    />

    <!-- Note Editor Drawer -->
    <NoteEditor
      :isOpen="showEditor"
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
import { useAuthStore } from '@/stores/auth'
import type { Note, NoteType } from '@/types/database'
import { NOTE_TYPES } from '@/constants/validation'
import { MESSAGES } from '@/constants/messages'
import { I18N } from '@/constants/i18n'
import NoteCard from './NoteCard.vue'
import NoteEditor from './NoteEditor.vue'
import CRUDEmptyState from './CRUDEmptyState.vue'
import BaseLoadingSpinner from './BaseLoadingSpinner.vue'

interface Props {
  librarySongId: string
}

const props = defineProps<Props>()

const notesStore = useNotesStore()
const uiStore = useUiStore()
const authStore = useAuthStore()

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
  return (I18N.NOTES.TYPE_LABELS as Record<string, string>)[type] ?? type
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
    I18N.BUTTONS.DELETE,
    I18N.BUTTONS.CANCEL
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
  setTimeout(() => {
    editingNote.value = null
    newNoteType.value = null
  }, 300)
}

async function handleNoteSaved() {
  closeEditor()
  // Notes are already reloaded in the store after save
}
</script>
