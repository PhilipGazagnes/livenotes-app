<template>
  <ion-page>
    <ion-content class="bg-gray-900">
      <!-- Header -->
      <AppHeader
        :title="I18N.PAGE_TITLES.TAGS"
        :show-back="true"
        :show-menu="true"
      >
        <template #action>
          <button
            @click="showCreateModal = true"
            class="p-2 text-white hover:text-gray-300 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
          </button>
        </template>
      </AppHeader>

      <!-- Empty State -->
      <div v-if="!tagsStore.isLoading && tagsStore.tagCount === 0" class="text-center py-12 px-4">
        <svg class="w-24 h-24 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
        </svg>
        <h2 class="text-xl font-semibold text-white mb-2">{{ MESSAGES.EMPTY_NO_TAGS }}</h2>
        <p class="text-gray-400 mb-6">{{ MESSAGES.EMPTY_NO_TAGS_SUBTITLE }}</p>
        
        <button
          @click="showCreateModal = true"
          class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          {{ I18N.EMPTY_STATES.NO_TAGS.CTA }}
        </button>
      </div>

      <!-- Tags List -->
      <div v-else class="p-4 space-y-3 pb-24">
        <TagCard
          v-for="tag in tagsStore.tagsByName"
          :key="tag.id"
          :tag="tag"
          @rename="handleRename"
          @delete="handleDelete"
        />
      </div>

      <!-- Create Tag Modal -->
      <div
        v-if="showCreateModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        @click.self="showCreateModal = false"
      >
        <div class="bg-gray-800 rounded-lg p-6 w-full max-w-md">
          <h3 class="text-xl font-semibold text-white mb-4">{{ I18N.MODALS.CREATE_TAG }}</h3>
          
          <div class="mb-4">
            <label for="tagName" class="block text-sm font-medium text-gray-300 mb-2">
              {{ I18N.FORM.TAG_NAME }} <span class="text-red-400">{{ I18N.FORM.REQUIRED }}</span>
            </label>
            <input
              id="tagName"
              v-model="newTagName"
              type="text"
              maxlength="50"
              class="w-full px-4 py-3 bg-gray-900 border rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              :class="createError ? 'border-red-500' : 'border-gray-700'"
              :placeholder="I18N.PLACEHOLDERS.TAG_NAME"
              @keyup.enter="handleCreate"
            />
            <p v-if="createError" class="mt-1 text-sm text-red-400">
              {{ createError }}
            </p>
          </div>

          <div class="flex gap-3">
            <button
              @click="showCreateModal = false"
              class="flex-1 px-6 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
            >
              {{ I18N.BUTTONS.CANCEL }}
            </button>
            <button
              @click="handleCreate"
              :disabled="isCreating"
              class="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ isCreating ? I18N.LOADING.CREATING : I18N.BUTTONS.CREATE }}
            </button>
          </div>
        </div>
      </div>

      <!-- Rename Tag Modal -->
      <div
        v-if="showRenameModal && editingTag"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        @click.self="showRenameModal = false"
      >
        <div class="bg-gray-800 rounded-lg p-6 w-full max-w-md">
          <h3 class="text-xl font-semibold text-white mb-4">{{ I18N.MODALS.RENAME_TAG }}</h3>
          
          <div class="mb-4">
            <label for="editTagName" class="block text-sm font-medium text-gray-300 mb-2">
              {{ I18N.FORM.TAG_NAME }} <span class="text-red-400">{{ I18N.FORM.REQUIRED }}</span>
            </label>
            <input
              id="editTagName"
              v-model="editTagName"
              type="text"
              maxlength="50"
              class="w-full px-4 py-3 bg-gray-900 border rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              :class="renameError ? 'border-red-500' : 'border-gray-700'"
              :placeholder="I18N.PLACEHOLDERS.TAG_NAME"
              @keyup.enter="handleRenameSubmit"
            />
            <p v-if="renameError" class="mt-1 text-sm text-red-400">
              {{ renameError }}
            </p>
          </div>

          <div class="flex gap-3">
            <button
              @click="showRenameModal = false"
              class="flex-1 px-6 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
            >
              {{ I18N.BUTTONS.CANCEL }}
            </button>
            <button
              @click="handleRenameSubmit"
              :disabled="isRenaming"
              class="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ isRenaming ? I18N.LOADING.SAVING : I18N.BUTTONS.SAVE }}
            </button>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { IonPage, IonContent } from '@ionic/vue'
