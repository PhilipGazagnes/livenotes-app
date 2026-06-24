<template>
  <!-- Header -->
  <div class="flex-shrink-0 bg-gray-800 border-b border-gray-700 p-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold text-white">Project settings</h2>
      <button
        @click="drawerStore.pop()"
        class="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
        aria-label="Close"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  </div>

  <!-- Scrollable content -->
  <div class="flex-1 overflow-y-auto">
    <div v-if="settingsStore.isLoadingProjectSettings" class="flex items-center justify-center py-16">
      <svg class="w-6 h-6 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>

    <div v-else class="p-4 space-y-6">

      <!-- Project Name -->
      <section>
        <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Project name</h3>
        <div class="flex gap-2">
          <input
            v-model="projectNameInput"
            type="text"
            maxlength="100"
            placeholder="My Band"
            class="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
            @keyup.enter="handleSaveProjectName"
          />
          <button
            @click="handleSaveProjectName"
            :disabled="isSaving || !projectNameInput.trim()"
            class="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >Save</button>
        </div>
      </section>

      <!-- Description -->
      <section>
        <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Description</h3>
        <textarea
          v-model="descriptionInput"
          maxlength="200"
          rows="3"
          placeholder="A short bio or description…"
          class="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm resize-none"
        />
        <div class="flex items-center justify-between mt-2">
          <span class="text-xs text-gray-500">{{ descriptionInput.length }}/200</span>
          <button
            @click="handleSaveDescription"
            :disabled="isSaving"
            class="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >Save</button>
        </div>
      </section>

      <!-- Thumbnail -->
      <section>
        <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Thumbnail</h3>
        <div class="flex items-center gap-3 mb-3">
          <img
            v-if="thumbnailInput"
            :src="thumbnailInput"
            alt="Preview"
            class="w-12 h-12 rounded-full object-cover border border-gray-600 shrink-0"
          />
          <div v-else class="w-12 h-12 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center shrink-0">
            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
            </svg>
          </div>
          <input
            v-model="thumbnailInput"
            type="url"
            placeholder="https://example.com/image.jpg"
            class="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
          />
        </div>
        <button
          @click="handleSaveThumbnail"
          :disabled="isSaving"
          class="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
        >{{ isSaving ? 'Saving…' : 'Save' }}</button>
      </section>

      <!-- Notes field -->
      <section>
        <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Notes field</h3>
        <div class="bg-gray-800 rounded-lg p-3 border border-gray-700 mb-3">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <p class="text-white text-sm font-medium">Show notes field</p>
              <p class="text-xs text-gray-400 mt-0.5">Display a freeform text field on each song</p>
            </div>
            <button
              @click="handleToggleNotesField"
              :disabled="isSaving"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 shrink-0"
              :class="settingsStore.notesFieldEnabled ? 'bg-blue-600' : 'bg-gray-600'"
              role="switch"
              :aria-checked="settingsStore.notesFieldEnabled"
            >
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                :class="settingsStore.notesFieldEnabled ? 'translate-x-6' : 'translate-x-1'"
              />
            </button>
          </div>
        </div>
        <div class="flex gap-2">
          <input
            v-model="notesLabelInput"
            type="text"
            maxlength="30"
            placeholder="Notes"
            class="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
            @keyup.enter="handleSaveNotesLabel"
          />
          <button
            @click="handleSaveNotesLabel"
            :disabled="isSaving || !notesLabelInput.trim()"
            class="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >Save</button>
        </div>
      </section>

      <!-- URL Slug -->
      <section>
        <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">URL slug</h3>
        <p class="text-xs text-gray-400 mb-2">Used for public library URLs. Lowercase letters and hyphens only.</p>
        <div class="flex gap-2">
          <input
            v-model="slugInput"
            type="text"
            placeholder="my-band"
            class="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm lowercase"
            @keyup.enter="handleSaveSlug"
          />
          <button
            @click="handleSaveSlug"
            :disabled="isSaving"
            class="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >Save</button>
        </div>
      </section>

      <!-- Contact info -->
      <section>
        <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Contact info</h3>
        <div class="bg-gray-800 rounded-lg p-3 border border-gray-700 mb-3">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <p class="text-white text-sm font-medium">Show on public library</p>
            </div>
            <button
              @click="handleToggleContact"
              :disabled="isSaving"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 shrink-0"
              :class="settingsStore.contactEnabled ? 'bg-blue-600' : 'bg-gray-600'"
              role="switch"
              :aria-checked="settingsStore.contactEnabled"
            >
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                :class="settingsStore.contactEnabled ? 'translate-x-6' : 'translate-x-1'"
              />
            </button>
          </div>
        </div>
        <div class="space-y-3">
          <div v-for="field in contactFields" :key="field.key">
            <label :for="'contact-' + field.key" class="block text-xs font-medium text-gray-400 mb-1">{{ field.label }}</label>
            <input
              :id="'contact-' + field.key"
              v-model="contactForm[field.key]"
              :type="field.type"
              :placeholder="field.placeholder"
              class="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
            />
          </div>
          <button
            @click="handleSaveContact"
            :disabled="isSaving"
            class="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >{{ isSaving ? 'Saving…' : 'Save contact info' }}</button>
        </div>
      </section>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useDrawerStore } from '@/stores/drawer'
