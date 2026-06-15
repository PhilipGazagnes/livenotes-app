<template>
  <ion-page>
    <ion-content>
      <AppHeader
        :title="I18N.PAGE_TITLES.PROJECT_SETTINGS"
        :show-back="true"
        :show-menu="true"
      />

      <div class="p-4 space-y-6">

        <!-- Project Name -->
        <section>
          <h2 class="text-lg font-semibold text-white mb-4">{{ I18N.SETTINGS.PROJECT_NAME }}</h2>
          <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p class="text-sm text-gray-400 mb-3">{{ I18N.SETTINGS.PROJECT_NAME_HINT }}</p>
            <div class="flex gap-2">
              <input
                v-model="projectNameInput"
                type="text"
                maxlength="100"
                placeholder="My Band"
                class="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                @keyup.enter="handleSaveProjectName"
              />
              <button
                @click="handleSaveProjectName"
                :disabled="isSaving || !projectNameInput.trim()"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {{ I18N.BUTTONS.SAVE }}
              </button>
            </div>
          </div>
        </section>

        <!-- Description -->
        <section>
          <h2 class="text-lg font-semibold text-white mb-4">{{ I18N.SETTINGS.PROJECT_DESCRIPTION }}</h2>
          <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p class="text-sm text-gray-400 mb-3">{{ I18N.SETTINGS.PROJECT_DESCRIPTION_HINT }}</p>
            <textarea
              v-model="descriptionInput"
              maxlength="200"
              rows="3"
              placeholder="A short bio or description of your project..."
              class="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition resize-none"
            />
            <div class="flex items-center justify-between mt-2">
              <span class="text-xs text-gray-500">{{ descriptionInput.length }}/200</span>
              <button
                @click="handleSaveDescription"
                :disabled="isSaving"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {{ I18N.BUTTONS.SAVE }}
              </button>
            </div>
          </div>
        </section>

        <!-- Thumbnail -->
        <section>
          <h2 class="text-lg font-semibold text-white mb-4">{{ I18N.SETTINGS.PROJECT_THUMBNAIL }}</h2>
          <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p class="text-sm text-gray-400 mb-3">{{ I18N.SETTINGS.PROJECT_THUMBNAIL_DESC }}</p>
            <div class="flex items-center gap-4 mb-3">
              <img
                v-if="thumbnailInput"
                :src="thumbnailInput"
                alt="Thumbnail preview"
                class="w-16 h-16 rounded-full object-cover border border-gray-600 flex-shrink-0"
              />
              <div v-else class="w-16 h-16 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center flex-shrink-0">
                <svg class="w-7 h-7 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
                </svg>
              </div>
              <input
                v-model="thumbnailInput"
                type="url"
                :placeholder="I18N.PLACEHOLDERS.COVER_URL"
                class="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              />
            </div>
            <button
              @click="handleSaveThumbnail"
              :disabled="isSaving"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ isSaving ? I18N.LOADING.SAVING : I18N.BUTTONS.SAVE }}
            </button>
          </div>
        </section>

        <!-- Notes Field -->
        <section>
          <h2 class="text-lg font-semibold text-white mb-4">{{ I18N.SETTINGS.NOTES_FIELD }}</h2>
          <div class="space-y-4">
            <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <h3 class="text-white font-medium mb-1">{{ I18N.SETTINGS.SHOW_NOTES_FIELD }}</h3>
                  <p class="text-sm text-gray-400">{{ I18N.SETTINGS.SHOW_NOTES_FIELD_DESC }}</p>
                </div>
                <button
                  @click="handleToggleNotesField"
                  :disabled="isSaving"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50"
                  :class="settingsStore.notesFieldEnabled ? 'bg-blue-600' : 'bg-gray-600'"
                  role="switch"
                  :aria-checked="settingsStore.notesFieldEnabled"
                  :aria-label="I18N.ARIA.TOGGLE_SHOW_NOTES_FIELD"
                >
                  <span
                    class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                    :class="settingsStore.notesFieldEnabled ? 'translate-x-6' : 'translate-x-1'"
                  />
                </button>
              </div>
            </div>

            <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <label for="notesFieldLabel" class="block text-white font-medium mb-2">{{ I18N.SETTINGS.FIELD_LABEL_SECTION }}</label>
              <p class="text-sm text-gray-400 mb-3">{{ I18N.SETTINGS.FIELD_LABEL_HINT }}</p>
              <div class="flex gap-2">
                <input
                  id="notesFieldLabel"
                  v-model="notesLabelInput"
                  type="text"
                  maxlength="30"
                  :placeholder="I18N.PLACEHOLDERS.FIELD_LABEL"
                  class="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                  @keyup.enter="handleSaveNotesLabel"
                />
                <button
                  @click="handleSaveNotesLabel"
                  :disabled="isSaving || !notesLabelInput.trim()"
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {{ I18N.BUTTONS.SAVE }}
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- URL Slug -->
        <section>
          <h2 class="text-lg font-semibold text-white mb-4">{{ I18N.SETTINGS.PUBLIC_LIBRARIES }}</h2>
          <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <label for="projectSlug" class="block text-white font-medium mb-2">{{ I18N.SETTINGS.PROJECT_URL_SLUG }}</label>
            <p class="text-sm text-gray-400 mb-3">{{ I18N.VALIDATION.PROJECT_SLUG_HINT }}</p>
            <div class="flex gap-2">
              <input
                id="projectSlug"
                v-model="slugInput"
                type="text"
                :placeholder="I18N.PLACEHOLDERS.PROJECT_SLUG"
                class="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition lowercase"
              />
              <button
                @click="handleSaveSlug"
                :disabled="isSaving"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {{ I18N.BUTTONS.SAVE }}
              </button>
            </div>
          </div>
        </section>

        <!-- Contact Info -->
        <section>
          <h2 class="text-lg font-semibold text-white mb-4">{{ I18N.SETTINGS.CONTACT_INFO }}</h2>
          <div class="space-y-4">
            <!-- Toggle -->
            <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <h3 class="text-white font-medium mb-1">{{ I18N.SETTINGS.CONTACT_SHOW_ON_PUBLIC }}</h3>
                  <p class="text-sm text-gray-400">{{ I18N.SETTINGS.CONTACT_SHOW_ON_PUBLIC_DESC }}</p>
                </div>
                <button
                  @click="handleToggleContact"
                  :disabled="isSaving"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50"
                  :class="settingsStore.contactEnabled ? 'bg-blue-600' : 'bg-gray-600'"
                  role="switch"
                  :aria-checked="settingsStore.contactEnabled"
                  :aria-label="I18N.ARIA.TOGGLE_CONTACT_ENABLED"
                >
                  <span
                    class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                    :class="settingsStore.contactEnabled ? 'translate-x-6' : 'translate-x-1'"
                  />
                </button>
              </div>
            </div>

            <!-- Contact fields form -->
            <div class="bg-gray-800 rounded-lg p-4 border border-gray-700 space-y-4">
              <div v-for="field in contactFields" :key="field.key">
                <label :for="'contact-' + field.key" class="block text-sm font-medium text-gray-300 mb-1">{{ field.label }}</label>
                <input
                  :id="'contact-' + field.key"
                  v-model="contactForm[field.key]"
                  :type="field.type"
                  :placeholder="field.placeholder"
                  class="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                />
              </div>
              <button
                @click="handleSaveContact"
                :disabled="isSaving"
                class="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {{ isSaving ? I18N.LOADING.SAVING : I18N.BUTTONS.SAVE_CONTACT }}
              </button>
            </div>
          </div>
        </section>

      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { IonPage, IonContent } from '@ionic/vue'