import AppHeader from '@/components/AppHeader.vue'
import TagCard from '@/components/TagCard.vue'
import { useTagsStore } from '@/stores/tags'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { MESSAGES } from '@/constants/messages'
import { I18N } from '@/constants/i18n'
import type { Tag } from '@/types/database'

const tagsStore = useTagsStore()
const authStore = useAuthStore()
const uiStore = useUiStore()

const showCreateModal = ref(false)
const newTagName = ref('')
const createError = ref('')
const isCreating = ref(false)

const showRenameModal = ref(false)
const editingTag = ref<Tag | null>(null)
const editTagName = ref('')
const renameError = ref('')
const isRenaming = ref(false)

onMounted(async () => {
  try {
    if (!authStore.isInitialized) {
      await authStore.initialize()
    }
    
    const personalProjectId = await authStore.getPersonalProjectId()
    
    if (personalProjectId) {
      await tagsStore.fetchTags(personalProjectId)
    }
  } catch (error) {
    console.error('Error loading tags:', error)
    uiStore.showToast('Failed to load tags', 'error')
  } finally {
    // Always hide overlay
    uiStore.hideOperationOverlay()
  }
})

async function handleCreate() {
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
    createError.value = MESSAGES.ERROR.TAG_ALREADY_EXISTS
    return
  }
  
  isCreating.value = true
  uiStore.showOperationOverlay('Creating tag...')
  
  const personalProjectId = await authStore.getPersonalProjectId()
  if (!personalProjectId) {
    uiStore.hideOperationOverlay()
    isCreating.value = false
    return
  }
  
  const result = await tagsStore.createTag(personalProjectId, trimmed)
  
  uiStore.hideOperationOverlay()
  
  if (result.success) {
    uiStore.showToast(MESSAGES.SUCCESS.TAG_CREATED, 'success')
    showCreateModal.value = false
    newTagName.value = ''
  } else {
    createError.value = result.error || MESSAGES.ERROR.SAVE_FAILED
  }
  
  isCreating.value = false
}

function handleRename(tag: Tag) {
  editingTag.value = tag
  editTagName.value = tag.name
  renameError.value = ''
  showRenameModal.value = true
}

async function handleRenameSubmit() {
  if (!editingTag.value) return
  
  renameError.value = ''
  
  const trimmed = editTagName.value.trim()
  
  if (!trimmed) {
    renameError.value = MESSAGES.ERROR.TAG_NAME_REQUIRED
    return
  }
  
  if (trimmed.length > 50) {
    renameError.value = MESSAGES.ERROR.TAG_NAME_TOO_LONG
    return
  }
  
  // Check for duplicates (case-sensitive), excluding current tag
  if (tagsStore.tags.some(t => t.name === trimmed && t.id !== editingTag.value?.id)) {
    renameError.value = MESSAGES.ERROR.TAG_ALREADY_EXISTS
    return
  }
  
  isRenaming.value = true
  uiStore.showOperationOverlay('Renaming tag...')
  
  const result = await tagsStore.updateTag(editingTag.value.id, trimmed)
  
  uiStore.hideOperationOverlay()
  
  if (result.success) {
    uiStore.showToast(MESSAGES.SUCCESS.TAG_UPDATED, 'success')
    showRenameModal.value = false
    editingTag.value = null
  } else {
    renameError.value = result.error || MESSAGES.ERROR.SAVE_FAILED
  }
  
  isRenaming.value = false
}

async function handleDelete(tag: Tag) {
  const confirmed = await uiStore.showConfirm(
    I18N.MODALS.DELETE_TAG,
    MESSAGES.CONFIRM_DELETE_TAG(tag.name),
    I18N.BUTTONS.DELETE,
    I18N.BUTTONS.CANCEL
  )
  
  if (confirmed) {
    uiStore.showOperationOverlay('Deleting tag...')
    const result = await tagsStore.deleteTag(tag.id)
    uiStore.hideOperationOverlay()
    
    if (result.success) {
      uiStore.showToast(MESSAGES.SUCCESS.TAG_DELETED, 'success')
    } else {
      uiStore.showToast(result.error || MESSAGES.ERROR.SAVE_FAILED, 'error')
    }
  }
}
</script>
