import { useUiStore } from '@/stores/ui'

export function useToast() {
  const uiStore = useUiStore()

  return {
    showToast: uiStore.showToast,
    showErrorToast: uiStore.showErrorToast,
  }
}
