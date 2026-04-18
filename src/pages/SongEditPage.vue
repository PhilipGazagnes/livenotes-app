<template>
  <ion-page>
    <ion-content class="bg-gray-900">
      <!-- Error state -->
      <div v-if="loadError" class="p-4">
        <p class="text-red-400">{{ loadError }}</p>
        <button
          @click="router.back()"
          class="mt-4 px-6 py-3 bg-gray-800 text-white rounded-lg"
        >
          {{ I18N.BUTTONS.GO_BACK }}
        </button>
      </div>

      <!-- Form -->
      <template v-else-if="song">
        <!-- Header -->
        <AppHeader
          :title="I18N.PAGE_TITLES.EDIT_SONG"
          :show-back="true"
          :show-menu="true"
        />

        <form @submit.prevent="handleSave" class="p-4 pb-24 space-y-6">
          <!-- Title (required) -->
          <div>
            <label for="title" class="block text-sm font-medium text-gray-300 mb-2">
              {{ I18N.FORM.TITLE }} <span class="text-red-400">{{ I18N.FORM.REQUIRED }}</span>
            </label>
            <input
              id="title"
              v-model="form.title"
              type="text"
              :maxlength="VALIDATION.SONG_TITLE_MAX_LENGTH"
              @blur="validateField('title')"
              class="w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              :class="errors.title ? 'border-red-500' : 'border-gray-700'"
              :placeholder="I18N.PLACEHOLDERS.SONG_TITLE"
            />
            <p v-if="errors.title" class="mt-1 text-sm text-red-400">
              {{ errors.title }}
            </p>
          </div>

          <!-- Artists -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Artists
            </label>
            
            <!-- Artist Inputs -->
            <div class="space-y-3">
              <div
                v-for="(_, index) in form.artistIds"
                :key="index"
                class="flex items-start gap-2"
              >
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-xs text-gray-400">Artist {{ index + 1 }}</span>
                    <!-- Move Up Button -->
                    <button
                      v-if="index > 0"
                      type="button"
                      @click="handleMoveArtistUp(index)"
                      class="p-1 text-gray-400 hover:text-white transition-colors"
                      title="Move up"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
                      </svg>
                    </button>
                    <!-- Move Down Button -->
                    <button
                      v-if="index < form.artistIds.length - 1"
                      type="button"
                      @click="handleMoveArtistDown(index)"
                      class="p-1 text-gray-400 hover:text-white transition-colors"
                      title="Move down"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                      </svg>
                    </button>
                  </div>
                  <ArtistInput
                    v-model="form.artistIds[index]"
                    :placeholder="'Enter artist name'"
                  />
                </div>
                <!-- Remove Button -->
                <button
                  v-if="form.artistIds.length > 1"
                  type="button"
                  @click="handleRemoveArtist(index)"
                  class="p-3 text-red-400 hover:text-red-300 hover:bg-gray-800 rounded-lg transition-colors mt-6"
                  title="Remove artist"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            </div>
            
            <!-- Add Another Artist Button -->
            <button
              type="button"
              @click="handleAddArtist"
              class="mt-3 inline-flex items-center gap-2 px-4 py-2 text-sm text-blue-400 hover:text-blue-300 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Add Another Artist
            </button>
          </div>

          <!-- Notes (conditional based on settings) -->
          <div v-if="settingsStore.notesFieldEnabled">
            <label for="notes" class="block text-sm font-medium text-gray-300 mb-2">
              {{ settingsStore.notesFieldLabel }}
            </label>
            <textarea
              id="notes"
              v-model="form.notes"
              :maxlength="VALIDATION.SONG_NOTES_MAX_LENGTH"
              @blur="validateField('notes')"
              rows="4"
              class="w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none transition"
              :class="errors.notes ? 'border-red-500' : 'border-gray-700'"
              :placeholder="`Add ${settingsStore.notesFieldLabel.toLowerCase()} about this song...`"
            ></textarea>
            <div class="mt-1 flex justify-between items-center">
              <p v-if="errors.notes" class="text-sm text-red-400">
                {{ errors.notes }}
              </p>
              <p class="text-sm text-gray-500 ml-auto">
                {{ form.notes.length }}/{{ VALIDATION.SONG_NOTES_MAX_LENGTH }}
              </p>
            </div>
          </div>

          <!-- SongCode Editor -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              SongCode
            </label>
            <button
              type="button"
              @click="openSongcodeDrawer"
              class="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
            >
              <ion-icon :icon="codeSlash" />
              <span>Edit SongCode</span>
            </button>
          </div>
        </form>

        <!-- Sticky Footer -->
        <div class="fixed bottom-0 left-0 right-0 p-4 bg-gray-800 border-t border-gray-700 flex gap-3">
          <button
            type="button"
            @click="handleCancel"
            class="flex-1 px-6 py-3 bg-gray-700 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
          >
            {{ I18N.BUTTONS.CANCEL }}
          </button>
          <button
            type="button"
            @click="handleSave"
            class="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {{ I18N.BUTTONS.SAVE }}
          </button>
        </div>

        <!-- SongCode Drawer -->
        <SongCodeDrawer
          v-if="song"
          :is-open="showSongcodeDrawer"
          :song-id="song.id"
          :song-title="song.title"
          @close="showSongcodeDrawer = false"
        />
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { IonPage, IonContent, IonIcon } from '@ionic/vue'
import { codeSlash } from 'ionicons/icons'
import AppHeader from '@/components/AppHeader.vue'
import ArtistInput from '@/components/ArtistInput.vue'
// Lazy load drawer for better performance
const SongCodeDrawer = defineAsyncComponent(() => import('@/components/SongCodeDrawer.vue'))
import { useSongsStore } from '@/stores/songs'
import { useArtistsStore } from '@/stores/artists'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useSettingsStore } from '@/stores/settings'
import { VALIDATION } from '@/constants/validation'
import { MESSAGES } from '@/constants/messages'
import { ROUTES } from '@/constants/routes'
import { I18N } from '@/constants/i18n'
import { validateSongTitle, validateSongNotes, normalizeText } from '@/utils/validation'
import { executeOperation } from '@/utils/operations'
import type { SongWithTags } from '@/types/database'

