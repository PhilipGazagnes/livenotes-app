import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { List, ListWithItems } from '@/types/database'
import { useAuthStore } from './auth'
import * as listService from '@/services/listService'

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
  async function fetchLists(projectId: string, { force = false } = {}) {
    if (!force && lists.value.length > 0) return
    isLoading.value = true
    error.value = null
    try {
      lists.value = await listService.fetchLists(projectId)
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
      currentList.value = await listService.fetchListWithItems(listId)
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
      const newList = await listService.insertList(projectId, name, description, authStore.userId)
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
      const updatedList = await listService.updateList(listId, updates)
      const index = lists.value.findIndex(l => l.id === listId)
      if (index !== -1) lists.value[index] = updatedList
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
      await listService.deleteList(listId)
      lists.value = lists.value.filter(l => l.id !== listId)
      if (currentList.value?.id === listId) currentList.value = null
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
      await listService.bulkDeleteLists(listIds)
      await fetchLists(projectId, { force: true })
      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete lists'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function addLibrarySongToList(listId: string, librarySongId: string) {
    isLoading.value = true
    error.value = null
    try {
      const position = await listService.fetchListMaxPosition(listId)
      await listService.insertLibrarySongToList(listId, librarySongId, position)
      if (currentList.value?.id === listId) await fetchListById(listId)
      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add song to list'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function removeLibrarySongFromList(listId: string, librarySongId: string) {
    isLoading.value = true
    error.value = null
    try {
      await listService.deleteLibrarySongFromList(listId, librarySongId)
      if (currentList.value?.id === listId) {
        currentList.value.items = currentList.value.items.filter(
          item => item.library_song_id !== librarySongId
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

  async function bulkAddLibrarySongsToList(listId: string, librarySongIds: string[]) {
    isLoading.value = true
    error.value = null
    try {
      const startPosition = await listService.fetchListMaxPosition(listId)
      for (let i = 0; i < librarySongIds.length; i++) {
        await listService.insertLibrarySongToList(listId, librarySongIds[i], startPosition + i)
      }
      if (currentList.value?.id === listId) await fetchListById(listId)
      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add songs to list'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  // Legacy V1 methods (kept for backward compatibility during migration)
  async function addSongToList(listId: string, songId: string) {
    isLoading.value = true
    error.value = null
    try {
      const position = await listService.fetchListMaxPosition(listId)
      await listService.insertSongToList(listId, songId, position)
      if (currentList.value?.id === listId) await fetchListById(listId)
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
      await listService.deleteSongFromList(listId, songId)
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
    error.value = null
    try {
      const itemPositions = itemIds.map((id, index) => ({ id, position: index }))
      await listService.reorderListItems(itemPositions)
      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to reorder list items'
      return { success: false, error: error.value }
    }
  }

  return {
    lists,
    currentList,
    isLoading,
    error,
    listCount,
    listsByName,
    fetchLists,
    fetchListById,
    createList,
    updateList,
    deleteList,
    bulkDeleteLists,
    addLibrarySongToList,
    removeLibrarySongFromList,
    bulkAddLibrarySongsToList,
    addSongToList,
    removeSongFromList,
    reorderListItems,
  }
})
