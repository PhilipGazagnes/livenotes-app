import { ref } from 'vue'
import { executeOperation } from '@/utils/operations'

/**
 * Base interface for CRUD items
 * All items must have an id and name property
 */
export interface CRUDItem {
  id: string
  name: string
}

/**
 * Configuration options for the CRUD composable
 * @template T - Type of the CRUD item extending CRUDItem
 */
export interface CRUDOptions<T extends CRUDItem> {
  /** Array of items to manage */
  items: T[]
  /** Maximum length for the name field */
  maxLength?: number
  /** Custom validation function to check for duplicates */
  validateDuplicate?: (name: string, excludeId?: string) => boolean
  /** Async function to create a new item */
  onCreate: (name: string) => Promise<{ success: boolean; error?: string; data?: T }>
  /** Async function to update an existing item */
  onUpdate: (id: string, name: string) => Promise<{ success: boolean; error?: string }>
  /** Async function to delete an item */
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>
  /** Customizable success/error messages */
  messages: {
    created: string
    updated: string
    deleted: string
    nameRequired: string
    nameTooLong: string
    alreadyExists: string
  }
  /** Function to confirm deletion (shows confirmation dialog) */
  confirmDelete: (item: T) => Promise<boolean>
}

/**
 * Reusable composable for CRUD operations
 * 
 * Provides standardized state management and handlers for Create, Read, Update, Delete operations.
 * Includes validation, error handling, and integration with executeOperation pattern.
 * 
 * @template T - Type of the CRUD item extending CRUDItem
 * @param options - Configuration options for CRUD behavior
 * @returns Object containing reactive state and handler functions
 * 
 * @example
 * ```typescript
 * const { showCreateModal, handleCreate, handleDelete } = useCRUD<Tag>({
 *   items: tagsStore.tags,
 *   maxLength: 50,
 *   onCreate: async (name) => await tagsStore.createTag(projectId, name),
 *   onUpdate: async (id, name) => await tagsStore.updateTag(id, name),
 *   onDelete: async (id) => await tagsStore.deleteTag(id),
 *   messages: { created: 'Tag created', ... },
 *   confirmDelete: async (tag) => await uiStore.showConfirm(...)
 * })
 * ```
 */

export function useCRUD<T extends CRUDItem>(options: CRUDOptions<T>) {
  const showCreateModal = ref(false)
  const showRenameModal = ref(false)
  const newItemName = ref('')
  const createError = ref('')
  const isCreating = ref(false)
  
  const editingItem = ref<T | null>(null)
  const editItemName = ref('')
  const renameError = ref('')
  const isRenaming = ref(false)

  // Validation helper
  function validateName(name: string, excludeId?: string): string {
    const trimmed = name.trim()
    
    if (!trimmed) {
      return options.messages.nameRequired
    }
    
    if (trimmed.length > (options.maxLength || 50)) {
      return options.messages.nameTooLong
    }
    
    // Check for duplicates if validator provided
    if (options.validateDuplicate && options.validateDuplicate(trimmed, excludeId)) {
      return options.messages.alreadyExists
    }
    
    return ''
  }

  async function handleCreate() {
    createError.value = ''
    
    const error = validateName(newItemName.value)
    if (error) {
      createError.value = error
      return
    }
    
    isCreating.value = true
    
    await executeOperation(
      () => options.onCreate(newItemName.value.trim()),
      {
        loadingMessage: 'Creating...',
        successMessage: options.messages.created,
        errorContext: 'create item',
        onSuccess: () => {
          showCreateModal.value = false
          newItemName.value = ''
        },
        onError: (error) => {
          createError.value = error || 'Failed to create'
        },
      }
    )
    
    isCreating.value = false
  }

  function openRenameModal(item: T) {
    editingItem.value = item
    editItemName.value = item.name
    renameError.value = ''
    showRenameModal.value = true
  }

  async function handleRenameSubmit() {
    if (!editingItem.value) return
    
    renameError.value = ''
    
    const error = validateName(editItemName.value, editingItem.value.id)
    if (error) {
      renameError.value = error
      return
    }
    
    isRenaming.value = true
    
    await executeOperation(
      () => options.onUpdate(editingItem.value!.id, editItemName.value.trim()),
      {
        loadingMessage: 'Renaming...',
        successMessage: options.messages.updated,
        errorContext: 'rename item',
        onSuccess: () => {
          showRenameModal.value = false
          editingItem.value = null
        },
        onError: (error) => {
          renameError.value = error || 'Failed to rename'
        },
      }
    )
    
    isRenaming.value = false
  }

  async function handleDelete(item: T) {
    const confirmed = await options.confirmDelete(item)
    
    if (confirmed) {
      await executeOperation(
        () => options.onDelete(item.id),
        {
          loadingMessage: 'Deleting...',
          successMessage: options.messages.deleted,
          errorContext: 'delete item',
        }
      )
    }
  }

  return {
    // Create state
    showCreateModal,
    newItemName,
    createError,
    isCreating,
    handleCreate,
    
    // Rename state
    showRenameModal,
    editingItem,
    editItemName,
    renameError,
    isRenaming,
    openRenameModal,
    handleRenameSubmit,
    
    // Delete
    handleDelete,
  }
}
