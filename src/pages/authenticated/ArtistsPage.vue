<template>
  <ion-page>
    <ion-content>
      <!-- Header -->
      <AppHeader
        :title="I18N.PAGE_TITLES.ARTISTS"
        :show-back="true"
        :show-menu="true"
      >
      </AppHeader>

      <!-- Empty State -->
      <CRUDEmptyState
        v-if="!artistsStore.isLoading && artistsWithCount.length === 0"
        :title="MESSAGES.EMPTY_NO_ARTISTS"
        :subtitle="I18N.EMPTY_STATES.NO_ARTISTS_SUBTITLE"
        :ctaText="I18N.MODALS.CREATE_ARTIST"
        iconPath="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        @created="showCreateModal = true"
      />

      <!-- Artists List -->
      <div v-else-if="filteredArtists.length > 0" class="pb-24">
        <div class="p-4 space-y-3">
          <BaseCard
            v-for="artist in filteredArtists"
            :key="artist.id"
            :id="artist.id"
            :title="artist.name"
            :title-segments="getTitleSegments(artist)"
            :text="getArtistText(artist)"
            :dropdown-items="getArtistDropdownItems(artist)"
            @click="navigateToArtist(artist)"
          />
        </div>
      </div>

      <!-- Empty Search Results State -->
      <div v-else-if="artistsWithCount.length > 0 && filteredArtists.length === 0" class="text-center py-12 px-4 pb-24">
        <svg class="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <h2 class="text-xl font-semibold text-white mb-2">{{ I18N.EMPTY_STATES.NO_ARTISTS }}</h2>
        <p class="text-gray-400">{{ I18N.EMPTY_STATES.NO_SEARCH_RESULTS }}</p>
      </div>

      <BaseStickyBar
        v-model:search-query="searchQuery"
        :all-item-ids="filteredArtists.map(a => a.id)"
        :filters-enabled="false"
        @new-clicked="showCreateModal = true"
        @choose-action-clicked="handleChooseAction"
      />

      <!-- Create Modal -->
      <CRUDModal
        :isOpen="showCreateModal"
        :title="I18N.MODALS.CREATE_ARTIST"
        :label="I18N.FORM.ARTIST"
        v-model="newItemName"
        :error="createError"
        :placeholder="I18N.PLACEHOLDERS.ARTIST_NAME"
        :maxLength="100"
        :isSubmitting="isCreating"
        :submitText="I18N.BUTTONS.CREATE"
        :loadingText="I18N.LOADING.CREATING"
        @closed="showCreateModal = false"
        @submitted="handleCreate"
      />

      <!-- Rename Modal -->
      <CRUDModal
        :isOpen="showRenameModal"
        :title="I18N.MODALS.RENAME_ARTIST"
        :label="I18N.FORM.ARTIST"
        v-model="editItemName"
        :error="renameError"
        :placeholder="I18N.PLACEHOLDERS.ARTIST_NAME"
        :maxLength="100"
        :isSubmitting="isRenaming"
        @closed="showRenameModal = false"
        @submitted="handleRenameSubmit"
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
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
import { useArtistsStore } from '@/stores/artists'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useDrawerStore } from '@/stores/drawer'
import { ROUTES } from '@/constants/routes'
import { I18N } from '@/constants/i18n'
import { MESSAGES } from '@/constants/messages'
import { useCRUD } from '@/composables/useCRUD'
import { usePageLoad } from '@/composables/usePageLoad'
import { useFuseSearch } from '@/composables/useFuseSearch'
import { bulkDeleteArtistSongs } from '@/services/artistService'
import type { ArtistWithCount } from '@/types/database'

const router = useRouter()
const artistsStore = useArtistsStore()
const authStore = useAuthStore()
const uiStore = useUiStore()
const drawerStore = useDrawerStore()


function handleChooseAction() {
  const actions: BulkAction[] = [
    { label: I18N.BULK_ACTIONS.DELETE_ARTISTS, variant: 'danger', keepDrawerOpen: true, onClick: handleBulkDeleteArtists },
  ]
  drawerStore.push(BulkActionsDrawer, { actions })
}

