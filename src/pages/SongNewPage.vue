<template>
  <ion-page>
    <ion-content class="bg-gray-900">
      <!-- Header -->
      <AppHeader
        :title="I18N.PAGE_TITLES.NEW_SONG"
        :show-back="true"
        :show-menu="true"
      />

      <!-- Form -->
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
          autofocus
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

      <!-- Notes -->
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

      <!-- POC ID -->
      <div>
        <label for="pocId" class="block text-sm font-medium text-gray-300 mb-2">
          POC ID
        </label>
        <input
          id="pocId"
          v-model="form.pocId"
          type="text"
          :maxlength="VALIDATION.SONG_POC_ID_LENGTH"
          @blur="validateField('pocId')"
          class="w-32 px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition uppercase"
          :class="errors.pocId ? 'border-red-500' : 'border-gray-700'"
          placeholder="####"
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
          class="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {{ I18N.BUTTONS.CREATE }}
        </button>
      </div>
    </form>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, toRef } from 'vue'
import { useRouter } from 'vue-router'
import { IonPage, IonContent } from '@ionic/vue'
import AppHeader from '@/components/AppHeader.vue'
import ArtistInput from '@/components/ArtistInput.vue'
import { useSongsStore } from '@/stores/songs'
import { useArtistsStore } from '@/stores/artists'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useSettingsStore } from '@/stores/settings'
import { VALIDATION } from '@/constants/validation'
import { MESSAGES } from '@/constants/messages'
import { ROUTES } from '@/constants/routes'
import { I18N } from '@/constants/i18n'
import { validateSongTitle, validateSongNotes, validatePocId, normalizeText } from '@/utils/validation'
import { executeOperation } from '@/utils/operations'
import { usePageLoad } from '@/composables/usePageLoad'
import { useArtistFormList } from '@/composables/useArtistFormList'

const router = useRouter()
const songsStore = useSongsStore()
const artistsStore = useArtistsStore()
const authStore = useAuthStore()
const uiStore = useUiStore()
const settingsStore = useSettingsStore()

const { execute } = usePageLoad()

// Load artists and settings on mount
onMounted(() => {
  execute(async () => {
    const personalProjectId = await authStore.getPersonalProjectId()
    if (personalProjectId) {
      await artistsStore.fetchArtists(personalProjectId)
      await settingsStore.loadProjectSettings(personalProjectId)
    }
  }, {
    errorMessage: 'Failed to load page'
  })
})

// Form state
const form = ref({
  title: '',
  artistIds: [null] as (string | null)[],
  notes: '',
  pocId: '',
})

// Validation errors
const errors = ref({
  title: '',
  notes: '',
  pocId: '',
})

// Check if form has any changes
const hasChanges = computed(() => {
  return form.value.title.trim() !== '' ||
         form.value.artistIds.some(id => id !== null) ||
         form.value.notes.trim() !== '' ||
         form.value.pocId.trim() !== ''
})

const { handleAddArtist, handleRemoveArtist, handleMoveArtistUp, handleMoveArtistDown } =
  useArtistFormList(toRef(form.value, 'artistIds'))

// Validate a single field
function validateField(field: 'title' | 'notes' | 'pocId') {
  switch (field) {
    case 'title':
      errors.value.title = validateSongTitle(form.value.title) || ''
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
  validateField('notes')
  validateField('pocId')
  
  return !errors.value.title && !errors.value.notes && !errors.value.pocId
}

// Handle form submission
async function handleSave() {
  if (!validateForm()) {
    return
  }
  
  const personalProjectId = await authStore.getPersonalProjectId()
  if (!personalProjectId) {
    uiStore.showToast('Project not found', 'error')
    return
  }
  
  // Filter out null artist IDs
  const artistIds = form.value.artistIds.filter(id => id !== null) as string[]
  
  await executeOperation(
    () => songsStore.createSong({
      project_id: personalProjectId,
      title: normalizeText(form.value.title),
      notes: form.value.notes || null,
      livenotes_poc_id: form.value.pocId || null,
    }, [], artistIds),
    {
      loadingMessage: 'Creating song...',
      successMessage: MESSAGES.SUCCESS.SONG_CREATED,
      errorContext: 'create song',
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
      I18N.MODALS.DISCARD_CHANGES,
      MESSAGES.CONFIRM_UNSAVED_CHANGES,
      I18N.BUTTONS.DISCARD,
      I18N.BUTTONS.KEEP_EDITING
    )
    
    if (!confirmed) {
      return
    }
  }
  
  uiStore.showOperationOverlay('Loading...')
  router.back()
}
</script>
