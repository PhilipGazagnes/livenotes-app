<template>
  <!-- Backdrop -->
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black/50 z-50 transition-opacity"
    :class="isOpen ? 'opacity-100' : 'opacity-0'"
    @click="handleCancel"
  />
  
  <!-- Drawer -->
  <div
    class="fixed top-0 right-0 h-full w-full md:w-[500px] bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 flex flex-col"
    :class="isOpen ? 'translate-x-0' : 'translate-x-full'"
  >
    <!-- Header -->
    <div class="flex-shrink-0 bg-gray-800 border-b border-gray-700 p-4">
      <div class="flex items-start justify-between">
        <div class="flex-1 min-w-0 mr-3">
          <h2 class="text-xl font-semibold text-white">
            {{ step === 'type-selection' ? 'Add Note' : `New ${selectedTypeLabel} Note` }}
          </h2>
          <p class="text-sm text-gray-400 mt-1">
            {{ step === 'type-selection' ? 'Choose note type' : 'Fill in note details' }}
          </p>
        </div>
        <button
          @click="handleCancel"
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
        <p class="text-sm text-gray-400 mb-4">
          What type of note would you like to add?
        </p>
        
        <!-- 
          HOW TO ADD NEW NOTE TYPES:
          
          1. Add the new type to the NOTE_TYPE_CONFIG array below
          2. Add the type to the NOTE_TYPES array in src/constants/validation.ts
          3. Add the type to the note_type ENUM in migration 013_create_notes_table.sql
          4. Add form fields in the "Content: Note Form" section below (look for the switch statement)
          5. Add appropriate validation in the isFormValid computed property
          
          That's it! The system will automatically handle the new note type.
        -->
        
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
        <!-- Name/Title field (common to all types) -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Name <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.name"
            type="text"
            :maxlength="VALIDATION.NOTE_TITLE_MAX_LENGTH"
            :placeholder="getNamePlaceholder(selectedType!)"
            class="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            autofocus
          />
          <p class="text-xs text-gray-500 mt-1">
            {{ formData.name.length }} / {{ VALIDATION.NOTE_TITLE_MAX_LENGTH }}
          </p>
        </div>

        <!-- Type-specific content fields -->
        <!-- SongCode -->
        <div v-if="selectedType === 'songcode'">
          <label class="block text-sm font-medium text-gray-300 mb-2">
            SongCode <span class="text-red-500">*</span>
          </label>
          <textarea
            v-model="formData.content"
            :maxlength="VALIDATION.NOTE_CONTENT_MAX_LENGTH"
            :rows="15"
            placeholder="Enter SongCode notation...&#10;&#10;Example:&#10;[I]ntro&#10;[V]erse&#10;[C]horus&#10;[B]ridge"
            class="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono text-sm resize-none"
          />
          <p class="text-xs text-gray-500 mt-1">
            {{ formData.content.length }} / {{ VALIDATION.NOTE_CONTENT_MAX_LENGTH }}
          </p>
          <div class="bg-blue-900/20 border border-blue-800/30 rounded-lg p-3 mt-3">
            <p class="text-sm text-blue-300">
              💡 <strong>Tip:</strong> Use section markers like [I]ntro, [V]erse, [C]horus, [B]ridge
            </p>
          </div>
        </div>

        <!-- Plain Text -->
        <div v-else-if="selectedType === 'plain_text'">
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Content <span class="text-red-500">*</span>
          </label>
          <textarea
            v-model="formData.content"
            :maxlength="VALIDATION.NOTE_CONTENT_MAX_LENGTH"
            :rows="12"
            placeholder="Enter your notes here..."
            class="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
          />
          <p class="text-xs text-gray-500 mt-1">
            {{ formData.content.length }} / {{ VALIDATION.NOTE_CONTENT_MAX_LENGTH }}
          </p>
        </div>

        <!-- Looper -->
        <div v-else-if="selectedType === 'looper'" class="space-y-4">
          <!-- BPM -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              BPM <span class="text-red-500">*</span>
            </label>
            <input
              v-model.number="looperData.bpm"
              type="number"
              min="1"
              max="300"
              placeholder="120"
              class="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <!-- Pattern 1 -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Pattern 1 <span class="text-red-500">*</span>
            </label>
            <input
              v-model="looperData.pattern1"
              type="text"
              placeholder="e.g., Kick-Snare-Kick-Snare"
              class="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <!-- Pattern 1 Variation -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Pattern 1 Variation
            </label>
            <input
              v-model="looperData.pattern1_var"
              type="text"
              placeholder="e.g., Double time on chorus"
              class="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <!-- Pattern 2 -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Pattern 2
            </label>
            <input
              v-model="looperData.pattern2"
              type="text"
              placeholder="e.g., Bass line loop"
              class="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <!-- Pattern 2 Variation -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Pattern 2 Variation
            </label>
            <input
              v-model="looperData.pattern2_var"
              type="text"
              placeholder="e.g., Variation for bridge"
              class="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <!-- Comment -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Comment
            </label>
            <textarea
              v-model="looperData.comment"
              rows="3"
              placeholder="Additional notes about the looper setup..."
              class="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
        </div>

        <!-- 
          TO ADD MORE NOTE TYPES:
          Add more v-else-if blocks here following the same pattern:
          
          <div v-else-if="selectedType === 'your_new_type'">
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Field Label <span class="text-red-500">*</span>
            </label>
            <input or textarea
              v-model="formData.content"
              ...
            />
          </div>
        -->
      </form>
    </div>

    <!-- Footer Actions -->
    <div class="flex-shrink-0 bg-gray-800 border-t border-gray-700 p-4">
      <!-- Type Selection Footer -->
      <div v-if="step === 'type-selection'" class="flex gap-3">
        <button
          @click="handleCancel"
          class="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          @click="handleChooseType"
          :disabled="!selectedType"
          :class="[
            'flex-1 px-4 py-3 font-medium rounded-lg transition-colors',
            selectedType
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          ]"
        >
          Choose
        </button>
      </div>

      <!-- Form Footer -->
      <div v-else-if="step === 'form'" class="flex gap-3">
        <button
          @click="handleBackToTypeSelection"
          class="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          @click="handleSave"
          :disabled="!isFormValid || isSaving"
          :class="[
            'flex-1 px-4 py-3 font-medium rounded-lg transition-colors flex items-center justify-center gap-2',
            isFormValid && !isSaving
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          ]"
        >
          <svg v-if="isSaving" class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>{{ isSaving ? 'Saving...' : 'Save' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, h } from 'vue'
import { useNotesStore } from '@/stores/notes'
import { useUiStore } from '@/stores/ui'
import type { NoteType, LooperContent } from '@/types/database'
import { VALIDATION } from '@/constants/validation'
import { MESSAGES } from '@/constants/messages'

interface Props {
  isOpen: boolean
  librarySongId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const notesStore = useNotesStore()
const uiStore = useUiStore()

// State
type Step = 'type-selection' | 'form'
const step = ref<Step>('type-selection')
const selectedType = ref<NoteType | null>(null)
const isSaving = ref(false)

const formData = ref({
  name: '',
  content: ''
})

const looperData = ref<LooperContent>({
  bpm: 120,
  pattern1: '',
  pattern1_var: '',
  pattern2: '',
  pattern2_var: '',
  comment: ''
})

// Note type configuration
// HOW TO ADD NEW NOTE TYPES: Add new entries to this array
const NOTE_TYPE_CONFIG = [
  {
    value: 'songcode' as NoteType,
    label: 'SongCode',
    description: 'Structured song notation for arrangements',
    icon: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' })
    ]),
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-900/30'
  },
  {
    value: 'plain_text' as NoteType,
    label: 'Plain Text',
    description: 'General notes and annotations',
    icon: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M4 6h16M4 12h16M4 18h16' })
    ]),
    iconColor: 'text-gray-400',
    iconBg: 'bg-gray-700/30'
  },
  {
    value: 'looper' as NoteType,
    label: 'Looper',
    description: 'Loop pedal settings with BPM and patterns',
    icon: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' })
    ]),
    iconColor: 'text-cyan-400',
    iconBg: 'bg-cyan-900/30'
  },
  // TO ADD MORE NOTE TYPES: Uncomment and configure these entries, or add your own
  /*
  {
    value: 'lyrics' as NoteType,
    label: 'Lyrics',
    description: 'Song lyrics and words',
    icon: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' })
    ]),
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-900/30'
  },
  {
    value: 'chords' as NoteType,
    label: 'Chords',
    description: 'Chord progressions and charts',
    icon: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3' })
    ]),
    iconColor: 'text-green-400',
    iconBg: 'bg-green-900/30'
  },
  */
]

