import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/utils/supabase'
import type { Note, NoteType } from '@/types/database'

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
      grouped[type as NoteType].sort((a, b) => a.display_order - b.display_order)
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
      notes.value = data || []
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
    content: string,
    title?: string
  ): Promise<Note> {
    isLoading.value = true
    error.value = null
    
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id
      
      // Calculate display_order (max + 1 for the type)
      const existingOfType = notes.value.filter(n => n.type === type)
      const maxOrder = existingOfType.length > 0
        ? Math.max(...existingOfType.map(n => n.display_order))
        : -1
      
      const { data, error: createError } = await supabase
        .from('notes')
        .insert({
          library_song_id: librarySongId,
          type,
          content,
          title: title || null,
          created_by: userId,
          updated_by: userId,
          display_order: maxOrder + 1,
        })
        .select()
        .single()
      
      if (createError) throw createError
      
      await loadNotes(librarySongId)
      return data
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
      content?: string
      display_order?: number
    },
    librarySongId: string
  ) {
    isLoading.value = true
    error.value = null
    
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id
      
      const { error: updateError } = await supabase
        .from('notes')
        .update({
          ...updates,
          updated_by: userId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', noteId)
      
      if (updateError) throw updateError
      
      // Reload notes to get fresh data
      await loadNotes(librarySongId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update note'
      throw err
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
      return data
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
    deleteNote,
    reorderNotes,
    getNoteById,
    setCurrentNote,
    clearNotes,
  }
})
