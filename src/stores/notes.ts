import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { LooperNoteData, Note, NoteType, SongcodeNoteData } from '@/types/database'
import { generateLivenotesJson } from '@/utils/songcodeConverter'
import { useUiStore } from './ui'
import { useAuthStore } from './auth'
import * as noteService from '@/services/noteService'

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

  async function loadNotes(librarySongId: string) {
    isLoading.value = true
    error.value = null
    try {
      notes.value = await noteService.fetchNotes(librarySongId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load notes'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function createNote(
    librarySongId: string,
    type: NoteType,
    content: string | null,
    title?: string,
    data?: SongcodeNoteData | LooperNoteData | null
  ): Promise<Note> {
    isLoading.value = true
    error.value = null
    try {
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

      await loadNotes(librarySongId)
      return created
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create note'
      throw err
    } finally {
      isLoading.value = false
    }
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
  ) {
    isLoading.value = true
    error.value = null
    try {
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
      await loadNotes(librarySongId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update note'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function generateSongcodeJson(noteId: string, librarySongId: string): Promise<{ success: boolean; error?: string }> {
    const uiStore = useUiStore()
    const note = notes.value.find(n => n.id === noteId)
    if (!note || note.type !== 'songcode') return { success: false, error: 'Note not found or not a songcode note' }
    if (!note.content) return { success: false, error: 'No songcode content to convert' }

    isLoading.value = true
    error.value = null
    try {
      const conversionResult = await generateLivenotesJson(note.content)
      if (!conversionResult.success) throw new Error(conversionResult.error)

      const authStore = useAuthStore()
      if (!authStore.userId) throw new Error('User not authenticated')

      const newData: SongcodeNoteData = {
        livenotes_json: conversionResult.json,
        livenotes_json_updated_at: new Date().toISOString(),
      }

      await noteService.updateNote(noteId, { data: newData }, authStore.userId)
      await loadNotes(librarySongId)
      uiStore.showToast('Livenotes JSON generated', 'success')
      return { success: true }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate JSON'
      error.value = msg
      uiStore.showToast(msg, 'error')
      return { success: false, error: msg }
    } finally {
      isLoading.value = false
    }
  }

  async function deleteNote(noteId: string, librarySongId: string) {
    isLoading.value = true
    error.value = null
    try {
      await noteService.deleteNote(noteId)
      await loadNotes(librarySongId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete note'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function reorderNotes(noteIds: string[], _type: NoteType) {
    isLoading.value = true
    error.value = null
    try {
      await noteService.reorderNotes(noteIds)
      notes.value = notes.value.map(note => {
        const newOrder = noteIds.indexOf(note.id)
        return newOrder !== -1 ? { ...note, display_order: newOrder } : note
      })
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to reorder notes'
      throw err
    } finally {
      isLoading.value = false
    }
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
    generateSongcodeJson,
    deleteNote,
    reorderNotes,
    getNoteById,
    setCurrentNote,
    clearNotes,
  }
})
