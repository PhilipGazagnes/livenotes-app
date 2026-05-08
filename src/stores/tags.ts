import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Tag } from '@/types/database'
import * as tagService from '@/services/tagService'

export const useTagsStore = defineStore('tags', () => {
  // State
  const tags = ref<Tag[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const tagCount = computed(() => tags.value.length)
  const tagsByName = computed(() => {
    return [...tags.value].sort((a, b) => a.name.localeCompare(b.name))
  })

  // Actions
  async function fetchTags(projectId: string) {
    if (tags.value.length > 0) return
    isLoading.value = true
    error.value = null
    try {
      tags.value = await tagService.fetchTags(projectId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch tags'
    } finally {
      isLoading.value = false
    }
  }

  async function createTag(projectId: string, name: string) {
    isLoading.value = true
    error.value = null
    try {
      const newTag = await tagService.createTag(projectId, name)
      tags.value.push(newTag)
      tags.value.sort((a, b) => a.name.localeCompare(b.name))
      return { success: true, data: newTag }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create tag'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function updateTag(tagId: string, name: string) {
    isLoading.value = true
    error.value = null
    try {
      const updatedTag = await tagService.updateTag(tagId, name)
      const index = tags.value.findIndex(t => t.id === tagId)
      if (index !== -1) {
        tags.value[index] = updatedTag
        tags.value.sort((a, b) => a.name.localeCompare(b.name))
      }
      return { success: true, data: updatedTag }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update tag'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function deleteTag(tagId: string) {
    isLoading.value = true
    error.value = null
    try {
      await tagService.deleteTag(tagId)
      tags.value = tags.value.filter(t => t.id !== tagId)
      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete tag'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  function getTagById(tagId: string): Tag | undefined {
    return tags.value.find(t => t.id === tagId)
  }

  function getTagsByIds(tagIds: string[]): Tag[] {
    return tags.value.filter(t => tagIds.includes(t.id))
  }

  async function tagLibrarySong(librarySongId: string, tagId: string) {
    isLoading.value = true
    error.value = null
    try {
      await tagService.tagLibrarySong(librarySongId, tagId)
      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to tag song'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function untagLibrarySong(librarySongId: string, tagId: string) {
    isLoading.value = true
    error.value = null
    try {
      await tagService.untagLibrarySong(librarySongId, tagId)
      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to untag song'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function bulkAssignTags(librarySongIds: string[], tagIds: string[]) {
    isLoading.value = true
    error.value = null
    try {
      await tagService.bulkAssignTags(librarySongIds, tagIds)
      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to assign tags'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function bulkRemoveTags(librarySongIds: string[], tagIds: string[]) {
    isLoading.value = true
    error.value = null
    try {
      await tagService.bulkRemoveTags(librarySongIds, tagIds)
      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to remove tags'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  return {
    tags,
    isLoading,
    error,
    tagCount,
    tagsByName,
    fetchTags,
    createTag,
    updateTag,
    deleteTag,
    getTagById,
    getTagsByIds,
    tagLibrarySong,
    untagLibrarySong,
    bulkAssignTags,
    bulkRemoveTags,
  }
})
