import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { LooperNoteData, Note, NoteType, SongcodeNoteData } from '@livenotes/shared/types'
import { generateLivenotesJson } from '@/utils/songcodeConverter'
import { useAuthStore } from './auth'
import * as noteService from '@/services/noteService'
import { failure, type OperationResult } from '@/utils/operations'

/**
 * Notes Store (V2)
 * Manages notes for library songs (multi-note system)
 */
export const useNotesStore = defineStore('notes', () => {
  // State
  const notes = ref<Note[]>([])
  const currentNote = ref<Note | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const notesByType = computed(() => {
    const grouped: Record<NoteType, Note[]> = {
      songcode: [],
      plain_text: [],
      youtube: [],
      image: [],
      video: [],
      audio: [],
      tablature: [],
      looper_notes: [],
      looper: [],
      lyrics: [],
      chords: [],
    }
    notes.value.forEach(note => {
      if (grouped[note.type]) grouped[note.type].push(note)
    })
    Object.keys(grouped).forEach(type => {
      grouped[type as NoteType].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
    })
    return grouped
  })

  function getNotesByType(type: NoteType): Note[] {
    return notesByType.value[type] || []
  }

  const noteCount = computed(() => notes.value.length)

  // Actions

  // Actions (failures are returned, not thrown: docs/ERROR_HANDLING.md)

  async function run<T>(fallback: string, action: () => Promise<T>): Promise<OperationResult<T>> {
    isLoading.value = true
    error.value = null
    try {
      return { success: true, data: await action() }
    } catch (err) {
      const result = failure(err, fallback)
      error.value = result.error ?? fallback
      return result
    } finally {
      isLoading.value = false
    }
  }

  async function refreshNotes(librarySongId: string): Promise<void> {
    notes.value = await noteService.fetchNotes(librarySongId)
  }

  function loadNotes(librarySongId: string): Promise<OperationResult> {
    return run('Failed to load notes', () => refreshNotes(librarySongId))
  }

  async function createNote(
    librarySongId: string,
    type: NoteType,
    content: string | null,
    title?: string,
    data?: SongcodeNoteData | LooperNoteData | null
  ): Promise<OperationResult<Note>> {
    return run('Failed to create note', async () => {
      let resolvedData: SongcodeNoteData | LooperNoteData | null = data ?? null
      if (type === 'songcode' && content) {
        const conversionResult = await generateLivenotesJson(content)
        if (!conversionResult.success) throw new Error(conversionResult.error)
        resolvedData = {
          ...resolvedData,
          livenotes_json: conversionResult.json,
          livenotes_json_updated_at: new Date().toISOString(),
        } satisfies SongcodeNoteData
      }

      const authStore = useAuthStore()
      if (!authStore.userId) throw new Error('User not authenticated')

      const existingOfType = notes.value.filter(n => n.type === type)
      const maxOrder = existingOfType.length > 0
        ? Math.max(...existingOfType.map(n => n.display_order ?? -1))
        : -1

      const created = await noteService.insertNote({
        library_song_id: librarySongId,
        type,
        content: content ?? null,
        data: resolvedData,
        title: title || null,
        created_by: authStore.userId,
        updated_by: authStore.userId,
        display_order: maxOrder + 1,
      })

      await refreshNotes(librarySongId)
      return created
    })
  }

  async function updateNote(
    noteId: string,
    updates: {
      title?: string
      content?: string | null
      display_order?: number
      data?: SongcodeNoteData | LooperNoteData | null
    },
    librarySongId: string,
    noteType?: NoteType
  ): Promise<OperationResult> {
    return run('Failed to update note', async () => {
      const resolvedUpdates = { ...updates }
      if (noteType === 'songcode' && updates.content !== undefined && updates.content) {
        const conversionResult = await generateLivenotesJson(updates.content)
        if (!conversionResult.success) throw new Error(conversionResult.error)
        resolvedUpdates.data = {
          livenotes_json: conversionResult.json,
          livenotes_json_updated_at: new Date().toISOString(),
        } satisfies SongcodeNoteData
      }

      const authStore = useAuthStore()
      if (!authStore.userId) throw new Error('User not authenticated')

      await noteService.updateNote(noteId, resolvedUpdates, authStore.userId)
      await refreshNotes(librarySongId)
    })
  }

  function deleteNote(noteId: string, librarySongId: string): Promise<OperationResult> {
    return run('Failed to delete note', async () => {
      await noteService.deleteNote(noteId)
      await refreshNotes(librarySongId)
    })
  }

  function reorderNotes(noteIds: string[], _type: NoteType): Promise<OperationResult> {
    return run('Failed to reorder notes', async () => {
      await noteService.reorderNotes(noteIds)
      notes.value = notes.value.map(note => {
        const newOrder = noteIds.indexOf(note.id)
        return newOrder !== -1 ? { ...note, display_order: newOrder } : note
      })
    })
  }

  async function getNoteById(noteId: string): Promise<Note | null> {
    try {
      return await noteService.getNoteById(noteId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch note'
      return null
    }
  }

  function setCurrentNote(note: Note | null) {
    currentNote.value = note
  }

  function clearNotes() {
    notes.value = []
    currentNote.value = null
  }

  return {
    notes,
    currentNote,
    isLoading,
    error,
    notesByType,
    getNotesByType,
    noteCount,
    loadNotes,
    createNote,
    updateNote,
    deleteNote,
    reorderNotes,
    getNoteById,
    setCurrentNote,
    clearNotes,
  }
})
