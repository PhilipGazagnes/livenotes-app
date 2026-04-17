import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/utils/supabase'
import type { List, ListWithItems } from '@/types/database'
import { useAuthStore } from './auth'

export const useListsStore = defineStore('lists', () => {
  // State
  const lists = ref<List[]>([])
  const currentList = ref<ListWithItems | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const listCount = computed(() => lists.value.length)
  const listsByName = computed(() => {
    return [...lists.value].sort((a, b) => a.name.localeCompare(b.name))
  })

  // Actions
  async function fetchLists(projectId: string) {
    isLoading.value = true
    error.value = null
    
    try {
      const { data, error: fetchError } = await supabase
        .from('lists')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
      
      if (fetchError) throw fetchError
      lists.value = data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch lists'
    } finally {
      isLoading.value = false
    }
  }

  async function fetchListById(listId: string) {
    isLoading.value = true
    error.value = null
    
    try {
      const { data: listData, error: listError } = await supabase
        .from('lists')
        .select('*')
        .eq('id', listId)
        .single()
      
      if (listError) throw listError
      
      const { data: itemsData, error: itemsError } = await supabase
        .from('list_items')
        .select(`
          *,
          song:songs(
            *,
            tags:song_tags(tag:tags(*)),
            artists:song_artists(
              position,
              artist:artists(*)
            )
          )
        `)
        .eq('list_id', listId)
        .order('position', { ascending: true })
      
      if (itemsError) throw itemsError
      
      // Transform the nested tags and artists structure
      const transformedItems = itemsData?.map(item => ({
        ...item,
        song: item.song ? {
          ...item.song,
          tags: item.song.tags?.map((st: any) => st.tag) || [],
          artists: item.song.artists?.map((sa: any) => ({
            ...sa.artist,
            position: sa.position
          })).sort((a: any, b: any) => a.position - b.position) || []
        } : null
      })) || []
      
      currentList.value = {
        ...listData,
        items: transformedItems
      }
      
      return currentList.value
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch list'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function createList(projectId: string, name: string, description?: string) {
    const authStore = useAuthStore()
    if (!authStore.userId) {
      error.value = 'User not authenticated'
      return { success: false, error: error.value }
    }

    isLoading.value = true
    error.value = null
    
    try {
      const { data: newList, error: createError } = await supabase
        .from('lists')
        .insert({
          project_id: projectId,
          name: name.trim(),
          description: description?.trim(),
          created_by: authStore.userId,
        })
        .select()
        .single()
      
      if (createError) throw createError
      
      lists.value.unshift(newList)
      
      return { success: true, data: newList }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create list'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function updateList(listId: string, updates: { name?: string; description?: string }) {
    isLoading.value = true
    error.value = null
    
    try {
      const cleanUpdates: any = {}
      if (updates.name !== undefined) cleanUpdates.name = updates.name.trim()
      if (updates.description !== undefined) cleanUpdates.description = updates.description.trim()

      const { data: updatedList, error: updateError } = await supabase
        .from('lists')
        .update(cleanUpdates)
        .eq('id', listId)
        .select()
        .single()
      
      if (updateError) throw updateError
      
      const index = lists.value.findIndex(l => l.id === listId)
      if (index !== -1) {
        lists.value[index] = updatedList
      }
      
      if (currentList.value?.id === listId) {
        currentList.value = { ...currentList.value, ...updatedList }
      }
      
      return { success: true, data: updatedList }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update list'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function deleteList(listId: string) {
    isLoading.value = true
    error.value = null
    
    try {
      const { error: deleteError } = await supabase
        .from('lists')
        .delete()
        .eq('id', listId)
      
      if (deleteError) throw deleteError
      
      lists.value = lists.value.filter(l => l.id !== listId)
      
      if (currentList.value?.id === listId) {
        currentList.value = null
      }
      
      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete list'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function bulkDeleteLists(listIds: string[], projectId: string) {
    isLoading.value = true
    error.value = null
    
    try {
      const { error: deleteError } = await supabase
        .from('lists')
        .delete()
        .in('id', listIds)
      
      if (deleteError) throw deleteError
      
      // Refresh lists
      await fetchLists(projectId)
      
      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete lists'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function addSongToList(listId: string, songId: string) {
    isLoading.value = true
    error.value = null
    
    try {
      // Get current max position
      const { data: items, error: fetchError } = await supabase
        .from('list_items')
        .select('position')
        .eq('list_id', listId)
        .order('position', { ascending: false })
        .limit(1)
      
      if (fetchError) throw fetchError
      
      const nextPosition = items.length > 0 ? items[0].position + 1 : 0
      
      const { error: insertError } = await supabase
        .from('list_items')
        .insert({
          list_id: listId,
          song_id: songId,
          position: nextPosition,
        })
      
      if (insertError) throw insertError
      
      // Refresh current list if it's the one we're updating
      if (currentList.value?.id === listId) {
        await fetchListById(listId)
      }
      
      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add song to list'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function removeSongFromList(listId: string, songId: string) {
    isLoading.value = true
    error.value = null
    
    try {
      const { error: deleteError } = await supabase
        .from('list_items')
        .delete()
        .eq('list_id', listId)
        .eq('song_id', songId)
      
      if (deleteError) throw deleteError
      
      // Update local state instead of re-fetching everything
      if (currentList.value?.id === listId) {
        currentList.value.items = currentList.value.items.filter(
          item => item.song_id !== songId
        )
      }
      
      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to remove song from list'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function reorderListItems(_listId: string, itemIds: string[]) {
    // No loading state - this is a background operation with optimistic UI
    error.value = null
    
    try {
      // Build batch update with new positions
      const itemPositions = itemIds.map((id, index) => ({
        id,
        position: index
      }))
      
      // Call PostgreSQL function to batch update positions (bypasses RLS)
      const { error: rpcError } = await supabase.rpc('update_list_item_positions', {
        item_positions: itemPositions
      })
      
      if (rpcError) throw rpcError
      
      // Don't refresh - UI already updated optimistically
      // Only refresh on error (handled in component)
      
      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to reorder list items'
      return { success: false, error: error.value }
    }
  }

  return {
    // State
    lists,
    currentList,
    isLoading,
    error,
    // Getters
    listCount,
    listsByName,
    // Actions
    fetchLists,
    fetchListById,
    createList,
    updateList,
    deleteList,
    bulkDeleteLists,
    addSongToList,
    removeSongFromList,
    reorderListItems,
  }
})
