<template>
  <ion-page>
    <ion-content>
      <!-- Header -->
      <AppHeader
        :title="I18N.PAGE_TITLES.TAGS"
        :show-back="true"
        :show-menu="true"
      >
      </AppHeader>

      <!-- Empty State -->
      <CRUDEmptyState
        v-if="!tagsStore.isLoading && tagsStore.tagCount === 0"
        :title="MESSAGES.EMPTY_NO_TAGS"
        :subtitle="MESSAGES.EMPTY_NO_TAGS_SUBTITLE"
        :ctaText="I18N.EMPTY_STATES.NO_TAGS.CTA"
        iconPath="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
        @created="openCreateTagDrawer"
      />

      <!-- Tags List -->
      <div v-else class="p-4 space-y-3 pb-24">
        <BaseCard
          v-for="tag in filteredTags"
          :key="tag.id"
          :id="tag.id"
          :title="tag.name"
          :title-segments="getTitleSegments(tag)"
          :text="getTagText(tag)"
          :dropdown-items="getTagDropdownItems(tag)"
          @click="navigateToTag(tag)"
        />
      </div>

      <BaseStickyBar
        v-model:search-query="searchQuery"
        :all-item-ids="filteredTags.map(t => t.id)"
        :filters-enabled="false"
        @new-clicked="openCreateTagDrawer"
        @choose-action-clicked="handleChooseAction"
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
        @closed="showRenameModal = false"
        @submitted="handleRenameSubmit"
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { IonPage, IonContent } from '@ionic/vue'
import AppHeader from '@/components/AppHeader.vue'
import BaseCard from '@/components/BaseCard.vue'
import CRUDModal from '@/components/CRUDModal.vue'
import CRUDEmptyState from '@/components/CRUDEmptyState.vue'
import BaseStickyBar from '@/components/BaseStickyBar.vue'
import BulkActionsDrawer from '@/components/BulkActionsDrawer.vue'
import type { BulkAction } from '@/types/bulkAction'
import ConfirmDrawer from '@/components/ConfirmDrawer.vue'
import CreateItemDrawer from '@/components/CreateItemDrawer.vue'
import { useTagsStore } from '@/stores/tags'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useDrawerStore } from '@/stores/drawer'
import { MESSAGES } from '@/constants/messages'
import { I18N } from '@/constants/i18n'
import { ROUTES } from '@/constants/routes'
import { useCRUD } from '@/composables/useCRUD'
import { usePageLoad } from '@/composables/usePageLoad'
import { useFuseSearch } from '@/composables/useFuseSearch'
import { fetchTagSongCounts } from '@/services/tagService'
import type { Tag } from '@/types/database'

const router = useRouter()
const tagsStore = useTagsStore()
const authStore = useAuthStore()
const uiStore = useUiStore()
const drawerStore = useDrawerStore()

const searchQuery = ref('')

const { filteredItems: filteredTags, getTitleSegments } =
  useFuseSearch(computed(() => tagsStore.tagsByName), searchQuery, t => t.name, () => undefined)

const tagSongCounts = ref<Map<string, number>>(new Map())

function openCreateTagDrawer() {
  drawerStore.push(CreateItemDrawer, {
    title: I18N.MODALS.CREATE_TAG,
    label: I18N.FORM.TAG_NAME,
    placeholder: I18N.PLACEHOLDERS.TAG_NAME,
    maxLength: 50,
    submitLabel: I18N.BUTTONS.CREATE,
    successMessage: MESSAGES.SUCCESS.TAG_CREATED,
    validateFn: (name: string) => {
      if (!name) return MESSAGES.ERROR.TAG_NAME_REQUIRED
      if (name.length > 50) return MESSAGES.ERROR.TAG_NAME_TOO_LONG
      if (tagsStore.tags.some(t => t.name === name)) return MESSAGES.ERROR.TAG_ALREADY_EXISTS
      return ''
    },
    submitCallback: async (name: string) => {
      const personalProjectId = authStore.activeProjectId
      if (!personalProjectId) return { success: false, error: 'Project not found' }
      return await tagsStore.createTag(personalProjectId, name)
    },
  })
}


function handleChooseAction() {
  const actions: BulkAction[] = [
    { label: I18N.BULK_ACTIONS.DELETE_TAGS, variant: 'danger', keepDrawerOpen: true, onClick: handleBulkDelete },
  ]
  drawerStore.push(BulkActionsDrawer, { actions })
}

function handleBulkDelete() {
  const ids = [...uiStore.selectedIds]
  const count = ids.length
  drawerStore.push(ConfirmDrawer, {
    title: `Delete ${count} tag${count !== 1 ? 's' : ''}?`,
    message: `This will permanently delete ${count} tag${count !== 1 ? 's' : ''}. Your songs won't be affected.`,
    confirmLabel: I18N.BUTTONS.DELETE,
    cancelLabel: I18N.BUTTONS.CANCEL,
    confirmVariant: 'danger',
    confirmCallback: async () => {
      try {
        for (const id of ids) {
          await tagsStore.deleteTag(id)
        }
        uiStore.showToast(`Deleted ${count} tag${count !== 1 ? 's' : ''}`, 'success')
        uiStore.exitSelectionMode()
        drawerStore.popAll()
      } catch (err) {
        uiStore.showErrorToast('delete tags', err as Error)
        drawerStore.popAll()
      }
    },
  })
}

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
    const personalProjectId = authStore.activeProjectId
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
    const personalProjectId = authStore.activeProjectId
    if (!personalProjectId) return

    await tagsStore.fetchTags(personalProjectId)

    const tagIds = tagsStore.tags.map(t => t.id)
    if (tagIds.length) {
      tagSongCounts.value = await fetchTagSongCounts(tagIds)
    }
  }, {
    errorMessage: 'Failed to load tags'
  })
})
</script>
