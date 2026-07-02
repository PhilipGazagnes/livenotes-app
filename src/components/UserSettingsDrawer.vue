<template>
  <div class="flex-shrink-0 bg-gray-800 border-b border-gray-700 p-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold text-white">User settings</h2>
      <button @click="drawerStore.pop()" class="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors" aria-label="Close">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  </div>

  <div class="flex-1 overflow-y-auto p-4 space-y-6">

    <!-- Account -->
    <section>
      <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Account</h3>

      <div class="mb-4">
        <label class="block text-xs font-medium text-gray-400 mb-1">Email</label>
        <div class="flex gap-2">
          <input v-model="emailInput" type="email" class="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" @input="emailError = ''" @keyup.enter="handleUpdateEmail" />
          <button @click="handleUpdateEmail" :disabled="isSavingEmail || !emailInput.trim() || emailInput === authStore.user?.email" class="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm">Save</button>
        </div>
        <p v-if="emailError" class="mt-1 text-xs text-red-400">{{ emailError }}</p>
        <p v-if="emailSent" class="mt-1 text-xs text-green-400">Confirmation sent — check your new inbox.</p>
      </div>

      <div class="mb-4">
        <label class="block text-xs font-medium text-gray-400 mb-1">Display name</label>
        <div class="flex gap-2">
          <input v-model="displayNameInput" type="text" maxlength="50" placeholder="Your name" class="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" @keyup.enter="handleSaveDisplayName" />
          <button @click="handleSaveDisplayName" :disabled="isSavingName || !displayNameInput.trim()" class="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm">Save</button>
        </div>
      </div>

      <div class="bg-gray-800 rounded-lg p-3 border border-gray-700">
        <p class="text-sm font-medium text-white mb-3">Change password</p>
        <div class="space-y-2">
          <input v-model="newPassword" type="password" placeholder="New password (min. 8 characters)" class="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" @input="updatePasswordMismatch(); passwordError = ''" />
          <input v-model="confirmPassword" type="password" placeholder="Confirm new password" class="w-full px-3 py-2 bg-gray-900 border rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" :class="passwordMismatch ? 'border-red-500' : 'border-gray-700'" @keyup.enter="handleChangePassword" @input="updatePasswordMismatch(); passwordError = ''" />
          <p v-if="passwordMismatch" class="text-xs text-red-400">Passwords do not match.</p>
          <p v-if="passwordError" class="text-xs text-red-400">{{ passwordError }}</p>
          <button @click="handleChangePassword" :disabled="isSavingPassword || !newPassword || passwordMismatch" class="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium">{{ isSavingPassword ? 'Updating…' : 'Update password' }}</button>
        </div>
      </div>
    </section>

    <!-- Display -->
    <section>
      <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Display</h3>
      <div class="space-y-2">
        <div v-for="toggle in displayToggles" :key="toggle.key" class="bg-gray-800 rounded-lg p-3 border border-gray-700">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <p class="text-white text-sm font-medium">{{ toggle.label }}</p>
              <p v-if="toggle.desc" class="text-xs text-gray-400 mt-0.5">{{ toggle.desc }}</p>
            </div>
            <button @click="toggle.toggle()" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none shrink-0" :class="toggle.value() ? 'bg-blue-600' : 'bg-gray-600'" role="switch" :aria-checked="toggle.value()">
              <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" :class="toggle.value() ? 'translate-x-6' : 'translate-x-1'" />
            </button>
          </div>
        </div>

        <div class="bg-gray-800 rounded-lg p-3 border border-gray-700">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <p class="text-white text-sm font-medium">{{ I18N.SETTINGS.LYRICS_TEXT_SIZE }}</p>
              <p class="text-xs text-gray-400 mt-0.5">Starting zoom when opening lyrics</p>
            </div>
            <div class="flex items-center gap-2 ml-4">
              <button @click="settingsStore.lyricsDefaultFontSize = Math.round((Math.max(0.75, settingsStore.lyricsDefaultFontSize - 0.125)) * 1000) / 1000" :disabled="settingsStore.lyricsDefaultFontSize <= 0.75" class="w-7 h-7 flex items-center justify-center rounded bg-gray-700 text-gray-300 hover:text-white disabled:opacity-30 transition-colors text-xs font-bold">A−</button>
              <span class="w-10 text-center text-white text-sm font-mono">{{ Math.round(settingsStore.lyricsDefaultFontSize * 100) }}%</span>
              <button @click="settingsStore.lyricsDefaultFontSize = Math.round((Math.min(3.0, settingsStore.lyricsDefaultFontSize + 0.125)) * 1000) / 1000" :disabled="settingsStore.lyricsDefaultFontSize >= 3.0" class="w-7 h-7 flex items-center justify-center rounded bg-gray-700 text-gray-300 hover:text-white disabled:opacity-30 transition-colors text-xs font-bold">A+</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Control -->
    <section>
      <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Control</h3>
      <div class="bg-gray-800 rounded-lg p-3 border border-gray-700 space-y-3">
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1">Scroll-down character</label>
          <p class="text-xs text-gray-500 mb-1">Single character from a Bluetooth controller that scrolls the lyrics down.</p>
          <input :value="localScrollChar" @input="localScrollChar = ($event.target as HTMLInputElement).value.slice(-1)" type="text" maxlength="1" class="w-16 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-center font-mono text-sm" placeholder="—" />
        </div>
        <div class="flex gap-3">
          <div class="flex-1">
            <label class="block text-xs font-medium text-gray-400 mb-1">Scroll amount (px)</label>
            <input v-model.number="localScrollAmount" type="number" min="10" max="2000" class="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" />
          </div>
          <div class="flex-1">
            <label class="block text-xs font-medium text-gray-400 mb-1">Duration (ms)</label>
            <input v-model.number="localScrollDuration" type="number" min="0" max="2000" class="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" />
          </div>
        </div>
        <button @click="handleSaveScrollSettings" class="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">{{ I18N.BUTTONS.SAVE }}</button>
      </div>
    </section>

    <!-- Reset -->
    <section>
      <button @click="handleReset" class="w-full bg-gray-800 rounded-lg p-3 border border-gray-700 hover:bg-gray-750 transition-colors text-left flex items-center gap-3">
        <svg class="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        <div>
          <p class="text-white text-sm font-medium">{{ I18N.SETTINGS.RESET_TO_DEFAULTS }}</p>
          <p class="text-xs text-gray-400">Restore all app settings to defaults</p>
        </div>
      </button>
    </section>

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDrawerStore } from '@/stores/drawer'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'
import { useUserAccountSettings } from '@/composables/useUserAccountSettings'
import { I18N } from '@/constants/i18n'

