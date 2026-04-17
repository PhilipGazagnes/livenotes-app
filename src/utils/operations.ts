/**
 * Universal operation handler for consistent error handling and user feedback
 * 
 * This module provides standardized wrappers for async operations throughout the app,
 * ensuring consistent UX with loading overlays, success toasts, and error handling.
 * 
 * @module operations
 */

import { useUiStore } from '@/stores/ui'
import { withTimeout, TimeoutError, TIMEOUTS } from './timeout'

/**
 * Configuration options for executeOperation
 */
export interface OperationOptions {
  /** Timeout in milliseconds (default: 15000) */
  timeout?: number
  /** Message to show in the loading overlay */
  loadingMessage?: string
  /** Message to show on success (optional, won't show toast if omitted) */
  successMessage?: string
  /** Context for error messages (e.g., "save song", "assign tags") */
  errorContext: string
  /** Callback to execute on success */
  onSuccess?: () => void
  /** Callback to execute on error */
  onError?: (error: string) => void
  /** Whether to use global overlay (default: true) */
  useOverlay?: boolean
}

/**
 * Result object returned by executeOperation
 * @template T - Type of the data returned on success
 */
export interface OperationResult<T = void> {
  /** Whether the operation succeeded */
  success: boolean
  /** Data returned by the operation (if successful) */
  data?: T
  /** Error message (if failed) */
  error?: string
}

/**
 * Executes an async operation with timeout, loading state, and error handling
 * 
 * This is the standard pattern for all async operations in the app.
 * It handles:
 * - Loading overlay display
 * - Timeout management
 * - Success/error toast notifications
 * - Consistent error messaging
 * 
 * @template T - Type of data returned by the operation
 * @param operation - Async function to execute
 * @param options - Configuration options
 * @returns Promise resolving to OperationResult
 * 
 * @example
 * ```typescript
 * await executeOperation(
 *   () => songsStore.updateSong(id, data),
 *   {
 *     loadingMessage: 'Saving song...',
 *     successMessage: 'Song saved successfully',
 *     errorContext: 'save song',
 *     timeout: 10000,
 *     onSuccess: () => router.push('/songs')
 *   }
 * )
 * ```
 */
export async function executeOperation<T = void>(
  operation: () => Promise<any>,
  options: OperationOptions
): Promise<OperationResult<T>> {
  const uiStore = useUiStore()
  const {
    timeout = TIMEOUTS.NORMAL,
    loadingMessage = 'Processing...',
    successMessage,
    errorContext,
    onSuccess,
    onError,
    useOverlay = true,
  } = options

  try {
    // Show loading overlay if enabled
    if (useOverlay) {
      uiStore.showOperationOverlay(loadingMessage)
    }

    // Execute operation with timeout
    const result = await withTimeout(operation, timeout, errorContext)

    // Show success message if provided
    if (successMessage) {
      uiStore.showToast(successMessage, 'success')
    }

    // Call success callback
    if (onSuccess) {
      onSuccess()
    }

    // Handle result format (some operations return { success, data }, others return data directly)
    if (result && typeof result === 'object' && 'success' in result) {
      return result
    }

    return { success: true, data: result }
  } catch (error) {
    // Format error message
    let errorMessage: string
    
    if (error instanceof TimeoutError) {
      errorMessage = 'Operation timed out. Please try again.'
    } else if (error instanceof Error) {
      errorMessage = error.message
    } else {
      errorMessage = 'An unexpected error occurred'
    }

    // Show error toast with context
    uiStore.showErrorToast(errorContext, errorMessage)

    // Call error callback
    if (onError) {
      onError(errorMessage)
    }

    return { success: false, error: errorMessage }
  } finally {
    // ALWAYS hide overlay, even if there's an error during error handling
    if (useOverlay) {
      try {
        uiStore.hideOperationOverlay()
      } catch (e) {
        console.error('Failed to hide overlay:', e)
      }
    }
  }
}

/**
 * Executes an operation within a confirm dialog
 * Shows spinner in the dialog and overlay during operation
 */
export async function executeConfirmedOperation<T = void>(
  operation: () => Promise<any>,
  options: Omit<OperationOptions, 'useOverlay'>
): Promise<OperationResult<T>> {
  const uiStore = useUiStore()
  
  try {
    // Show loading state in confirm dialog
    uiStore.setConfirmDialogLoading(true)

    // Show overlay with loading message
    const loadingMessage = options.loadingMessage || 'Processing...'
    uiStore.showOperationOverlay(loadingMessage)

    // Execute operation with timeout
    const result = await withTimeout(operation, options.timeout ?? TIMEOUTS.NORMAL, options.errorContext)

    // Close dialog on success
    uiStore.closeConfirm()

    // Show success message if provided
    if (options.successMessage) {
      uiStore.showToast(options.successMessage, 'success')
    }

    // Call success callback
    if (options.onSuccess) {
      options.onSuccess()
    }

    // Handle result format
    if (result && typeof result === 'object' && 'success' in result) {
      return result
    }

    return { success: true, data: result }
  } catch (error) {
    // Format error message
    let errorMessage: string
    
    if (error instanceof TimeoutError) {
      errorMessage = 'Operation timed out. Please try again.'
    } else if (error instanceof Error) {
      errorMessage = error.message
    } else {
      errorMessage = 'An unexpected error occurred'
    }

    // Show error toast with context
    uiStore.showErrorToast(options.errorContext, errorMessage)

    // Call error callback
    if (options.onError) {
      options.onError(errorMessage)
    }

    return { success: false, error: errorMessage }
  } finally {
    // ALWAYS hide loading state and overlay, even if there's an error
    try {
      uiStore.setConfirmDialogLoading(false)
      uiStore.hideOperationOverlay()
    } catch (e) {
      console.error('Failed to reset dialog loading state:', e)
    }
  }
}
