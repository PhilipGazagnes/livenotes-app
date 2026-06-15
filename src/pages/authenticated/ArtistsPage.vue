<template>
  <ion-page>
    <ion-content>
      <!-- Header -->
      <AppHeader
        :title="I18N.PAGE_TITLES.ARTISTS"
        :show-back="true"
        :show-menu="true"
      >
        <template #action>
          <DropdownMenu :items="headerMenuItems" />
        </template>
      </AppHeader>

      <!-- Empty State -->
      <CRUDEmptyState
        v-if="!artistsStore.isLoading && artistsWithCount.length === 0"
        :title="MESSAGES.EMPTY_NO_ARTISTS"
        :subtitle="I18N.EMPTY_STATES.NO_ARTISTS_SUBTITLE"
        :ctaText="I18N.MODALS.CREATE_ARTIST"
        iconPath="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        @create="showCreateModal = true"
      />

      <!-- Artists List -->
      <div v-else-if="filteredArtists.length > 0" class="pb-24">
        <div class="p-4 space-y-3">
          <Card
            v-for="artist in filteredArtists"
            :key="artist.id"
            :title="artist.name"
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

      <!-- Sticky Bottom Bar -->
      <div v-if="!artistsStore.isLoading && artistsWithCount.length > 0" class="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4 z-10">
        <div class="max-w-2xl mx-auto">
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="I18N.PLACEHOLDERS.SEARCH_ARTISTS"
              class="w-full pl-10 pr-10 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              v-if="searchQuery"
              @click="searchQuery = ''"
              class="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white transition-colors"
              :aria-label="I18N.ARIA.CLEAR_SEARCH"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

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
        @close="showCreateModal = false"
        @submit="handleCreate"
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
        @close="showRenameModal = false"
        @submit="handleRenameSubmit"
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { IonPage, IonContent } from '@ionic/vue'
import AppHeader from '@/components/AppHeader.vue'
import DropdownMenu from '@/components/DropdownMenu.vue'
import Card from '@/components/Card.vue'
import CRUDModal from '@/components/CRUDModal.vue'
import CRUDEmptyState from '@/components/CRUDEmptyState.vue'
import { useArtistsStore } from '@/stores/artists'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { ROUTES } from '@/constants/routes'
import { I18N } from '@/constants/i18n'
import { MESSAGES } from '@/constants/messages'
import { useCRUD } from '@/composables/useCRUD'
import { usePageLoad } from '@/composables/usePageLoad'
import type { ArtistWithCount } from '@/types/database'

const router = useRouter()
const artistsStore = useArtistsStore()
const authStore = useAuthStore()
const uiStore = useUiStore()

const headerMenuItems = [
  { label: I18N.MODALS.CREATE_ARTIST, callback: () => { showCreateModal.value = true } },
]

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

const filteredArtists = computed(() => {
  if (!searchQuery.value.trim()) {
    return artistsWithCount.value
  }

  const query = searchQuery.value.toLowerCase()
  return artistsWithCount.value.filter(artist =>
    artist.name.toLowerCase().includes(query)
  )
})

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
    const personalProjectId = await authStore.getPersonalProjectId()
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
      const personalProjectId = await authStore.getPersonalProjectId()
      if (personalProjectId) {
        artistsWithCount.value = await artistsStore.fetchArtistsWithCount(personalProjectId)
      }
    }
    return result
  },
  onDelete: async (id) => {
    const result = await artistsStore.deleteArtist(id)
    if (result.success) {
      const personalProjectId = await authStore.getPersonalProjectId()
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
    const personalProjectId = await authStore.getPersonalProjectId()

    if (personalProjectId) {
      artistsWithCount.value = await artistsStore.fetchArtistsWithCount(personalProjectId)
    }
  }, {
    errorMessage: 'Failed to load artists'
  })
})
</script>
