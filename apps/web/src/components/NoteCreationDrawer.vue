<template>
  <!-- Header -->
  <div class="flex-shrink-0 bg-gray-800 border-b border-gray-700 p-4">
    <div class="flex items-start justify-between">
      <div class="flex-1 min-w-0 mr-3">
        <h2 class="text-xl font-semibold text-white">
          {{ step === 'type-selection' ? I18N.NOTES.ADD_NOTE : I18N.NOTES.NEW_NOTE(selectedTypeLabel) }}
        </h2>
        <p class="text-sm text-gray-400 mt-1">
          {{ step === 'type-selection' ? I18N.NOTES.CHOOSE_TYPE : I18N.NOTES.FILL_DETAILS }}
        </p>
      </div>
      <button
        @click="handleCancel"
        :aria-label="I18N.ARIA.CLOSE"
        class="flex-shrink-0 p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  </div>

  <!-- Content: Type Selection -->
  <div v-if="step === 'type-selection'" class="flex-1 overflow-y-auto p-6">
    <div class="space-y-3">
      <p class="text-sm text-gray-400 mb-4">{{ I18N.NOTES.TYPE_PROMPT }}</p>

      <button
        v-for="noteType in NOTE_TYPE_CONFIG"
        :key="noteType.value"
        @click="selectType(noteType.value)"
        :class="[
          'w-full p-4 rounded-lg border-2 transition-all text-left',
          selectedType === noteType.value
            ? 'border-blue-500 bg-blue-900/20'
            : 'border-gray-700 bg-gray-800 hover:border-gray-600'
        ]"
      >
        <div class="flex items-start gap-3">
          <div :class="['flex-shrink-0 p-2 rounded-lg', noteType.iconBg]">
            <component :is="noteType.icon" :class="['w-6 h-6', noteType.iconColor]" />
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-base font-semibold text-white mb-1">{{ noteType.label }}</h3>
            <p class="text-sm text-gray-400">{{ noteType.description }}</p>
          </div>
          <div v-if="selectedType === noteType.value" class="flex-shrink-0">
            <svg class="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
          </div>
        </div>
      </button>
    </div>
  </div>

  <!-- Content: Note Form -->
  <div v-else-if="step === 'form'" class="flex-1 overflow-y-auto p-6">
    <form @submit.prevent="handleSave" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">
          {{ I18N.FORM.NAME }} <span class="text-red-500">{{ I18N.FORM.REQUIRED }}</span>
        </label>
        <input
          v-model="formData.name"
          type="text"
          :maxlength="VALIDATION.NOTE_TITLE_MAX_LENGTH"
          :placeholder="getNamePlaceholder(selectedType!)"
          class="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          autofocus
        />
        <p class="text-xs text-gray-500 mt-1">{{ formData.name.length }} / {{ VALIDATION.NOTE_TITLE_MAX_LENGTH }}</p>
      </div>

      <!-- SongCode -->
      <div v-if="selectedType === 'songcode'">
        <label class="block text-sm font-medium text-gray-300 mb-2">
          SongCode <span class="text-red-500">{{ I18N.FORM.REQUIRED }}</span>
        </label>
        <textarea
          v-model="formData.content"
          :maxlength="VALIDATION.NOTE_CONTENT_MAX_LENGTH"
          :rows="15"
          :placeholder="I18N.PLACEHOLDERS.NOTE_SONGCODE"
          class="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono text-sm resize-none"
        />
        <p class="text-xs text-gray-500 mt-1">{{ formData.content.length }} / {{ VALIDATION.NOTE_CONTENT_MAX_LENGTH }}</p>
        <div class="bg-blue-900/20 border border-blue-800/30 rounded-lg p-3 mt-3">
          <p class="text-sm text-blue-300">{{ I18N.NOTES.SONGCODE_TIP }}</p>
        </div>
      </div>

      <!-- Plain Text -->
      <div v-else-if="selectedType === 'plain_text'">
        <label class="block text-sm font-medium text-gray-300 mb-2">
          {{ I18N.NOTES.URL_CONTENT }} <span class="text-red-500">{{ I18N.FORM.REQUIRED }}</span>
        </label>
        <textarea
          v-model="formData.content"
          :maxlength="VALIDATION.NOTE_CONTENT_MAX_LENGTH"
          :rows="12"
          :placeholder="I18N.PLACEHOLDERS.NOTE_CONTENT"
          class="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
        />
        <p class="text-xs text-gray-500 mt-1">{{ formData.content.length }} / {{ VALIDATION.NOTE_CONTENT_MAX_LENGTH }}</p>
      </div>

      <!-- Looper -->
      <div v-else-if="selectedType === 'looper'" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">{{ I18N.NOTES.LOOPER_BPM }} <span class="text-red-500">{{ I18N.FORM.REQUIRED }}</span></label>
          <input v-model="looperData.bpm" type="text" :placeholder="I18N.PLACEHOLDERS.LOOPER_BPM"
            class="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">{{ I18N.NOTES.LOOPER_PATTERN }} 1 <span class="text-red-500">{{ I18N.FORM.REQUIRED }}</span></label>
          <input v-model="looperData.pattern1" type="text" :placeholder="I18N.PLACEHOLDERS.LOOPER_PATTERN"
            class="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">{{ I18N.NOTES.LOOPER_PATTERN }} 1 Variation</label>
          <input v-model="looperData.pattern1_var" type="text" :placeholder="I18N.PLACEHOLDERS.LOOPER_PATTERN_VAR1"
            class="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">{{ I18N.NOTES.LOOPER_PATTERN }} 2</label>
          <input v-model="looperData.pattern2" type="text" :placeholder="I18N.PLACEHOLDERS.LOOPER_PATTERN2"
            class="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">{{ I18N.NOTES.LOOPER_PATTERN }} 2 Variation</label>
          <input v-model="looperData.pattern2_var" type="text" :placeholder="I18N.PLACEHOLDERS.LOOPER_PATTERN_VAR2"
            class="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">{{ I18N.NOTES.LOOPER_ADDITIONAL_NOTES }}</label>
          <textarea v-model="looperData.comment" rows="3" :placeholder="I18N.PLACEHOLDERS.LOOPER_NOTES"
            class="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none" />
        </div>
      </div>
    </form>
  </div>

  <!-- Footer -->
  <div class="flex-shrink-0 bg-gray-800 border-t border-gray-700 p-4">
    <div v-if="step === 'type-selection'" class="flex gap-3">
      <button
        @click="handleCancel"
        class="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
      >
        {{ I18N.BUTTONS.CANCEL }}
      </button>
      <button
        @click="handleChooseType"
        :disabled="!selectedType"
        :class="[
          'flex-1 px-4 py-3 font-medium rounded-lg transition-colors',
          selectedType ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'
        ]"
      >
        {{ I18N.BUTTONS.CHOOSE }}
      </button>
    </div>

    <div v-else-if="step === 'form'" class="flex gap-3">
      <button
        @click="handleBackToTypeSelection"
        class="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
      >
        {{ I18N.BUTTONS.BACK }}
      </button>
      <button
        @click="handleSave"
        :disabled="!isFormValid || isSaving"
        :class="[
          'flex-1 px-4 py-3 font-medium rounded-lg transition-colors flex items-center justify-center gap-2',
          isFormValid && !isSaving ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'
        ]"
      >
        <svg v-if="isSaving" class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>{{ isSaving ? I18N.LOADING.SAVING : I18N.BUTTONS.SAVE }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNoteCreation, NOTE_TYPE_CONFIG, getNamePlaceholder } from '@/composables/useNoteCreation'
import { VALIDATION } from '@/constants/validation'
import { I18N } from '@/constants/i18n'

const props = defineProps<{
  librarySongId: string
  onSaved?: () => void
}>()

const {
  step, selectedType, selectedTypeLabel, isSaving,
  formData, looperData, isFormValid,
  selectType, handleChooseType, handleBackToTypeSelection, handleCancel, handleSave,
} = useNoteCreation(props.librarySongId, props.onSaved)
</script>
