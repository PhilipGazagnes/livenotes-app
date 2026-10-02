import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { updateProfile } from '@/services/profileService'
import { updatePassword, updateEmail } from '@/services/authService'

export function useUserAccountSettings() {
  const authStore = useAuthStore()
  const uiStore = useUiStore()

  const emailInput = ref(authStore.user?.email ?? '')
  const isSavingEmail = ref(false)
  const emailError = ref('')
  const emailSent = ref(false)

  const displayNameInput = ref(authStore.profile?.display_name ?? '')
  const isSavingName = ref(false)

  const newPassword = ref('')
  const confirmPassword = ref('')
  const isSavingPassword = ref(false)
  const passwordError = ref('')

  const passwordMismatch = ref(false)

  function updatePasswordMismatch() {
    passwordMismatch.value = !!confirmPassword.value && newPassword.value !== confirmPassword.value
  }

  onMounted(() => {
    emailInput.value = authStore.user?.email ?? ''
    displayNameInput.value = authStore.profile?.display_name ?? ''
  })

  async function handleUpdateEmail() {
    const email = emailInput.value.trim()
    if (!email || email === authStore.user?.email) return
    isSavingEmail.value = true
    emailError.value = ''
    emailSent.value = false
    try {
      const { error } = await updateEmail(email)
      if (error) throw error
      emailSent.value = true
    } catch (err) {
      emailError.value = err instanceof Error ? err.message : 'Failed to update email.'
    } finally {
      isSavingEmail.value = false
    }
  }

  async function handleSaveDisplayName() {
    const userId = authStore.userId
    if (!userId || !displayNameInput.value.trim()) return
    isSavingName.value = true
    try {
      await updateProfile(userId, { display_name: displayNameInput.value.trim() })
      if (authStore.profile) authStore.profile.display_name = displayNameInput.value.trim()
      uiStore.showToast('Display name updated', 'success')
    } catch {
      uiStore.showToast('Failed to update display name', 'error')
    } finally {
      isSavingName.value = false
    }
  }

  async function handleChangePassword() {
    if (!newPassword.value || passwordMismatch.value) return
    if (newPassword.value.length < 8) { passwordError.value = 'Password must be at least 8 characters.'; return }
    isSavingPassword.value = true
    passwordError.value = ''
    try {
      const { error } = await updatePassword(newPassword.value)
      if (error) throw error
      newPassword.value = ''
      confirmPassword.value = ''
      uiStore.showToast('Password updated', 'success')
    } catch (err) {
      passwordError.value = err instanceof Error ? err.message : 'Failed to update password.'
    } finally {
      isSavingPassword.value = false
    }
  }

  return {
    emailInput, isSavingEmail, emailError, emailSent, handleUpdateEmail,
    displayNameInput, isSavingName, handleSaveDisplayName,
    newPassword, confirmPassword, isSavingPassword, passwordError, passwordMismatch,
    updatePasswordMismatch, handleChangePassword,
  }
}