const router = useRouter()
const route = useRoute()
const songsStore = useSongsStore()
const artistsStore = useArtistsStore()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const uiStore = useUiStore()

// Loading state
const isLoading = ref(true)
const loadError = ref('')
const song = ref<SongWithTags | null>(null)

// Form state
const form = ref({
  title: '',
  artistIds: [null] as (string | null)[],
  notes: '',
})

// Original form values (for change detection)
const originalForm = ref({
  title: '',
  artistIds: [] as (string | null)[],
  notes: '',
})

// Validation errors
const errors = ref({
  title: '',
  notes: '',
})

// SongCode drawer state
const showSongcodeDrawer = ref(false)

function openSongcodeDrawer() {
  showSongcodeDrawer.value = true
}

// Check if form has any changes
const hasChanges = computed(() => {
  return form.value.title !== originalForm.value.title ||
         form.value.notes !== originalForm.value.notes ||
         JSON.stringify(form.value.artistIds) !== JSON.stringify(originalForm.value.artistIds)
})

// Artist management functions
function handleAddArtist() {
  form.value.artistIds.push(null)
}

function handleRemoveArtist(index: number) {
  form.value.artistIds.splice(index, 1)
  // Ensure at least one artist input
  if (form.value.artistIds.length === 0) {
    form.value.artistIds.push(null)
  }
}

function handleMoveArtistUp(index: number) {
  if (index > 0) {
    const temp = form.value.artistIds[index]
    form.value.artistIds[index] = form.value.artistIds[index - 1]
    form.value.artistIds[index - 1] = temp
  }
}