// Computed
const selectedTypeLabel = computed(() => {
  const config = NOTE_TYPE_CONFIG.find(t => t.value === selectedType.value)
  return config?.label || ''
})

const isFormValid = computed(() => {
  if (selectedType.value === 'looper') {
    // For looper type, require name, bpm, and pattern1
    return formData.value.name.trim().length > 0 && 
           looperData.value.bpm > 0 && 
           looperData.value.pattern1.trim().length > 0
  }
  const hasName = formData.value.name.trim().length > 0
  const hasContent = formData.value.content.trim().length > 0
  return hasName && hasContent
})

// Watch for drawer open/close to reset state
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    resetForm()
  }
})

// Methods
function selectType(type: NoteType) {
  selectedType.value = type
}

function handleChooseType() {
  if (!selectedType.value) return
  step.value = 'form'
}

function handleBackToTypeSelection() {
  step.value = 'type-selection'
  formData.value.name = ''
  formData.value.content = ''
}

function handleCancel() {
  emit('close')
  // Reset after animation completes
  setTimeout(() => {
    resetForm()
  }, 300)
}

function resetForm() {
  step.value = 'type-selection'
  selectedType.value = null
  formData.value.name = ''
  formData.value.content = ''
  looperData.value = {
    bpm: 120,
    pattern1: '',
    pattern1_var: '',
    pattern2: '',
    pattern2_var: '',
    comment: ''
  }
  isSaving.value = false
}

