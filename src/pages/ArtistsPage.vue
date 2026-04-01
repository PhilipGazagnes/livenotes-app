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

      <!-- Loading State -->
      <div v-if="artistsStore.isLoading" class="flex items-center justify-center py-20">
        <LoadingSpinner />
      </div>

      <!-- Empty State -->
      <div v-else-if="!artistsStore.isLoading && artistsWithCount.length === 0" class="text-center py-12 px-4">
        <svg class="w-24 h-24 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
        </svg>
        <h2 class="text-xl font-semibold text-white mb-2">No artists yet</h2>
        <p class="text-gray-400 mb-6">Create your first artist to get started</p>
        
        <button
          @click="showCreateModal = true"
          class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Create Artist
        </button>
      </div>

      <!-- Artists List -->
      <div v-else class="p-4 space-y-3 pb-24">
        <ArtistCard
          v-for="artist in artistsWithCount"
          :key="artist.id"
          :artist="artist"
          @rename="handleRename"
          @delete="handleDelete"
        />
      </div>

      <!-- Create Artist Modal -->
      <div
        v-if="showCreateModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        @click.self="showCreateModal = false"
      >
        <div class="bg-gray-800 rounded-lg p-6 w-full max-w-md">
          <h3 class="text-xl font-semibold text-white mb-4">Create Artist</h3>
          
          <div class="mb-4">
            <label for="artistName" class="block text-sm font-medium text-gray-300 mb-2">
              Artist Name <span class="text-red-400">*</span>
            </label>
            <input
              id="artistName"
              v-model="newArtistName"
              type="text"
              maxlength="100"
              class="w-full px-4 py-3 bg-gray-900 border rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              :class="createError ? 'border-red-500' : 'border-gray-700'"
              placeholder="Enter artist name"
              @keyup.enter="handleCreate"
              autofocus
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
              Cancel
            </button>
            <button
              @click="handleCreate"
              :disabled="isCreating"
              class="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ isCreating ? 'Creating...' : 'Create' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Rename Artist Modal -->
      <div
        v-if="showRenameModal && editingArtist"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        @click.self="showRenameModal = false"
      >
        <div class="bg-gray-800 rounded-lg p-6 w-full max-w-md">
          <h3 class="text-xl font-semibold text-white mb-4">Rename Artist</h3>
          
          <div class="mb-4">
            <label for="editArtistName" class="block text-sm font-medium text-gray-300 mb-2">
              Artist Name <span class="text-red-400">*</span>
            </label>
            <input
              id="editArtistName"
              v-model="editArtistName"
              type="text"
              maxlength="100"
              class="w-full px-4 py-3 bg-gray-900 border rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              :class="renameError ? 'border-red-500' : 'border-gray-700'"
              placeholder="Enter artist name"
              @keyup.enter="handleRenameSubmit"
              autofocus
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
              Cancel
            </button>
            <button
              @click="handleRenameSubmit"
              :disabled="isRenaming"
              class="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ isRenaming ? 'Saving...' : 'Save' }}
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
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import ArtistCard from '@/components/ArtistCard.vue'
import { useArtistsStore } from '@/stores/artists'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import type { ArtistWithCount } from '@/types/database'

const artistsStore = useArtistsStore()
const authStore = useAuthStore()
const uiStore = useUiStore()

const artistsWithCount = ref<ArtistWithCount[]>([])

const showCreateModal = ref(false)
const newArtistName = ref('')
const createError = ref('')
const isCreating = ref(false)

const showRenameModal = ref(false)
const editingArtist = ref<ArtistWithCount | null>(null)
const editArtistName = ref('')
const renameError = ref('')
const isRenaming = ref(false)

onMounted(async () => {
  if (!authStore.isInitialized) {
    await authStore.initialize()
  }
  
  const personalProjectId = await authStore.getPersonalProjectId()
  
  if (personalProjectId) {
    artistsWithCount.value = await artistsStore.fetchArtistsWithCount(personalProjectId)
  }
})

async function handleCreate() {
  createError.value = ''
  
  const trimmed = newArtistName.value.trim()
  
  if (!trimmed) {
    createError.value = 'Artist name is required'
    return
  }
  
  if (trimmed.length > 100) {
    createError.value = 'Artist name is too long (max 100 characters)'
    return
  }
  
  // Check for duplicates (case-insensitive)
  if (artistsStore.artists.some(a => a.name.toLowerCase() === trimmed.toLowerCase())) {
    createError.value = 'An artist with this name already exists'
    return
  }
  
  isCreating.value = true
  
  const personalProjectId = await authStore.getPersonalProjectId()
  if (!personalProjectId) return
  
  const result = await artistsStore.createArtist(personalProjectId, trimmed)
  
  if (result.success) {
    uiStore.showToast('Artist created successfully', 'success')
    showCreateModal.value = false
    newArtistName.value = ''
    // Refresh list
    artistsWithCount.value = await artistsStore.fetchArtistsWithCount(personalProjectId)
  } else {
    createError.value = result.error || 'Failed to create artist'
  }
  
  isCreating.value = false
}

function handleRename(artist: ArtistWithCount) {
  editingArtist.value = artist
  editArtistName.value = artist.name
  renameError.value = ''
  showRenameModal.value = true
}

async function handleRenameSubmit() {
  if (!editingArtist.value) return
  
  renameError.value = ''
  
  const trimmed = editArtistName.value.trim()
  
  if (!trimmed) {
    renameError.value = 'Artist name is required'
    return
  }
  
  if (trimmed.length > 100) {
    renameError.value = 'Artist name is too long (max 100 characters)'
    return
  }
  
  // Check for duplicates (case-insensitive), excluding current artist
  if (artistsStore.artists.some(a => a.name.toLowerCase() === trimmed.toLowerCase() && a.id !== editingArtist.value?.id)) {
    renameError.value = 'An artist with this name already exists'
    return
  }
  
  isRenaming.value = true
  
  const result = await artistsStore.updateArtist(editingArtist.value.id, trimmed)
  
  if (result.success) {
    uiStore.showToast('Artist renamed successfully', 'success')
    showRenameModal.value = false
    editingArtist.value = null
    
    // Refresh list
    const personalProjectId = await authStore.getPersonalProjectId()
    if (personalProjectId) {
      artistsWithCount.value = await artistsStore.fetchArtistsWithCount(personalProjectId)
    }
  } else {
    renameError.value = result.error || 'Failed to rename artist'
  }
  
  isRenaming.value = false
}

async function handleDelete(artist: ArtistWithCount) {
  const confirmed = await uiStore.showConfirm(
    'Delete Artist',
    `Are you sure you want to delete "${artist.name}"? This cannot be undone.`,
    'Delete',
    'Cancel'
  )
  
  if (confirmed) {
    const result = await artistsStore.deleteArtist(artist.id)
    
    if (result.success) {
      uiStore.showToast('Artist deleted successfully', 'success')
      // Refresh list
      const personalProjectId = await authStore.getPersonalProjectId()
      if (personalProjectId) {
        artistsWithCount.value = await artistsStore.fetchArtistsWithCount(personalProjectId)
      }
    } else {
      uiStore.showToast(result.error || 'Failed to delete artist', 'error')
    }
  }
}
</script>
