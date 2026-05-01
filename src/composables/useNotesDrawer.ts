import { ref } from 'vue'
import { useUiStore } from '@/stores/ui'
import { fetchLibrarySongWithDetails } from '@/services/libraryService'
import type { Note } from '@/types/database'

export function useNotesDrawer() {
  const uiStore = useUiStore()

  const editingNote = ref<Note | null>(null)
  const noteEditorOpen = ref(false)

  function handleNoteClick(note: Note) {
    uiStore.openNoteContentDrawer(note)
  }

  function handleAddNote() {
    uiStore.openNoteCreationDrawer()
  }

  async function handleNoteSaved() {
    if (uiStore.selectedLibrarySong) {
      try {
        uiStore.selectedLibrarySong = await fetchLibrarySongWithDetails(uiStore.selectedLibrarySong.id)
      } catch (err) {
        console.error('Failed to refresh library song:', err)
      }
    }
  }

  function handleEditNote(note: Note) {
    editingNote.value = note
    noteEditorOpen.value = true
  }

  function closeNoteEditor() {
    noteEditorOpen.value = false
    setTimeout(() => { editingNote.value = null }, 300)
  }

  async function handleDeleteNote(note: Note) {
    const confirmed = await uiStore.showConfirm(
      'Delete Note',
      `Are you sure you want to delete this ${note.title || 'note'}?`,
      'Delete',
      'Cancel'
    )

    if (!confirmed) return

    uiStore.closeNoteContentDrawer()
    uiStore.showToast('Delete note functionality coming soon', 'success')
  }

  return {
    editingNote,
    noteEditorOpen,
    handleNoteClick,
    handleAddNote,
    handleNoteSaved,
    handleEditNote,
    closeNoteEditor,
    handleDeleteNote,
  }
}
