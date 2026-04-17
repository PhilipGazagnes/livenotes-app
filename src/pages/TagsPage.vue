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
      <CRUDEmptyState
        v-if="!tagsStore.isLoading && tagsStore.tagCount === 0"
        :title="MESSAGES.EMPTY_NO_TAGS"
        :subtitle="MESSAGES.EMPTY_NO_TAGS_SUBTITLE"
        :ctaText="I18N.EMPTY_STATES.NO_TAGS.CTA"
        iconPath="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
        @create="showCreateModal = true"
      />

      <!-- Tags List -->
      <div v-else class="p-4 space-y-3 pb-24">
        <TagCard
          v-for="tag in tagsStore.tagsByName"
          :key="tag.id"
          :tag="tag"
          @rename="openRenameModal"
          @delete="handleDelete"
        />
      </div>

      <!-- Create Modal -->
      <CRUDModal
        :isOpen="showCreateModal"
        :title="I18N.MODALS.CREATE_TAG"
        :label="I18N.FORM.TAG_NAME"
        v-model="newItemName"
        :error="createError"
        :placeholder="I18N.PLACEHOLDERS.TAG_NAME"
        :maxLength="50"
        :isSubmitting="isCreating"
        :submitText="I18N.BUTTONS.CREATE"
        :loadingText="I18N.LOADING.CREATING"
        :cancelText="I18N.BUTTONS.CANCEL"
        @close="showCreateModal = false"
        @submit="handleCreate"
      />

      <!-- Rename Modal -->
      <CRUDModal
        :isOpen="showRenameModal"
        :title="I18N.MODALS.RENAME_TAG"
        :label="I18N.FORM.TAG_NAME"
        v-model="editItemName"
        :error="renameError"
        :placeholder="I18N.PLACEHOLDERS.TAG_NAME"
        :maxLength="50"
        :isSubmitting="isRenaming"
        :submitText="I18N.BUTTONS.SAVE"
        :loadingText="I18N.LOADING.SAVING"
        :cancelText="I18N.BUTTONS.CANCEL"
        @close="showRenameModal = false"
        @submit="handleRenameSubmit"
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { IonPage, IonContent } from '@ionic/vue'
import AppHeader from '@/components/AppHeader.vue'
import TagCard from '@/components/TagCard.vue'
import CRUDModal from '@/components/CRUDModal.vue'
import CRUDEmptyState from '@/components/CRUDEmptyState.vue'
import { useTagsStore } from '@/stores/tags'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { MESSAGES } from '@/constants/messages'
import { I18N } from '@/constants/i18n'
import { useCRUD } from '@/composables/useCRUD'
import type { Tag } from '@/types/database'

const tagsStore = useTagsStore()
const authStore = useAuthStore()
const uiStore = useUiStore()

const {
  showCreateModal,
  newItemName,
  createError,
  isCreating,
  handleCreate,
  showRenameModal,
  editItemName,
  renameError,
  isRenaming,
  openRenameModal,
  handleRenameSubmit,
  handleDelete,
} = useCRUD<Tag>({
  items: tagsStore.tags,
  maxLength: 50,
  validateDuplicate: (name, excludeId) => {
    return tagsStore.tags.some(t => t.name === name && t.id !== excludeId)
  },
  onCreate: async (name) => {
    const personalProjectId = await authStore.getPersonalProjectId()
    if (!personalProjectId) {
      return { success: false, error: 'Project not found' }
    }
    return await tagsStore.createTag(personalProjectId, name)
  },
  onUpdate: async (id, name) => {
    return await tagsStore.updateTag(id, name)
  },
  onDelete: async (id) => {
    return await tagsStore.deleteTag(id)
  },
  messages: {
    created: MESSAGES.SUCCESS.TAG_CREATED,
    updated: MESSAGES.SUCCESS.TAG_UPDATED,
    deleted: MESSAGES.SUCCESS.TAG_DELETED,
    nameRequired: MESSAGES.ERROR.TAG_NAME_REQUIRED,
    nameTooLong: MESSAGES.ERROR.TAG_NAME_TOO_LONG,
    alreadyExists: MESSAGES.ERROR.TAG_ALREADY_EXISTS,
  },
  confirmDelete: async (tag) => {
    return await uiStore.showConfirm(
      I18N.MODALS.DELETE_TAG,
      MESSAGES.CONFIRM_DELETE_TAG(tag.name),
      I18N.BUTTONS.DELETE,
      I18N.BUTTONS.CANCEL
    )
  },
})

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
</script>
