import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/utils/supabase'
import type { Note, NoteType, SongcodeNoteData } from '@/types/database'
import { generateLivenotesJson } from '@/utils/songcodeConverter'
import { useUiStore } from './ui'

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
  
  /**
   * Notes grouped by type
   */
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
      if (grouped[note.type]) {
        grouped[note.type].push(note)
      }
    })
    
    // Sort each group by display_order
    Object.keys(grouped).forEach(type => {
      grouped[type as NoteType].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
    })
    
    return grouped
  })

  /**
   * Get notes of a specific type
   */
  function getNotesByType(type: NoteType): Note[] {
    return notesByType.value[type] || []
  }

  const noteCount = computed(() => notes.value.length)

  // Actions
  
  /**
   * Load all notes for a library song
   */
  async function loadNotes(librarySongId: string) {
    isLoading.value = true
    error.value = null
    
    try {
      const { data, error: fetchError } = await supabase
        .from('notes')
        .select('*')
        .eq('library_song_id', librarySongId)
        .order('type')
        .order('display_order')
      
      if (fetchError) throw fetchError
      notes.value = (data || []) as unknown as Note[]
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load notes'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Create a new note
   */
  async function createNote(
    librarySongId: string,
    type: NoteType,
    content: string | null,
    title?: string,
    data?: Record<string, any> | null
  ): Promise<Note> {
    isLoading.value = true
    error.value = null

    try {
      // For songcode, auto-generate livenotes JSON before saving
      let resolvedData = data ?? null
      if (type === 'songcode' && content) {
        const conversionResult = await generateLivenotesJson(content)
        if (!conversionResult.success) throw new Error(conversionResult.error)
        resolvedData = {
          ...resolvedData,
          livenotes_json: conversionResult.json,
          livenotes_json_updated_at: new Date().toISOString(),
        } satisfies SongcodeNoteData
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Calculate display_order (max + 1 for the type)
      const existingOfType = notes.value.filter(n => n.type === type)
      const maxOrder = existingOfType.length > 0
        ? Math.max(...existingOfType.map(n => n.display_order ?? -1))
        : -1

      const { data: created, error: createError } = await supabase
        .from('notes')
        .insert({
          library_song_id: librarySongId,
          type,
          content: content ?? null,
          data: resolvedData as Record<string, any>,
          title: title || null,
          created_by: user.id,
          updated_by: user.id,
          display_order: maxOrder + 1,
        })
        .select()
        .single()

      if (createError) throw createError

      await loadNotes(librarySongId)
      return created as unknown as Note
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create note'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Update a note
   */
  async function updateNote(
    noteId: string,
    updates: {
      title?: string
      content?: string | null
      display_order?: number
      data?: Record<string, any> | null
    },
    librarySongId: string,
    noteType?: NoteType
  ) {
    isLoading.value = true
    error.value = null

    try {
      // For songcode, auto-generate livenotes JSON when content is being updated
      const resolvedUpdates = { ...updates }
      if (noteType === 'songcode' && updates.content !== undefined && updates.content) {
        const conversionResult = await generateLivenotesJson(updates.content)
        if (!conversionResult.success) throw new Error(conversionResult.error)
        resolvedUpdates.data = {
          livenotes_json: conversionResult.json,
          livenotes_json_updated_at: new Date().toISOString(),
        } satisfies SongcodeNoteData
      }

      const { data: { user: updateUser } } = await supabase.auth.getUser()
      if (!updateUser) throw new Error('User not authenticated')

      const { error: updateError } = await supabase
        .from('notes')
        .update({
          ...resolvedUpdates,
          data: resolvedUpdates.data as Record<string, any> | null,
          updated_by: updateUser.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', noteId)

      if (updateError) throw updateError

      await loadNotes(librarySongId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update note'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Generate livenotes JSON from a songcode note's content and store it in note.data
   */
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

      const { data: { user: genUser } } = await supabase.auth.getUser()
      if (!genUser) throw new Error('User not authenticated')

      const newData: SongcodeNoteData = {
        livenotes_json: conversionResult.json,
        livenotes_json_updated_at: new Date().toISOString(),
      }

      const { error: updateError } = await supabase
        .from('notes')
        .update({ data: newData as Record<string, any>, updated_by: genUser.id, updated_at: new Date().toISOString() })
        .eq('id', noteId)

      if (updateError) throw updateError

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

  /**
   * Delete a note
   */
  async function deleteNote(noteId: string, librarySongId: string) {
    isLoading.value = true
    error.value = null
    
    try {
      const { error: deleteError } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)
      
      if (deleteError) throw deleteError
      
      await loadNotes(librarySongId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete note'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Reorder notes of the same type
   */
  async function reorderNotes(noteIds: string[], _type: NoteType) {
    isLoading.value = true
    error.value = null
    
    try {
      // Update display_order for each note
      const updates = noteIds.map((id, index) => ({
        id,
        display_order: index,
      }))
      
      for (const update of updates) {
        await supabase
          .from('notes')
          .update({ display_order: update.display_order })
          .eq('id', update.id)
      }
      
      // Update local state
      notes.value = notes.value.map(note => {
        const newOrder = updates.find(u => u.id === note.id)
        return newOrder ? { ...note, display_order: newOrder.display_order } : note
      })
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to reorder notes'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get a single note by ID
   */
  async function getNoteById(noteId: string): Promise<Note | null> {
    try {
      const { data, error: fetchError } = await supabase
        .from('notes')
        .select('*')
        .eq('id', noteId)
        .single()
      
      if (fetchError) throw fetchError
      return data as unknown as Note
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch note'
      return null
    }
  }

  /** Set current note */
  function setCurrentNote(note: Note | null) {
    currentNote.value = note
  }

  /** Clear all notes (when navigating away) */
  function clearNotes() {
    notes.value = []
    currentNote.value = null
  }

  return {
    // State
    notes,
    currentNote,
    isLoading,
    error,
    
    // Getters
    notesByType,
    getNotesByType,
    noteCount,
    
    // Actions
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
