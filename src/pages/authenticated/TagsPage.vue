<template>
  <ion-page>
    <ion-content>
      <!-- Header -->
      <AppHeader
        :title="I18N.PAGE_TITLES.TAGS"
        :show-back="true"
        :show-menu="true"
      >
        <template #action>
          <DropdownMenu :items="headerMenuItems" />
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
        <Card
          v-for="tag in tagsStore.tagsByName"
          :key="tag.id"
          :title="tag.name"
          :text="getTagText(tag)"
          :dropdown-items="getTagDropdownItems(tag)"
          @click="navigateToTag(tag)"
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { IonPage, IonContent } from '@ionic/vue'
import AppHeader from '@/components/AppHeader.vue'
import DropdownMenu from '@/components/DropdownMenu.vue'
import Card from '@/components/Card.vue'
import CRUDModal from '@/components/CRUDModal.vue'
import CRUDEmptyState from '@/components/CRUDEmptyState.vue'
import { useTagsStore } from '@/stores/tags'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { MESSAGES } from '@/constants/messages'
import { I18N } from '@/constants/i18n'
import { ROUTES } from '@/constants/routes'
import { useCRUD } from '@/composables/useCRUD'
import { usePageLoad } from '@/composables/usePageLoad'
import { supabase } from '@/lib/supabase'
import type { Tag } from '@/types/database'

const router = useRouter()
const tagsStore = useTagsStore()
const authStore = useAuthStore()
const uiStore = useUiStore()

const tagSongCounts = ref<Map<string, number>>(new Map())

const headerMenuItems = [
  { label: 'Create Tag', callback: () => { showCreateModal.value = true } },
]

function getTagText(tag: Tag): string {
  return I18N.PLURALS.SONG_COUNT(tagSongCounts.value.get(tag.id) ?? 0)
}

function getTagDropdownItems(tag: Tag) {
  return [
    { label: I18N.DROPDOWN.RENAME, callback: () => openRenameModal(tag) },
    { label: I18N.DROPDOWN.DELETE, variant: 'danger' as const, callback: () => handleDelete(tag) },
  ]
}

function navigateToTag(tag: Tag) {
  router.push({ path: ROUTES.LIBRARY, query: { tag: tag.id, tagName: tag.name } })
}

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

const { execute } = usePageLoad()

onMounted(() => {
  execute(async () => {
    const personalProjectId = await authStore.getPersonalProjectId()
    if (!personalProjectId) return

    await tagsStore.fetchTags(personalProjectId)

    const tagIds = tagsStore.tags.map(t => t.id)
    if (tagIds.length) {
      const { data } = await supabase
        .from('library_song_tags')
        .select('tag_id')
        .in('tag_id', tagIds)
      const counts = new Map(tagIds.map(id => [id, 0]))
      data?.forEach((row: { tag_id: string }) => {
        counts.set(row.tag_id, (counts.get(row.tag_id) ?? 0) + 1)
      })
      tagSongCounts.value = counts
    }
  }, {
    errorMessage: 'Failed to load tags'
  })
})
</script>
