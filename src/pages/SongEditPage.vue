<template>
  <ion-page>
    <ion-content class="bg-gray-900">
      <!-- Loading state -->
      <LoadingSpinner v-if="isLoading" />

      <!-- Error state -->
      <div v-else-if="loadError" class="p-4">
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

          <!-- Artist -->
          <div>
            <label for="artist" class="block text-sm font-medium text-gray-300 mb-2">
              {{ I18N.FORM.ARTIST }}
            </label>
            <input
              id="artist"
              v-model="form.artist"
              type="text"
              :maxlength="VALIDATION.SONG_ARTIST_MAX_LENGTH"
              @blur="validateField('artist')"
              class="w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              :class="errors.artist ? 'border-red-500' : 'border-gray-700'"
              :placeholder="I18N.PLACEHOLDERS.ARTIST_NAME"
            />
            <p v-if="errors.artist" class="mt-1 text-sm text-red-400">
              {{ errors.artist }}
            </p>
          </div>

          <!-- Notes -->
          <div>
            <label for="notes" class="block text-sm font-medium text-gray-300 mb-2">
              {{ I18N.FORM.NOTES }}
            </label>
            <textarea
              id="notes"
              v-model="form.notes"
              :maxlength="VALIDATION.SONG_NOTES_MAX_LENGTH"
              @blur="validateField('notes')"
              rows="4"
              class="w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none transition"
              :class="errors.notes ? 'border-red-500' : 'border-gray-700'"
              :placeholder="I18N.PLACEHOLDERS.SONG_NOTES"
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

          <!-- POC ID -->
          <div>
            <label for="pocId" class="block text-sm font-medium text-gray-300 mb-2">
              {{ I18N.FORM.POC_ID }}
            </label>
            <input
              id="pocId"
              v-model="form.pocId"
              type="text"
              :maxlength="VALIDATION.SONG_POC_ID_LENGTH"
              @blur="validateField('pocId')"
              class="w-32 px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition uppercase"
              :class="errors.pocId ? 'border-red-500' : 'border-gray-700'"
              :placeholder="I18N.PLACEHOLDERS.POC_ID"
            />
            <p v-if="errors.pocId" class="mt-1 text-sm text-red-400">
              {{ errors.pocId }}
            </p>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3 pt-4">
            <button
              type="button"
              @click="handleCancel"
              class="flex-1 px-6 py-3 bg-gray-800 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            >
              {{ I18N.BUTTONS.CANCEL }}
            </button>
            <button
              type="submit"
              :disabled="isSaving"
              class="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ isSaving ? I18N.LOADING.SAVING : I18N.BUTTONS.SAVE }}
            </button>
          </div>
        </form>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { IonPage, IonContent } from '@ionic/vue'
import AppHeader from '@/components/AppHeader.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import { useSongsStore } from '@/stores/songs'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { VALIDATION } from '@/constants/validation'
import { MESSAGES } from '@/constants/messages'
import { ROUTES } from '@/constants/routes'
import { I18N } from '@/constants/i18n'
import { validateSongTitle, validateSongArtist, validateSongNotes, validatePocId, normalizeText } from '@/utils/validation'
import type { Song } from '@/types/database'

const router = useRouter()
const route = useRoute()
const songsStore = useSongsStore()
const authStore = useAuthStore()
const uiStore = useUiStore()

// Loading state
const isLoading = ref(true)
const loadError = ref('')
const song = ref<Song | null>(null)

// Form state
const form = ref({
  title: '',
  artist: '',
  notes: '',
  pocId: '',
})

// Original form values (for change detection)
const originalForm = ref({
  title: '',
  artist: '',
  notes: '',
  pocId: '',
})

// Validation errors
const errors = ref({
  title: '',
  artist: '',
  notes: '',
  pocId: '',
})

const isSaving = ref(false)

// Check if form has any changes
const hasChanges = computed(() => {
  return form.value.title !== originalForm.value.title ||
         form.value.artist !== originalForm.value.artist ||
         form.value.notes !== originalForm.value.notes ||
         form.value.pocId !== originalForm.value.pocId
})

// Load song data
onMounted(async () => {
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
  form.value.artist = foundSong.artist || ''
  form.value.notes = foundSong.notes || ''
  form.value.pocId = foundSong.livenotes_poc_id || ''
  
  // Store original values
  originalForm.value = { ...form.value }
  
  isLoading.value = false
})

// Validate a single field
function validateField(field: 'title' | 'artist' | 'notes' | 'pocId') {
  switch (field) {
    case 'title':
      errors.value.title = validateSongTitle(form.value.title) || ''
      break
    case 'artist':
      errors.value.artist = validateSongArtist(form.value.artist) || ''
      break
    case 'notes':
      errors.value.notes = validateSongNotes(form.value.notes) || ''
      break
    case 'pocId':
      errors.value.pocId = validatePocId(form.value.pocId) || ''
      break
  }
}

// Validate all fields
function validateForm(): boolean {
  validateField('title')
  validateField('artist')
  validateField('notes')
  validateField('pocId')
  
  return !errors.value.title && !errors.value.artist && !errors.value.notes && !errors.value.pocId
}

// Handle form submission
async function handleSave() {
  if (!validateForm() || !song.value) {
    return
  }
  
  isSaving.value = true
  
  try {
    const personalProjectId = await authStore.getPersonalProjectId()
    if (!personalProjectId) {
      uiStore.showToast('Project not found', 'error')
      return
    }
    
    const result = await songsStore.updateSong(song.value.id, {
      title: normalizeText(form.value.title),
      artist: form.value.artist ? normalizeText(form.value.artist) : null,
      notes: form.value.notes || null,
      livenotes_poc_id: form.value.pocId || null,
    }, personalProjectId)
    
    if (result.success) {
      uiStore.showToast(MESSAGES.SUCCESS.SONG_UPDATED, 'success')
      router.push(ROUTES.ALL_SONGS)
    } else {
      uiStore.showToast(result.error || MESSAGES.ERROR.SAVE_FAILED, 'error')
    }
  } finally {
    isSaving.value = false
  }
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
  
  router.back()
}
</script>
