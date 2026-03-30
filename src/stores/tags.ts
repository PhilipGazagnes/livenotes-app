import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/utils/supabase'
import type { Tag } from '@/types/database'

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
    isLoading.value = true
    error.value = null
    
    try {
      const { data, error: fetchError } = await supabase
        .from('tags')
        .select('*')
        .eq('project_id', projectId)
        .order('name', { ascending: true })
      
      if (fetchError) throw fetchError
      tags.value = data
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
      const { data: newTag, error: createError } = await supabase
        .from('tags')
        .insert({
          project_id: projectId,
          name: name.trim(),
        })
        .select()
        .single()
      
      if (createError) throw createError
      
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
      const { data: updatedTag, error: updateError } = await supabase
        .from('tags')
        .update({ name: name.trim() })
        .eq('id', tagId)
        .select()
        .single()
      
      if (updateError) throw updateError
      
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
      const { error: deleteError } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagId)
      
      if (deleteError) throw deleteError
      
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

  return {
    // State
    tags,
    isLoading,
    error,
    // Getters
    tagCount,
    tagsByName,
    // Actions
    fetchTags,
    createTag,
    updateTag,
    deleteTag,
    getTagById,
    getTagsByIds,
  }
})
