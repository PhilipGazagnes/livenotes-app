import { ref, computed, h } from 'vue'
import { useDrawerStore } from '@/stores/drawer'
import { useNotesStore } from '@/stores/notes'
import { useUiStore } from '@/stores/ui'
import type { NoteType, LooperContent } from '@/types/database'
import { VALIDATION } from '@/constants/validation'
import { MESSAGES } from '@/constants/messages'
import { I18N } from '@/constants/i18n'

export const NOTE_TYPE_CONFIG = [
  {
    value: 'songcode' as NoteType,
    label: 'SongCode',
    description: I18N.NOTES.TYPE_DESCRIPTIONS.songcode,
    icon: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' }),
    ]),
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-900/30',
  },
  {
    value: 'plain_text' as NoteType,
    label: 'Plain Text',
    description: I18N.NOTES.TYPE_DESCRIPTIONS.plain_text,
    icon: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M4 6h16M4 12h16M4 18h16' }),
    ]),
    iconColor: 'text-gray-400',
    iconBg: 'bg-gray-700/30',
  },
  {
    value: 'looper' as NoteType,
    label: 'Looper',
    description: I18N.NOTES.TYPE_DESCRIPTIONS.looper,
    icon: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' }),
    ]),
    iconColor: 'text-cyan-400',
    iconBg: 'bg-cyan-900/30',
  },
]

export function getNamePlaceholder(type: NoteType): string {
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
    looper: 'e.g., "Main loop setup", "Verse pattern"',
  }
  return placeholders[type] || I18N.PLACEHOLDERS.NOTE_TITLE
}

export function useNoteCreation(librarySongId: string, onSaved?: () => void) {
  const drawerStore = useDrawerStore()
  const notesStore = useNotesStore()
  const uiStore = useUiStore()

  type Step = 'type-selection' | 'form'
  const step = ref<Step>('type-selection')
  const selectedType = ref<NoteType | null>(null)
  const isSaving = ref(false)
  const formData = ref({ name: '', content: '' })
  const looperData = ref<LooperContent>({
    bpm: '', pattern1: '', pattern1_var: '', pattern2: '', pattern2_var: '', comment: '',
  })

  const selectedTypeLabel = computed(() => NOTE_TYPE_CONFIG.find(t => t.value === selectedType.value)?.label || '')

  const isFormValid = computed(() => {
    if (selectedType.value === 'looper') {
      return formData.value.name.trim().length > 0 &&
        looperData.value.bpm.trim().length > 0 &&
        looperData.value.pattern1.trim().length > 0
    }
    return formData.value.name.trim().length > 0 && formData.value.content.trim().length > 0
  })

  function selectType(type: NoteType) { selectedType.value = type }

  function handleChooseType() {
    if (selectedType.value) step.value = 'form'
  }

  function handleBackToTypeSelection() {
    step.value = 'type-selection'
    formData.value.name = ''
    formData.value.content = ''
  }

  function handleCancel() { drawerStore.pop() }

  async function handleSave() {
    if (!isFormValid.value || !selectedType.value || isSaving.value) return
    isSaving.value = true
    try {
      if (selectedType.value === 'looper') {
        await notesStore.createNote(librarySongId, selectedType.value, null, formData.value.name.trim(), looperData.value)
      } else {
        await notesStore.createNote(librarySongId, selectedType.value, formData.value.content.trim(), formData.value.name.trim())
      }
      uiStore.showToast(MESSAGES.SUCCESS.NOTE_CREATED, 'success')
      onSaved?.()
      drawerStore.pop()
    } catch (err) {
      uiStore.showErrorToast('create note', err as Error)
    } finally {
      isSaving.value = false
    }
  }

  return {
    step, selectedType, selectedTypeLabel, isSaving,
    formData, looperData, isFormValid,
    selectType, handleChooseType, handleBackToTypeSelection, handleCancel, handleSave,
    VALIDATION,
  }
}