function handleMoveArtistDown(index: number) {
  if (index < form.value.artistIds.length - 1) {
    const temp = form.value.artistIds[index]
    form.value.artistIds[index] = form.value.artistIds[index + 1]
    form.value.artistIds[index + 1] = temp
  }
}

// Load song data
onMounted(async () => {
  try {
    const songId = route.params.id as string
    
    if (!songId) {
      loadError.value = I18N.VALIDATION.SONG_ID_REQUIRED
      isLoading.value = false
      return
    }
    
    const personalProjectId = await authStore.getPersonalProjectId()
    if (!personalProjectId) {
      loadError.value = I18N.VALIDATION.PROJECT_NOT_FOUND
      isLoading.value = false
      return
    }
    
    // Load artists
    await artistsStore.fetchArtists(personalProjectId)
    
    // Load project settings
    await settingsStore.loadProjectSettings(personalProjectId)
    
    // Fetch songs if not already loaded
    if (songsStore.songs.length === 0) {
      await songsStore.fetchSongs(personalProjectId)
    }
    
    // Find song in store
    const foundSong = songsStore.songs.find(s => s.id === songId)
    
    if (!foundSong) {
      loadError.value = I18N.VALIDATION.SONG_NOT_FOUND
      isLoading.value = false
      return
    }
    
    song.value = foundSong
    
    // Populate form
    form.value.title = foundSong.title
    form.value.notes = foundSong.notes || ''
    
    // Populate artists (sorted by position)
    if (foundSong.artists && foundSong.artists.length > 0) {
      form.value.artistIds = foundSong.artists.map(a => a.id)
    } else {
      form.value.artistIds = [null]
    }
    
    // Store original values
    originalForm.value = {
      title: form.value.title,
      artistIds: [...form.value.artistIds],
      notes: form.value.notes,
    }
    
    isLoading.value = false
  } catch (error) {
    console.error('Error loading song:', error)
    loadError.value = 'Failed to load song. Please try again.'
    isLoading.value = false
  } finally {
    // Always hide the overlay, even if there's an error
    uiStore.hideOperationOverlay()
  }
})

// Validate a single field
function validateField(field: 'title' | 'notes') {
  switch (field) {
    case 'title':
      errors.value.title = validateSongTitle(form.value.title) || ''
      break
    case 'notes':
      errors.value.notes = validateSongNotes(form.value.notes) || ''
      break
  }
}

// Validate all fields
function validateForm(): boolean {
  validateField('title')
  validateField('notes')
  
  return !errors.value.title && !errors.value.notes
}

// Handle form submission
async function handleSave() {
  if (!validateForm() || !song.value) {
    return
  }
  
  const personalProjectId = await authStore.getPersonalProjectId()
  if (!personalProjectId) {
    uiStore.showToast('Project not found', 'error')
    return
  }
  
  // Filter out null artist IDs
  const artistIds = form.value.artistIds.filter(id => id !== null) as string[]
  
  const result = await executeOperation(
    () => songsStore.updateSong(song.value!.id, {
      title: normalizeText(form.value.title),
      notes: form.value.notes || null,
    }, personalProjectId, undefined, artistIds),
    {
      loadingMessage: 'Saving song...',
      successMessage: MESSAGES.SUCCESS.SONG_UPDATED,
      errorContext: 'save song',
      onSuccess: () => {
        router.push(ROUTES.ALL_SONGS)
      },
    }
  )
}

// Handle cancel button
async function handleCancel() {
  if (hasChanges.value) {
    const confirmed = await uiStore.showConfirm(
      'Discard Changes?',
      MESSAGES.CONFIRM_UNSAVED_CHANGES,
      'Discard',
      'Keep Editing'
    )
    
    if (!confirmed) {
      return
    }
  }
  
  uiStore.showOperationOverlay('Loading...')
  router.back()
}
</script>