import AppHeader from '@/components/AppHeader.vue'
import { useSettingsStore } from '@/stores/settings'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { I18N } from '@/constants/i18n'

const settingsStore = useSettingsStore()
const authStore = useAuthStore()
const uiStore = useUiStore()

const isSaving = ref(false)
const projectNameInput = ref('')
const descriptionInput = ref('')
const thumbnailInput = ref('')
const notesLabelInput = ref('')
const slugInput = ref('')
const contactForm = reactive({
  phone: '',
  email: '',
  location: '',
  website: '',
  facebook: '',
  instagram: '',
  x: '',
  youtube: '',
})

const contactFields = [
  { key: 'phone',     label: I18N.SETTINGS.CONTACT_PHONE,     type: 'tel',  placeholder: '+1 555 000 0000' },
  { key: 'email',     label: I18N.SETTINGS.CONTACT_EMAIL,     type: 'email', placeholder: 'contact@example.com' },
  { key: 'location',  label: I18N.SETTINGS.CONTACT_LOCATION,  type: 'text', placeholder: 'City, Country' },
  { key: 'website',   label: I18N.SETTINGS.CONTACT_WEBSITE,   type: 'url',  placeholder: 'https://example.com' },
  { key: 'facebook',  label: I18N.SETTINGS.CONTACT_FACEBOOK,  type: 'url',  placeholder: 'https://facebook.com/yourpage' },
  { key: 'instagram', label: I18N.SETTINGS.CONTACT_INSTAGRAM, type: 'url',  placeholder: 'https://instagram.com/yourhandle' },
  { key: 'x',         label: I18N.SETTINGS.CONTACT_X,         type: 'url',  placeholder: 'https://x.com/yourhandle' },
  { key: 'youtube',   label: I18N.SETTINGS.CONTACT_YOUTUBE,   type: 'url',  placeholder: 'https://youtube.com/@yourchannel' },
] as const

