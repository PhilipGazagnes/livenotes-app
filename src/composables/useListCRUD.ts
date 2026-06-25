import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useDrawerStore } from '@/stores/drawer'
import { useListsStore } from '@/stores/lists'
import { normalizeText } from '@/utils/validation'
import { executeOperation } from '@/utils/operations'
import ConfirmDrawer from '@/components/ConfirmDrawer.vue'
import BulkActionsDrawer from '@/components/BulkActionsDrawer.vue'
import type { BulkAction } from '@/types/bulkAction'
import { I18N } from '@/constants/i18n'
import { MESSAGES } from '@/constants/messages'
import type { List } from '@/types/database'

export function useListCRUD() {
  const authStore = useAuthStore()
  const uiStore = useUiStore()
  const drawerStore = useDrawerStore()
  const listsStore = useListsStore()

  const showCreateModal = ref(false)
  const newListName = ref('')
  const createError = ref('')
  const isCreating = ref(false)

  const showRenameModal = ref(false)
  const listToRename = ref<List | null>(null)
  const renameListName = ref('')
  const renameError = ref('')
  const isRenaming = ref(false)

  function handleChooseAction() {
    const actions: BulkAction[] = [
      { label: I18N.BULK_ACTIONS.DELETE_LISTS, variant: 'danger', keepDrawerOpen: true, onClick: handleBulkDelete },
    ]
    drawerStore.push(BulkActionsDrawer, { actions })
  }

  function handleBulkDelete() {
    const ids = [...uiStore.selectedIds]
    const count = ids.length
    drawerStore.push(ConfirmDrawer, {
      title: I18N.MODAL_CONTENT.BULK_DELETE_LISTS_TITLE(count),
      message: I18N.MODAL_CONTENT.BULK_DELETE_LISTS_MESSAGE(count),
      confirmLabel: I18N.BUTTONS.DELETE,
      cancelLabel: I18N.BUTTONS.CANCEL,
      confirmVariant: 'danger',
      confirmCallback: async () => {
        try {
          const projectId = authStore.activeProjectId
          if (!projectId) throw new Error('Project not found')
          await listsStore.bulkDeleteLists(ids, projectId)
          uiStore.showToast(I18N.TOAST.BULK_DELETED_LISTS(count), 'success')
          uiStore.exitSelectionMode()
          drawerStore.popAll()
        } catch (err) {
          uiStore.showErrorToast('delete lists', err as Error)
          drawerStore.popAll()
        }
      },
    })
  }

  async function handleCreateSubmit() {
    const name = normalizeText(newListName.value)
    if (!name) { createError.value = I18N.VALIDATION.LIST_NAME_REQUIRED; return }
    if (name.length > 50) { createError.value = I18N.VALIDATION.LIST_NAME_TOO_LONG; return }
    if (listsStore.lists.find(l => normalizeText(l.name) === name)) {
      createError.value = I18N.VALIDATION.LIST_ALREADY_EXISTS
      return
    }
    const personalProjectId = authStore.activeProjectId
    if (!personalProjectId) { createError.value = I18N.VALIDATION.PROJECT_NOT_FOUND; return }

    isCreating.value = true
    await executeOperation(
      () => listsStore.createList(personalProjectId, newListName.value),
      {
        loadingMessage: 'Creating list...',
        successMessage: MESSAGES.SUCCESS.LIST_CREATED,
        errorContext: 'create list',
        onSuccess: () => {
          showCreateModal.value = false
          newListName.value = ''
          createError.value = ''
        },
        onError: (error) => { createError.value = error || 'Failed to create list' },
      },
    )
    isCreating.value = false
  }

  function handleRename(list: List) {
    listToRename.value = list
    renameListName.value = list.name
    renameError.value = ''
    showRenameModal.value = true
  }

  async function handleRenameSubmit() {
    if (!listToRename.value) return
    const name = normalizeText(renameListName.value)
    if (!name) { renameError.value = I18N.VALIDATION.LIST_NAME_REQUIRED; return }
    if (name.length > 50) { renameError.value = I18N.VALIDATION.LIST_NAME_TOO_LONG; return }
    if (listsStore.lists.find(l => l.id !== listToRename.value?.id && normalizeText(l.name) === name)) {
      renameError.value = I18N.VALIDATION.LIST_ALREADY_EXISTS
      return
    }
    isRenaming.value = true
    const result = await listsStore.updateList(listToRename.value.id, { name: renameListName.value })
    isRenaming.value = false
    if (result.success) {
      uiStore.showToast(MESSAGES.SUCCESS.LIST_RENAMED, 'success')
      showRenameModal.value = false
      listToRename.value = null
      renameListName.value = ''
      renameError.value = ''
    } else {
      renameError.value = result.error || 'Failed to rename list'
    }
  }

  async function handleDelete(list: List) {
    const confirmed = await uiStore.showConfirm(
      I18N.MODALS.DELETE_LIST, MESSAGES.CONFIRM_DELETE_LIST(list.name),
      I18N.BUTTONS.DELETE, I18N.BUTTONS.CANCEL,
    )
    if (confirmed) {
      await executeOperation(
        () => listsStore.deleteList(list.id),
        { loadingMessage: 'Deleting list...', successMessage: MESSAGES.SUCCESS.LIST_DELETED, errorContext: 'delete list' },
      )
    }
  }

  return {
    showCreateModal, newListName, createError, isCreating, handleCreateSubmit,
    showRenameModal, listToRename, renameListName, renameError, isRenaming, handleRenameSubmit,
    handleChooseAction, handleRename, handleDelete,
  }
}
