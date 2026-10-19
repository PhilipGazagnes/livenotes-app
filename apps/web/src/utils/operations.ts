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
import { logger } from '@/utils/logger'

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
 * Result of a store action or of executeOperation (docs/ERROR_HANDLING.md)
 * @template T - Type of the data returned on success
 */
export interface OperationResult<T = void> {
  /** Whether the operation succeeded */
  success: boolean
  /** Data returned by the operation (if successful) */
  data?: T
  /** Error message (if failed) */
  error?: string
  /** The error that caused the failure, for showErrorToast (e.g. EditNotAllowedError) */
  cause?: unknown
}

/** Message of an unknown error, or `fallback` when it has none. */
export function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback
}

/** The failed result a store action returns from its catch block. */
export function failure(err: unknown, fallback: string): OperationResult<never> {
  return { success: false, error: errorMessage(err, fallback), cause: err }
}

/** For try/catch code: the data of a successful result, or throw what made it fail. */
export function orThrow<T>(result: OperationResult<T>): T {
  if (!result.success) throw result.cause ?? new Error(result.error ?? 'An unexpected error occurred')
  return result.data as T
}

function isOperationResult(value: unknown): value is OperationResult<unknown> {
  return !!value && typeof value === 'object' && 'success' in value && typeof value.success === 'boolean'
}

/**
 * Executes an async operation with timeout, loading state, and error handling
 *
 * This is the standard pattern for user actions in the app.
 * It handles:
 * - Loading overlay display
 * - Timeout management
 * - Success/error toast notifications
 * - Consistent error messaging
 *
 * The operation fails when it throws or returns `{ success: false }` (a store action).
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

  let result: OperationResult<T>
  try {
    // Show loading overlay if enabled
    if (useOverlay) {
      uiStore.showOperationOverlay(loadingMessage)
    }

    // Execute operation with timeout
    const value = await withTimeout(operation, timeout, errorContext)

    // Store actions return { success, data }, other operations return data directly
    result = isOperationResult(value) ? (value as OperationResult<T>) : { success: true, data: value }
  } catch (error) {
    const message = error instanceof TimeoutError
      ? 'Operation timed out. Please try again.'
      : errorMessage(error, 'An unexpected error occurred')
    result = { success: false, error: message, cause: error }
  } finally {
    // ALWAYS hide overlay, even if there's an error during error handling
    if (useOverlay) {
      try {
        uiStore.hideOperationOverlay()
      } catch (e) {
        logger.error('Failed to hide overlay:', e)
      }
    }
  }

  if (result.success) {
    if (successMessage) uiStore.showToast(successMessage, 'success')
    onSuccess?.()
  } else {
    // A timeout keeps its own wording; other errors are worded by showErrorToast
    const cause = result.cause instanceof TimeoutError ? result.error : (result.cause ?? result.error)
    uiStore.showErrorToast(errorContext, cause ?? 'An unexpected error occurred')
    onError?.(result.error ?? 'An unexpected error occurred')
  }
  return result
}