onMounted(async () => {
  const projectId = await authStore.getPersonalProjectId()
  if (!projectId) return
  await settingsStore.loadProjectSettings(projectId)
  projectNameInput.value = settingsStore.projectName
  descriptionInput.value = settingsStore.projectDescription ?? ''
  thumbnailInput.value = settingsStore.thumbnailUrl ?? ''
  notesLabelInput.value = settingsStore.notesFieldLabel
  slugInput.value = settingsStore.projectSlug ?? ''
  const ci = settingsStore.contactInfo as Record<string, string> | null
  if (ci) {
    Object.assign(contactForm, ci)
  }
})

async function handleSaveProjectName() {
  const projectId = await authStore.getPersonalProjectId()
  if (!projectId || !projectNameInput.value.trim()) return
  isSaving.value = true
  try {
    const result = await settingsStore.updateProjectName(projectId, projectNameInput.value)
    uiStore.showToast(result.success ? I18N.TOAST.PROJECT_NAME_SAVED : (result.error ?? I18N.TOAST.PROJECT_NAME_SAVE_FAILED), result.success ? 'success' : 'error')
  } finally {
    isSaving.value = false
  }
}

async function handleSaveDescription() {
  const projectId = await authStore.getPersonalProjectId()
  if (!projectId) return
  isSaving.value = true
  try {
    const result = await settingsStore.updateProjectDescription(projectId, descriptionInput.value)
    uiStore.showToast(result.success ? I18N.TOAST.PROJECT_DESCRIPTION_SAVED : (result.error ?? I18N.TOAST.PROJECT_DESCRIPTION_SAVE_FAILED), result.success ? 'success' : 'error')
  } finally {
    isSaving.value = false
  }
}

async function handleSaveThumbnail() {
  const projectId = await authStore.getPersonalProjectId()
  if (!projectId) return
  isSaving.value = true
  try {
    const result = await settingsStore.updateThumbnailUrl(projectId, thumbnailInput.value)
    if (result.success) {
      uiStore.showToast(I18N.TOAST.THUMBNAIL_SAVED, 'success')
    } else {
      uiStore.showToast(result.error || I18N.TOAST.THUMBNAIL_SAVE_FAILED, 'error')
    }
  } finally {
    isSaving.value = false
  }
}

async function handleToggleNotesField() {
  const projectId = await authStore.getPersonalProjectId()
  if (!projectId) return
  isSaving.value = true
  try {
    const newValue = !settingsStore.notesFieldEnabled
    const result = await settingsStore.updateNotesFieldEnabled(projectId, newValue)
    if (result.success) {
      uiStore.showToast(newValue ? I18N.TOAST.NOTES_FIELD_ENABLED : I18N.TOAST.NOTES_FIELD_DISABLED, 'success')
    } else {
      uiStore.showToast(result.error || I18N.TOAST.SETTING_UPDATE_FAILED, 'error')
    }
  } finally {
    isSaving.value = false
  }
}

async function handleSaveNotesLabel() {
  const projectId = await authStore.getPersonalProjectId()
  if (!projectId || !notesLabelInput.value.trim()) return
  isSaving.value = true
  try {
    const result = await settingsStore.updateNotesFieldLabel(projectId, notesLabelInput.value)
    if (result.success) {
      uiStore.showToast(I18N.TOAST.LABEL_UPDATED, 'success')
    } else {
      uiStore.showToast(result.error || I18N.TOAST.SETTING_UPDATE_FAILED, 'error')
    }
  } finally {
    isSaving.value = false
  }
}

async function handleSaveSlug() {
  const projectId = await authStore.getPersonalProjectId()
  if (!projectId) return
  isSaving.value = true
  try {
    const result = await settingsStore.updateProjectSlug(projectId, slugInput.value)
    if (result.success) {
      uiStore.showToast(I18N.TOAST.SLUG_SAVED, 'success')
    } else {
      uiStore.showToast(result.error || I18N.TOAST.SLUG_SAVE_FAILED, 'error')
    }
  } finally {
    isSaving.value = false
  }
}

async function handleToggleContact() {
  const projectId = await authStore.getPersonalProjectId()
  if (!projectId) return
  isSaving.value = true
  try {
    const newValue = !settingsStore.contactEnabled
    const result = await settingsStore.updateContactEnabled(projectId, newValue)
    if (result.success) {
      uiStore.showToast(newValue ? I18N.TOAST.CONTACT_ENABLED_ON : I18N.TOAST.CONTACT_ENABLED_OFF, 'success')
    } else {
      uiStore.showToast(result.error || I18N.TOAST.SETTING_UPDATE_FAILED, 'error')
    }
  } finally {
    isSaving.value = false
  }
}

async function handleSaveContact() {
  const projectId = await authStore.getPersonalProjectId()
  if (!projectId) return
  isSaving.value = true
  try {
    const result = await settingsStore.updateContactInfo(projectId, { ...contactForm })
    if (result.success) {
      uiStore.showToast(I18N.TOAST.CONTACT_SAVED, 'success')
    } else {
      uiStore.showToast(result.error || I18N.TOAST.CONTACT_SAVE_FAILED, 'error')
    }
  } finally {
    isSaving.value = false
  }
}
</script>
