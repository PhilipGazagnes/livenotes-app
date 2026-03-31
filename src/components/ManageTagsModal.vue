<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <div
      v-if="isOpen"
      class="fixed inset-0 z-[60] bg-black/50"
      @mousedown.self="handleCancel"
    ></div>

    <!-- Modal -->
    <div
      v-if="isOpen"
      class="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none"
    >
      <div class="bg-gray-800 rounded-lg w-full max-w-md max-h-[80vh] flex flex-col pointer-events-auto">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 class="text-xl font-semibold text-white truncate pr-4">
            {{ I18N.MODAL_CONTENT.MANAGE_TAGS_TITLE(songTitle) }}
          </h2>
          <button
            @click="handleCancel"
            class="flex-shrink-0 p-1 text-gray-400 hover:text-white transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Create New Tag -->
        <div class="p-6 border-b border-gray-700">
          <label class="block text-sm font-medium text-gray-300 mb-2">
            {{ I18N.MODAL_CONTENT.CREATE_NEW_TAG }}
          </label>
          <div class="flex gap-2">
            <input
              v-model="newTagName"
              type="text"
              maxlength="50"
              class="flex-1 px-4 py-2 bg-gray-900 border rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              :class="createError ? 'border-red-500' : 'border-gray-700'"
              :placeholder="I18N.PLACEHOLDERS.TAG_NAME_SHORT"
              @keyup.enter="handleCreateTag"
            />
            <button
              @click="handleCreateTag"
              :disabled="isCreatingTag"
              class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ I18N.BUTTONS.ADD }}
            </button>
          </div>
          <p v-if="createError" class="mt-1 text-sm text-red-400">
            {{ createError }}
          </p>
        </div>

        <!-- Available Tags (scrollable) -->
        <div class="flex-1 overflow-y-auto p-6">
          <label class="block text-sm font-medium text-gray-300 mb-4">
            {{ I18N.MODAL_CONTENT.AVAILABLE_TAGS }}
          </label>
          
          <div v-if="tagsStore.tags.length === 0" class="text-center py-8 text-gray-400">
            {{ I18N.EMPTY_STATES.NO_TAGS_IN_MODAL }}
          </div>
          
          <div v-else class="space-y-3">
            <label
              v-for="tag in sortedTags"
              :key="tag.id"
              class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                :checked="selectedTagIds.includes(tag.id)"
                @change="toggleTag(tag.id)"
                class="w-5 h-5 rounded border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:ring-offset-gray-800 bg-gray-700"
              />
              <span class="text-white">{{ tag.name }}</span>
            </label>
          </div>
        </div>

        <!-- Footer Buttons -->
        <div class="flex gap-3 p-6 border-t border-gray-700">
          <button
            @click="handleCancel"
            class="flex-1 px-6 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
          >
            {{ I18N.BUTTONS.CANCEL }}
          </button>
          <button
            @click="handleSave"
            :disabled="isSaving"
            class="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ isSaving ? I18N.LOADING.SAVING : I18N.BUTTONS.SAVE }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTagsStore } from '@/stores/tags'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { supabase } from '@/utils/supabase'
import { MESSAGES } from '@/constants/messages'
import { I18N } from '@/constants/i18n'
import type { Tag } from '@/types/database'

const props = defineProps<{
  isOpen: boolean
  songId: string
  songTitle: string
  initialTagIds: string[]
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const tagsStore = useTagsStore()
const authStore = useAuthStore()
const uiStore = useUiStore()

const selectedTagIds = ref<string[]>([])
const newTagName = ref('')
const createError = ref('')
const isCreatingTag = ref(false)
const isSaving = ref(false)

const sortedTags = computed(() => {
  return [...tagsStore.tags].sort((a, b) => a.name.localeCompare(b.name))
})

// Initialize selected tags when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    selectedTagIds.value = [...props.initialTagIds]
    newTagName.value = ''
    createError.value = ''
  }
})

function toggleTag(tagId: string) {
  const index = selectedTagIds.value.indexOf(tagId)
  if (index > -1) {
    selectedTagIds.value.splice(index, 1)
  } else {
    selectedTagIds.value.push(tagId)
  }
}

async function handleCreateTag() {
  createError.value = ''
  
  const trimmed = newTagName.value.trim()
  
  if (!trimmed) {
    createError.value = MESSAGES.ERROR.TAG_NAME_REQUIRED
    return
  }
  
  if (trimmed.length > 50) {
    createError.value = MESSAGES.ERROR.TAG_NAME_TOO_LONG
    return
  }
  
  // Check for duplicates (case-sensitive)
  if (tagsStore.tags.some(t => t.name === trimmed)) {
    uiStore.showToast(MESSAGES.ERROR.TAG_ALREADY_EXISTS, 'error')
    return
  }
  
  isCreatingTag.value = true
  
  const personalProjectId = await authStore.getPersonalProjectId()
  if (!personalProjectId) return
  
  const result = await tagsStore.createTag(personalProjectId, trimmed)
  
  if (result.success && result.data) {
    // Automatically select the newly created tag
    selectedTagIds.value.push(result.data.id)
    newTagName.value = ''
  } else {
    createError.value = result.error || MESSAGES.ERROR.SAVE_FAILED
  }
  
  isCreatingTag.value = false
}

async function handleSave() {
  isSaving.value = true
  
  try {
    // Determine which tags to add and which to remove
    const tagsToAdd = selectedTagIds.value.filter(id => !props.initialTagIds.includes(id))
    const tagsToRemove = props.initialTagIds.filter(id => !selectedTagIds.value.includes(id))
    
    // Remove tags
    if (tagsToRemove.length > 0) {
      const { error: deleteError } = await supabase
        .from('song_tags')
        .delete()
        .eq('song_id', props.songId)
        .in('tag_id', tagsToRemove)
      
      if (deleteError) throw deleteError
    }
    
    // Add tags
    if (tagsToAdd.length > 0) {
      const inserts = tagsToAdd.map(tagId => ({
        song_id: props.songId,
        tag_id: tagId,
      }))
      
      const { error: insertError } = await supabase
        .from('song_tags')
        .insert(inserts)
      
      if (insertError) throw insertError
    }
    
    uiStore.showToast(MESSAGES.SUCCESS.TAGS_UPDATED, 'success')
    emit('saved')
    emit('close')
  } catch (err) {
    console.error('Failed to save tags:', err)
    uiStore.showToast(MESSAGES.ERROR.SAVE_FAILED, 'error')
  } finally {
    isSaving.value = false
  }
}

function handleCancel() {
  emit('close')
}
</script>
