import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error'
  duration: number
  context?: string // Additional context about the error/success
}

export interface ConfirmDialog {
  id: string
  title: string
  message: string
  confirmText: string
  cancelText: string
  onConfirm: () => void
  onCancel?: () => void
  isLoading?: boolean // Show spinner while operation is in progress
}

export interface OperationOverlay {
  isVisible: boolean
  message: string
}

export const useUiStore = defineStore('ui', () => {
  // State
  const isLoading = ref(false)
  const toasts = ref<Toast[]>([])
  const confirmDialog = ref<ConfirmDialog | null>(null)
  const isHamburgerMenuOpen = ref(false)
  
  // Operation overlay state
  const operationOverlay = ref<OperationOverlay>({
    isVisible: false,
    message: '',
  })
  
  // Bulk selection state
  const selectionMode = ref(false)
  const selectedIds = ref<string[]>([])
  
  // Actions
  function setLoading(loading: boolean) {
    isLoading.value = loading
  }

  function showToast(
    message: string, 
    type: 'success' | 'error' = 'success', 
    duration = 3000,
    context?: string
  ) {
    const id = `toast-${Date.now()}-${Math.random()}`
    const toast: Toast = { id, message, type, duration, context }
    
    toasts.value.push(toast)
    
    // Auto-remove toast after duration
    setTimeout(() => {
      removeToast(id)
    }, duration)
    
    return id
  }
  
  function showErrorToast(operationName: string, error: Error | string, duration = 5000) {
    const errorMessage = error instanceof Error ? error.message : error
    const message = `Failed to ${operationName}`
    showToast(message, 'error', duration, errorMessage)
  }

  function removeToast(id: string) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  function showConfirm(
    title: string,
    message: string,
    confirmText = 'Confirm',
    cancelText = 'Cancel'
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const id = `confirm-${Date.now()}`
      
      confirmDialog.value = {
        id,
        title,
        message,
        confirmText,
        cancelText,
        onConfirm: () => {
          confirmDialog.value = null
          resolve(true)
        },
        onCancel: () => {
          confirmDialog.value = null
          resolve(false)
        },
      }
    })
  }

  function closeConfirm() {
    if (confirmDialog.value?.onCancel) {
      confirmDialog.value.onCancel()
    } else {
      confirmDialog.value = null
    }
  }
  
  function setConfirmDialogLoading(loading: boolean) {
    if (confirmDialog.value) {
      confirmDialog.value.isLoading = loading
    }
  }
  
  function showOperationOverlay(message: string) {
    operationOverlay.value = {
      isVisible: true,
      message,
    }
  }
  
  function hideOperationOverlay() {
    operationOverlay.value = {
      isVisible: false,
      message: '',
    }
  }

  function openHamburgerMenu() {
    isHamburgerMenuOpen.value = true
  }

  function closeHamburgerMenu() {
    isHamburgerMenuOpen.value = false
  }

  function toggleHamburgerMenu() {
    isHamburgerMenuOpen.value = !isHamburgerMenuOpen.value
  }

  // Bulk selection actions
  function enterSelectionMode() {
    selectionMode.value = true
    selectedIds.value = []
  }

  function exitSelectionMode() {
    selectionMode.value = false
    selectedIds.value = []
  }

  function toggleSelection(id: string) {
    const index = selectedIds.value.indexOf(id)
    if (index > -1) {
      selectedIds.value.splice(index, 1)
    } else {
      selectedIds.value.push(id)
    }
  }

  function selectAll(ids: string[]) {
    selectedIds.value = [...ids]
  }

  function deselectAll() {
    selectedIds.value = []
  }

  function isSelected(id: string): boolean {
    return selectedIds.value.includes(id)
  }
  
  return {
    // State
    isLoading,
    toasts,
    confirmDialog,
    isHamburgerMenuOpen,
    operationOverlay,
    selectionMode,
    selectedIds,
    // Actions
    setLoading,
    showToast,
    showErrorToast,
    removeToast,
    showConfirm,
    closeConfirm,
    setConfirmDialogLoading,
    showOperationOverlay,
    hideOperationOverlay,
    openHamburgerMenu,
    closeHamburgerMenu,
    toggleHamburgerMenu,
    enterSelectionMode,
    exitSelectionMode,
    toggleSelection,
    selectAll,
    deselectAll,
    isSelected,
  }
})
