<template>
  <div class="flex-shrink-0 bg-gray-800 border-b border-gray-700 p-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold text-white">Project settings</h2>
      <button @click="drawerStore.pop()" class="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors" aria-label="Close">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  </div>

  <div class="flex-1 overflow-y-auto">
    <div v-if="settingsStore.isLoadingProjectSettings" class="flex items-center justify-center py-16">
      <svg class="w-6 h-6 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>

    <div v-else class="p-4 space-y-6">

      <section>
        <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Project name</h3>
        <div class="flex gap-2">
          <input v-model="projectNameInput" type="text" maxlength="100" placeholder="My Band" class="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" @keyup.enter="handleSaveProjectName" />
          <button @click="handleSaveProjectName" :disabled="isSaving || !projectNameInput.trim()" class="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm">Save</button>
        </div>
      </section>

      <section>
        <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Description</h3>
        <textarea v-model="descriptionInput" maxlength="200" rows="3" placeholder="A short bio or description…" class="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm resize-none" />
        <div class="flex items-center justify-between mt-2">
          <span class="text-xs text-gray-500">{{ descriptionInput.length }}/200</span>
          <button @click="handleSaveDescription" :disabled="isSaving" class="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm">Save</button>
        </div>
      </section>

      <section>
        <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Thumbnail</h3>
        <div class="flex items-center gap-3 mb-3">
          <img v-if="thumbnailInput" :src="thumbnailInput" alt="Preview" class="w-12 h-12 rounded-full object-cover border border-gray-600 shrink-0" />
          <div v-else class="w-12 h-12 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center shrink-0">
            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
            </svg>
          </div>
          <input v-model="thumbnailInput" type="url" placeholder="https://example.com/image.jpg" class="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" />
        </div>
        <button @click="handleSaveThumbnail" :disabled="isSaving" class="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm">{{ isSaving ? 'Saving…' : 'Save' }}</button>
      </section>

      <section>
        <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Notes field</h3>
        <div class="bg-gray-800 rounded-lg p-3 border border-gray-700 mb-3">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <p class="text-white text-sm font-medium">Show notes field</p>
              <p class="text-xs text-gray-400 mt-0.5">Display a freeform text field on each song</p>
            </div>
            <button @click="handleToggleNotesField" :disabled="isSaving" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 shrink-0" :class="settingsStore.notesFieldEnabled ? 'bg-blue-600' : 'bg-gray-600'" role="switch" :aria-checked="settingsStore.notesFieldEnabled">
              <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" :class="settingsStore.notesFieldEnabled ? 'translate-x-6' : 'translate-x-1'" />
            </button>
          </div>
        </div>
        <div class="flex gap-2">
          <input v-model="notesLabelInput" type="text" maxlength="30" placeholder="Notes" class="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" @keyup.enter="handleSaveNotesLabel" />
          <button @click="handleSaveNotesLabel" :disabled="isSaving || !notesLabelInput.trim()" class="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm">Save</button>
        </div>
      </section>

      <section>
        <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">URL slug</h3>
        <p class="text-xs text-gray-400 mb-2">Used for public library URLs. Lowercase letters and hyphens only.</p>
        <div class="flex gap-2">
          <input v-model="slugInput" type="text" placeholder="my-band" class="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm lowercase" @keyup.enter="handleSaveSlug" />
          <button @click="handleSaveSlug" :disabled="isSaving" class="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm">Save</button>
        </div>
      </section>

      <section>
        <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Contact info</h3>
        <div class="bg-gray-800 rounded-lg p-3 border border-gray-700 mb-3">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <p class="text-white text-sm font-medium">Show on public library</p>
            </div>
            <button @click="handleToggleContact" :disabled="isSaving" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 shrink-0" :class="settingsStore.contactEnabled ? 'bg-blue-600' : 'bg-gray-600'" role="switch" :aria-checked="settingsStore.contactEnabled">
              <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" :class="settingsStore.contactEnabled ? 'translate-x-6' : 'translate-x-1'" />
            </button>
          </div>
        </div>
        <div class="space-y-3">
          <div v-for="field in contactFields" :key="field.key">
            <label :for="'contact-' + field.key" class="block text-xs font-medium text-gray-400 mb-1">{{ field.label }}</label>
            <input :id="'contact-' + field.key" v-model="contactForm[field.key]" :type="field.type" :placeholder="field.placeholder" class="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" />
          </div>
          <button @click="handleSaveContact" :disabled="isSaving" class="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium">{{ isSaving ? 'Saving…' : 'Save contact info' }}</button>
        </div>
      </section>

    </div>
  </div>
</template>

<script setup lang="ts">
import { useDrawerStore } from '@/stores/drawer'
import { useSettingsStore } from '@/stores/settings'
import { useProjectSettings, contactFields } from '@/composables/useProjectSettings'

const drawerStore = useDrawerStore()
const settingsStore = useSettingsStore()

const {
  isSaving,
  projectNameInput, handleSaveProjectName,
  descriptionInput, handleSaveDescription,
  thumbnailInput, handleSaveThumbnail,
  notesLabelInput, handleToggleNotesField, handleSaveNotesLabel,
  slugInput, handleSaveSlug,
  contactForm, handleToggleContact, handleSaveContact,
} = useProjectSettings()
</script>
