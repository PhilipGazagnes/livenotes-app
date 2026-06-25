import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'
import { I18N } from '@/constants/i18n'

export const contactFields = [
  { key: 'phone',     label: 'Phone',     type: 'tel',   placeholder: '+1 555 000 0000' },
  { key: 'email',     label: 'Email',     type: 'email', placeholder: 'contact@example.com' },
  { key: 'location',  label: 'Location',  type: 'text',  placeholder: 'City, Country' },
  { key: 'website',   label: 'Website',   type: 'url',   placeholder: 'https://example.com' },
  { key: 'facebook',  label: 'Facebook',  type: 'url',   placeholder: 'https://facebook.com/yourpage' },
  { key: 'instagram', label: 'Instagram', type: 'url',   placeholder: 'https://instagram.com/yourhandle' },
  { key: 'x',         label: 'X',         type: 'url',   placeholder: 'https://x.com/yourhandle' },
  { key: 'youtube',   label: 'YouTube',   type: 'url',   placeholder: 'https://youtube.com/@yourchannel' },
] as const

type ContactKey = typeof contactFields[number]['key']

export function useProjectSettings() {
  const authStore = useAuthStore()
  const settingsStore = useSettingsStore()
  const uiStore = useUiStore()

  const isSaving = ref(false)
  const projectNameInput = ref('')
  const descriptionInput = ref('')
  const thumbnailInput = ref('')
  const notesLabelInput = ref('')
  const slugInput = ref('')
  const contactForm = reactive<Record<ContactKey, string>>({
    phone: '', email: '', location: '', website: '',
    facebook: '', instagram: '', x: '', youtube: '',
  })

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
    } finally { isSaving.value = false }
  }

  async function handleSaveDescription() {
    const projectId = authStore.activeProjectId
    if (!projectId) return
    isSaving.value = true
    try {
      const result = await settingsStore.updateProjectDescription(projectId, descriptionInput.value)
      uiStore.showToast(result.success ? I18N.TOAST.PROJECT_DESCRIPTION_SAVED : (result.error ?? I18N.TOAST.PROJECT_DESCRIPTION_SAVE_FAILED), result.success ? 'success' : 'error')
    } finally { isSaving.value = false }
  }

  async function handleSaveThumbnail() {
    const projectId = authStore.activeProjectId
    if (!projectId) return
    isSaving.value = true
    try {
      const result = await settingsStore.updateThumbnailUrl(projectId, thumbnailInput.value)
      uiStore.showToast(result.success ? I18N.TOAST.THUMBNAIL_SAVED : (result.error ?? I18N.TOAST.THUMBNAIL_SAVE_FAILED), result.success ? 'success' : 'error')
    } finally { isSaving.value = false }
  }

  async function handleToggleNotesField() {
    const projectId = authStore.activeProjectId
    if (!projectId) return
    isSaving.value = true
    try {
      const result = await settingsStore.updateNotesFieldEnabled(projectId, !settingsStore.notesFieldEnabled)
      if (!result.success) uiStore.showToast(result.error ?? I18N.TOAST.SETTING_UPDATE_FAILED, 'error')
    } finally { isSaving.value = false }
  }

  async function handleSaveNotesLabel() {
    const projectId = authStore.activeProjectId
    if (!projectId || !notesLabelInput.value.trim()) return
    isSaving.value = true
    try {
      const result = await settingsStore.updateNotesFieldLabel(projectId, notesLabelInput.value)
      uiStore.showToast(result.success ? I18N.TOAST.LABEL_UPDATED : (result.error ?? I18N.TOAST.SETTING_UPDATE_FAILED), result.success ? 'success' : 'error')
    } finally { isSaving.value = false }
  }

  async function handleSaveSlug() {
    const projectId = authStore.activeProjectId
    if (!projectId) return
    isSaving.value = true
    try {
      const result = await settingsStore.updateProjectSlug(projectId, slugInput.value)
      uiStore.showToast(result.success ? I18N.TOAST.SLUG_SAVED : (result.error ?? I18N.TOAST.SLUG_SAVE_FAILED), result.success ? 'success' : 'error')
    } finally { isSaving.value = false }
  }

  async function handleToggleContact() {
    const projectId = authStore.activeProjectId
    if (!projectId) return
    isSaving.value = true
    try {
      const result = await settingsStore.updateContactEnabled(projectId, !settingsStore.contactEnabled)
      if (!result.success) uiStore.showToast(result.error ?? I18N.TOAST.SETTING_UPDATE_FAILED, 'error')
    } finally { isSaving.value = false }
  }

  async function handleSaveContact() {
    const projectId = authStore.activeProjectId
    if (!projectId) return
    isSaving.value = true
    try {
      const result = await settingsStore.updateContactInfo(projectId, { ...contactForm })
      uiStore.showToast(result.success ? I18N.TOAST.CONTACT_SAVED : (result.error ?? I18N.TOAST.CONTACT_SAVE_FAILED), result.success ? 'success' : 'error')
    } finally { isSaving.value = false }
  }

  return {
    isSaving,
    projectNameInput, handleSaveProjectName,
    descriptionInput, handleSaveDescription,
    thumbnailInput, handleSaveThumbnail,
    notesLabelInput, handleToggleNotesField, handleSaveNotesLabel,
    slugInput, handleSaveSlug,
    contactForm, handleToggleContact, handleSaveContact,
  }
}
