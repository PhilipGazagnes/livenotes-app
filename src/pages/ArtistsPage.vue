<template>
  <ion-page>
    <ion-content class="bg-gray-900">
      <!-- Header -->
      <AppHeader
        title="Artists"
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
        v-if="!artistsStore.isLoading && artistsWithCount.length === 0"
        title="No artists yet"
        subtitle="Create your first artist to get started"
        ctaText="Create Artist"
        iconPath="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        @create="showCreateModal = true"
      />

      <!-- Artists List -->
      <div v-else-if="filteredArtists.length > 0" class="pb-24">
        <div class="p-4 space-y-3">
          <ArtistCard
            v-for="artist in filteredArtists"
            :key="artist.id"
            :artist="artist"
            @rename="openRenameModal"
            @delete="handleDelete"
          />
        </div>
      </div>

      <!-- Empty Search Results State -->
      <div v-else-if="artistsWithCount.length > 0 && filteredArtists.length === 0" class="text-center py-12 px-4 pb-24">
        <svg class="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <h2 class="text-xl font-semibold text-white mb-2">No artists found</h2>
        <p class="text-gray-400">Try a different search term</p>
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
              placeholder="Search artists..."
              class="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <!-- Create Modal -->
      <CRUDModal
        :isOpen="showCreateModal"
        title="Create Artist"
        label="Artist Name"
        v-model="newItemName"
        :error="createError"
        placeholder="Enter artist name"
        :maxLength="100"
        :isSubmitting="isCreating"
        submitText="Create"
        loadingText="Creating..."
        @close="showCreateModal = false"
        @submit="handleCreate"
      />

      <!-- Rename Modal -->
      <CRUDModal
        :isOpen="showRenameModal"
        title="Rename Artist"
        label="Artist Name"
        v-model="editItemName"
        :error="renameError"
        placeholder="Enter artist name"
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
import { IonPage, IonContent } from '@ionic/vue'
import AppHeader from '@/components/AppHeader.vue'
import ArtistCard from '@/components/ArtistCard.vue'
import CRUDModal from '@/components/CRUDModal.vue'
import CRUDEmptyState from '@/components/CRUDEmptyState.vue'
import { useArtistsStore } from '@/stores/artists'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useCRUD } from '@/composables/useCRUD'
import type { ArtistWithCount } from '@/types/database'

const artistsStore = useArtistsStore()
const authStore = useAuthStore()
const uiStore = useUiStore()

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
  items: artistsStore.artists,
  maxLength: 100,
  validateDuplicate: (name, excludeId) => {
    return artistsStore.artists.some(a => 
      a.name.toLowerCase() === name.toLowerCase() && a.id !== excludeId
    )
  },
  onCreate: async (name) => {
    const personalProjectId = await authStore.getPersonalProjectId()
    if (!personalProjectId) {
      return { success: false, error: 'Project not found' }
    }
    const result = await artistsStore.createArtist(personalProjectId, name)
    if (result.success) {
      artistsWithCount.value = await artistsStore.fetchArtistsWithCount(personalProjectId)
    }
    return result
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
    created: 'Artist created successfully',
    updated: 'Artist renamed successfully',
    deleted: 'Artist deleted successfully',
    nameRequired: 'Artist name is required',
    nameTooLong: 'Artist name is too long (max 100 characters)',
    alreadyExists: 'An artist with this name already exists',
  },
  confirmDelete: async (artist) => {
    return await uiStore.showConfirm(
      'Delete Artist',
      `Are you sure you want to delete "${artist.name}"? This cannot be undone.`,
      'Delete',
      'Cancel'
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

onMounted(async () => {
  try {
    if (!authStore.isInitialized) {
      await authStore.initialize()
    }
    
    const personalProjectId = await authStore.getPersonalProjectId()
    
    if (personalProjectId) {
      artistsWithCount.value = await artistsStore.fetchArtistsWithCount(personalProjectId)
    }
  } catch (error) {
    console.error('Error loading artists:', error)
    uiStore.showToast('Failed to load artists', 'error')
  } finally {
    uiStore.hideOperationOverlay()
  }
})
</script>