function getNamePlaceholder(type: NoteType): string {
  const placeholders: Record<NoteType, string> = {
    songcode: 'e.g., "Original arrangement", "Acoustic version"',
    plain_text: 'e.g., "Performance notes", "Setup instructions"',
    lyrics: 'e.g., "Original lyrics", "Translated lyrics"',
    chords: 'e.g., "Standard tuning", "Capo 2"',
    tablature: 'e.g., "Intro riff", "Solo tab"',
    youtube: 'e.g., "Official video", "Live performance"',
    image: 'e.g., "Original chart", "Handwritten notes"',
    video: 'e.g., "Practice video", "Tutorial"',
    audio: 'e.g., "Original recording", "Practice track"',
    looper_notes: 'e.g., "Loop 1 settings", "Pedal configuration"',
    looper: 'e.g., "Main loop setup", "Verse pattern"'
  }
  return placeholders[type] || 'Enter note name'
}

async function handleSave() {
  if (!isFormValid.value || !selectedType.value || isSaving.value) return

  isSaving.value = true

  try {
    let content: string
    
    // For looper type, serialize structured data as JSON
    if (selectedType.value === 'looper') {
      content = JSON.stringify(looperData.value)
    } else {
      content = formData.value.content.trim()
    }
    
    await notesStore.createNote(
      props.librarySongId,
      selectedType.value,
      content,
      formData.value.name.trim()
    )
    
    uiStore.showToast(MESSAGES.SUCCESS.NOTE_CREATED, 'success')
    emit('saved')
    emit('close')
    
    // Reset after animation completes
    setTimeout(() => {
      resetForm()
    }, 300)
  } catch (err) {
    uiStore.showErrorToast('create note', err as Error)
  } finally {
    isSaving.value = false
  }
}
</script>