function handleBulkDeleteArtists() {
  const ids = [...uiStore.selectedIds]
  const artistCount = ids.length
  const songCount = ids.reduce((sum, id) => {
    return sum + (artistsWithCount.value.find(a => a.id === id)?.song_count ?? 0)
  }, 0)

  const artistLabel = (n: number) => `${n} artist${n !== 1 ? 's' : ''}`
  const songLabel = (n: number) => `${n} associated song${n !== 1 ? 's' : ''}`

  drawerStore.push(ConfirmDrawer, {
    title: `Delete ${artistLabel(artistCount)}?`,
    message: `This will remove ${artistLabel(artistCount)} and ${songLabel(songCount)} from your library.`,
    confirmLabel: I18N.BUTTONS.DELETE,
    cancelLabel: I18N.BUTTONS.CANCEL,
    confirmVariant: 'danger',
    confirmCallback: async () => {
      try {
        const personalProjectId = authStore.activeProjectId
        if (!personalProjectId) throw new Error('Project not found')

        await bulkDeleteArtistSongs(ids, personalProjectId)

        artistsWithCount.value = await artistsStore.fetchArtistsWithCount(personalProjectId)
        uiStore.showToast(`Deleted ${artistLabel(artistCount)} and ${songLabel(songCount)}`, 'success')
        uiStore.exitSelectionMode()
        drawerStore.popAll()
      } catch (err) {
        uiStore.showErrorToast('delete artists', err as Error)
        drawerStore.popAll()
      }
    },
  })
}

function getArtistText(artist: ArtistWithCount): string {
  const count = artist.song_count
  return I18N.PLURALS.SONG_COUNT(count)
}

function getArtistDropdownItems(artist: ArtistWithCount) {
  return [
    { label: I18N.DROPDOWN.RENAME, callback: () => openRenameModal(artist) },
    { label: I18N.DROPDOWN.DELETE, variant: 'danger' as const, callback: () => handleDelete(artist) },
  ]
}

function navigateToArtist(artist: ArtistWithCount) {
  router.push({ path: ROUTES.LIBRARY, query: { artist: artist.id, artistName: artist.name } })
}

const artistsWithCount = ref<ArtistWithCount[]>([])
const searchQuery = ref('')

const { filteredItems: filteredArtists, getTitleSegments } =
  useFuseSearch(artistsWithCount, searchQuery, a => a.name, () => undefined)

const {
  showCreateModal,
  newItemName,
  createError,
  isCreating,
  handleCreate: handleCreateBase,
  showRenameModal,
  editItemName,
  renameError,
  isRenaming,
  openRenameModal,
  handleRenameSubmit: handleRenameBase,
  handleDelete,
} = useCRUD<ArtistWithCount>({
  items: artistsWithCount.value,
  maxLength: 100,
  validateDuplicate: (name, excludeId) => {
    return artistsWithCount.value.some(a =>
      a.name.toLowerCase() === name.toLowerCase() && a.id !== excludeId
    )
  },
  onCreate: async (name) => {
    const personalProjectId = authStore.activeProjectId
    if (!personalProjectId) {
      return { success: false, error: I18N.VALIDATION.PROJECT_NOT_FOUND }
    }
    const result = await artistsStore.createArtist(personalProjectId, name)
    if (result.success) {
      artistsWithCount.value = await artistsStore.fetchArtistsWithCount(personalProjectId)
    }
    return { success: result.success, error: result.success ? undefined : result.error }
  },
  onUpdate: async (id, name) => {
    const result = await artistsStore.updateArtist(id, name)
    if (result.success) {
      const personalProjectId = authStore.activeProjectId
      if (personalProjectId) {
        artistsWithCount.value = await artistsStore.fetchArtistsWithCount(personalProjectId)
      }
    }
    return result
  },
  onDelete: async (id) => {
    const result = await artistsStore.deleteArtist(id)
    if (result.success) {
      const personalProjectId = authStore.activeProjectId
      if (personalProjectId) {
        artistsWithCount.value = await artistsStore.fetchArtistsWithCount(personalProjectId)
      }
    }
    return result
  },
  messages: {
    created: MESSAGES.SUCCESS.ARTIST_CREATED,
    updated: I18N.TOAST.ARTIST_RENAMED,
    deleted: I18N.TOAST.ARTIST_DELETED,
    nameRequired: MESSAGES.ERROR.ARTIST_NAME_REQUIRED,
    nameTooLong: MESSAGES.ERROR.ARTIST_TOO_LONG,
    alreadyExists: I18N.VALIDATION.ARTIST_ALREADY_EXISTS,
  },
  confirmDelete: async (artist) => {
    return await uiStore.showConfirm(
      I18N.MODALS.DELETE_ARTIST,
      I18N.MODAL_CONTENT.DELETE_ARTIST_CONFIRM(artist.name),
      I18N.BUTTONS.DELETE,
      I18N.BUTTONS.CANCEL
    )
  },
})

// Wrapper functions to handle refresh
async function handleCreate() {
  await handleCreateBase()
}

async function handleRenameSubmit() {
  await handleRenameBase()
}

const { execute } = usePageLoad()

onMounted(() => {
  execute(async () => {
    const personalProjectId = authStore.activeProjectId

    if (personalProjectId) {
      artistsWithCount.value = await artistsStore.fetchArtistsWithCount(personalProjectId)
    }
  }, {
    errorMessage: 'Failed to load artists'
  })
})
</script>