import { useSettingsStore } from '@/stores/settings'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { I18N } from '@/constants/i18n'

const drawerStore = useDrawerStore()
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
  { key: 'phone',     label: 'Phone',     type: 'tel',   placeholder: '+1 555 000 0000' },
  { key: 'email',     label: 'Email',     type: 'email', placeholder: 'contact@example.com' },
  { key: 'location',  label: 'Location',  type: 'text',  placeholder: 'City, Country' },
  { key: 'website',   label: 'Website',   type: 'url',   placeholder: 'https://example.com' },
  { key: 'facebook',  label: 'Facebook',  type: 'url',   placeholder: 'https://facebook.com/yourpage' },
  { key: 'instagram', label: 'Instagram', type: 'url',   placeholder: 'https://instagram.com/yourhandle' },
  { key: 'x',         label: 'X',         type: 'url',   placeholder: 'https://x.com/yourhandle' },
  { key: 'youtube',   label: 'YouTube',   type: 'url',   placeholder: 'https://youtube.com/@yourchannel' },
] as const

onMounted(async () => {
  const projectId = authStore.activeProjectId
  if (!projectId) return
  await settingsStore.loadProjectSettings(projectId)
  projectNameInput.value = settingsStore.projectName
  descriptionInput.value = settingsStore.projectDescription ?? ''
  thumbnailInput.value = settingsStore.thumbnailUrl ?? ''
  notesLabelInput.value = settingsStore.notesFieldLabel
  slugInput.value = settingsStore.projectSlug ?? ''
  const ci = settingsStore.contactInfo as Record<string, string> | null
  if (ci) Object.assign(contactForm, ci)
})

async function handleSaveProjectName() {
  const projectId = authStore.activeProjectId
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
  const projectId = authStore.activeProjectId
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
  const projectId = authStore.activeProjectId
  if (!projectId) return
  isSaving.value = true
  try {
    const result = await settingsStore.updateThumbnailUrl(projectId, thumbnailInput.value)
    uiStore.showToast(result.success ? I18N.TOAST.THUMBNAIL_SAVED : (result.error ?? I18N.TOAST.THUMBNAIL_SAVE_FAILED), result.success ? 'success' : 'error')
  } finally {
    isSaving.value = false
  }
}

async function handleToggleNotesField() {
  const projectId = authStore.activeProjectId
  if (!projectId) return
  isSaving.value = true
  try {
    const newValue = !settingsStore.notesFieldEnabled
    const result = await settingsStore.updateNotesFieldEnabled(projectId, newValue)
    if (!result.success) uiStore.showToast(result.error ?? I18N.TOAST.SETTING_UPDATE_FAILED, 'error')
  } finally {
    isSaving.value = false
  }
}

async function handleSaveNotesLabel() {
  const projectId = authStore.activeProjectId
  if (!projectId || !notesLabelInput.value.trim()) return
  isSaving.value = true
  try {
    const result = await settingsStore.updateNotesFieldLabel(projectId, notesLabelInput.value)
    uiStore.showToast(result.success ? I18N.TOAST.LABEL_UPDATED : (result.error ?? I18N.TOAST.SETTING_UPDATE_FAILED), result.success ? 'success' : 'error')
  } finally {
    isSaving.value = false
  }
}

async function handleSaveSlug() {
  const projectId = authStore.activeProjectId
  if (!projectId) return
  isSaving.value = true
  try {
    const result = await settingsStore.updateProjectSlug(projectId, slugInput.value)
    uiStore.showToast(result.success ? I18N.TOAST.SLUG_SAVED : (result.error ?? I18N.TOAST.SLUG_SAVE_FAILED), result.success ? 'success' : 'error')
  } finally {
    isSaving.value = false
  }
}

async function handleToggleContact() {
  const projectId = authStore.activeProjectId
  if (!projectId) return
  isSaving.value = true
  try {
    const newValue = !settingsStore.contactEnabled
    const result = await settingsStore.updateContactEnabled(projectId, newValue)
    if (!result.success) uiStore.showToast(result.error ?? I18N.TOAST.SETTING_UPDATE_FAILED, 'error')
  } finally {
    isSaving.value = false
  }
}

async function handleSaveContact() {
  const projectId = authStore.activeProjectId
  if (!projectId) return
  isSaving.value = true
  try {
    const result = await settingsStore.updateContactInfo(projectId, { ...contactForm })
    uiStore.showToast(result.success ? I18N.TOAST.CONTACT_SAVED : (result.error ?? I18N.TOAST.CONTACT_SAVE_FAILED), result.success ? 'success' : 'error')
  } finally {
    isSaving.value = false
  }
}
</script>
