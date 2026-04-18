/**
 * Composable for handling page loading with timeout protection
 * 
 * Provides a standardized way to load page data with:
 * - Automatic timeout protection (prevents infinite loading)
 * - Auth initialization handling
 * - Overlay management
 * - Error handling and user feedback
 * 
 * @module usePageLoad
 */

import { ref } from 'vue'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { withTimeout, TimeoutError } from '@/utils/timeout'
import { logger } from '@/utils/logger'

/**
 * Configuration options for page loading
 */
export interface PageLoadOptions {
  /** Timeout duration in milliseconds (default: 10000) */
  timeout?: number
  /** Custom error message to show on failure */
  errorMessage?: string
  /** Custom message to show on timeout */
  timeoutMessage?: string
  /** Don't automatically hide the overlay (default: false) */
  keepOverlay?: boolean
}

/**
 * Composable for page loading with timeout protection
 * 
 * @example
 * ```typescript
 * const { execute } = usePageLoad()
 * 
 * onMounted(() => {
 *   execute(async () => {
 *     const projectId = await authStore.getPersonalProjectId()
 *     if (projectId) {
 *       await songsStore.fetchSongs(projectId)
 *     }
 *   }, {
 *     errorMessage: 'Failed to load songs',
 *     timeout: 10000
 *   })
 * })
 * ```
 */
export function usePageLoad() {
  const isLoading = ref(false)
  const uiStore = useUiStore()
  const authStore = useAuthStore()

  /**
   * Execute a page loading function with timeout protection
   * 
   * @param loader - Async function to execute for loading page data
   * @param options - Configuration options
   */
  async function execute(
    loader: () => Promise<void>,
    options: PageLoadOptions = {}
  ): Promise<void> {
    const {
      timeout = 10000,
      errorMessage = 'Failed to load page',
      timeoutMessage = 'Loading is taking too long. Please refresh the page.',
      keepOverlay = false
    } = options

    isLoading.value = true
    
    // Flag to prevent race condition between setTimeout and operation completion
    let completed = false
    
    // Safety timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (!completed) {
        if (!keepOverlay) {
          uiStore.hideOperationOverlay()
        }
        uiStore.showToast(timeoutMessage, 'error')
        logger.warn('Page load timeout reached', { timeout })
      }
    }, timeout)

    try {
      // Ensure auth is initialized before loading
      if (!authStore.isInitialized) {
        await authStore.initialize()
      }

      // Execute the custom loader with timeout protection
      await withTimeout(loader, timeout)
      
      // Mark as completed and clear timeout
      completed = true
      clearTimeout(timeoutId)
      
    } catch (error) {
      // Mark as completed and clear timeout
      completed = true
      clearTimeout(timeoutId)
      
      if (error instanceof TimeoutError) {
        logger.error('Page load timeout error', error)
        uiStore.showToast(timeoutMessage, 'error')
      } else {
        logger.error('Page load error', error)
        uiStore.showToast(errorMessage, 'error')
      }
    } finally {
      isLoading.value = false
      if (!keepOverlay) {
        uiStore.hideOperationOverlay()
      }
    }
  }

  return {
    isLoading,
    execute
  }
}
