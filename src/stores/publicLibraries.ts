import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'
import type { PublicLibraryWithTags } from '@/types/database'
import {
  fetchPublicLibraries,
  createPublicLibrary as serviceCreate,
  updatePublicLibrary as serviceUpdate,
  deletePublicLibrary as serviceDelete,
  setPublicLibraryTags,
} from '@/services/publicLibraryService'

export const usePublicLibrariesStore = defineStore('publicLibraries', () => {
  const libraries = ref<PublicLibraryWithTags[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const authStore = useAuthStore()

  async function loadLibraries({ force = false } = {}) {
    const projectId = authStore.personalProjectId
    if (!projectId) return
    if (!force && libraries.value.length > 0) return
    isLoading.value = true
    error.value = null
    try {
      libraries.value = await fetchPublicLibraries(projectId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load public libraries'
    } finally {
      isLoading.value = false
    }
  }

  async function createLibrary(name: string, slug: string, tagIds: string[]) {
    const projectId = authStore.personalProjectId
    const userId = authStore.userId
    if (!projectId || !userId) throw new Error('Not authenticated')
    isLoading.value = true
    error.value = null
    try {
      const created = await serviceCreate(projectId, name, slug, userId)
      if (tagIds.length > 0) await setPublicLibraryTags(created.id, tagIds)
      await loadLibraries({ force: true })
      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create public library'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function updateLibrary(id: string, updates: { name?: string; slug?: string; is_active?: boolean }, tagIds?: string[]) {
    isLoading.value = true
    error.value = null
    try {
      if (Object.keys(updates).length > 0) await serviceUpdate(id, updates)
      if (tagIds !== undefined) await setPublicLibraryTags(id, tagIds)
      await loadLibraries({ force: true })
      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update public library'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function deleteLibrary(id: string) {
    isLoading.value = true
    error.value = null
    try {
      await serviceDelete(id)
      libraries.value = libraries.value.filter(l => l.id !== id)
      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete public library'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  return { libraries, isLoading, error, loadLibraries, createLibrary, updateLibrary, deleteLibrary }
})