const drawerStore = useDrawerStore()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const uiStore = useUiStore()
const {
  emailInput, isSavingEmail, emailError, emailSent, handleUpdateEmail,
  displayNameInput, isSavingName, handleSaveDisplayName,
  newPassword, confirmPassword, isSavingPassword, passwordError, passwordMismatch,
  updatePasswordMismatch, handleChangePassword,
} = useUserAccountSettings()

const localScrollChar = ref(settingsStore.scrollDownChar)
const localScrollAmount = ref(settingsStore.scrollDownAmount)
const localScrollDuration = ref(settingsStore.scrollDownDuration)

const displayToggles = [
  { key: 'tags', label: I18N.SETTINGS.SHOW_TAGS, desc: I18N.SETTINGS.SHOW_TAGS_DESC, value: () => settingsStore.showTagsInLists, toggle: () => settingsStore.toggleShowTagsInLists() },
  { key: 'lists', label: I18N.SETTINGS.SHOW_LISTS, desc: I18N.SETTINGS.SHOW_LISTS_DESC, value: () => settingsStore.showListsInLists, toggle: () => settingsStore.toggleShowListsInLists() },
  { key: 'artists', label: I18N.SETTINGS.SHOW_ARTISTS, desc: I18N.SETTINGS.SHOW_ARTISTS_DESC, value: () => settingsStore.showArtistsInLists, toggle: () => settingsStore.toggleShowArtistsInLists() },
  { key: 'lyrics', label: I18N.SETTINGS.SHOW_LYRICS_ON_TAP, desc: I18N.SETTINGS.SHOW_LYRICS_ON_TAP_DESC, value: () => settingsStore.songClickShowsLyrics, toggle: () => { settingsStore.songClickShowsLyrics = !settingsStore.songClickShowsLyrics } },
]

function handleSaveScrollSettings() {
  settingsStore.saveScrollControlSettings(localScrollChar.value, localScrollAmount.value, localScrollDuration.value)
  uiStore.showToast(I18N.TOAST.SCROLL_SETTINGS_SAVED, 'success')
}

async function handleReset() {
  const confirmed = await uiStore.showConfirm(
    I18N.SETTINGS.RESET_SETTINGS_TITLE, I18N.SETTINGS.RESET_SETTINGS_CONFIRM,
    I18N.BUTTONS.RESET, I18N.BUTTONS.CANCEL,
  )
  if (confirmed) {
    settingsStore.resetToDefaults()
    localScrollChar.value = settingsStore.scrollDownChar
    localScrollAmount.value = settingsStore.scrollDownAmount
    localScrollDuration.value = settingsStore.scrollDownDuration
    uiStore.showToast(I18N.TOAST.SETTINGS_RESET, 'success')
  }
}
</script>
