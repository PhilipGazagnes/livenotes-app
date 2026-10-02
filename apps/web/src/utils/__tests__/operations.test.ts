import { describe, it, expect, vi, beforeEach } from 'vitest'
import { executeOperation, executeConfirmedOperation } from '../operations'
import type { OperationOptions } from '../operations'

// Mock the UI store
const mockUiStore = {
  showOperationOverlay: vi.fn(),
  hideOperationOverlay: vi.fn(),
  showToast: vi.fn(),
  showErrorToast: vi.fn(),
  setConfirmDialogLoading: vi.fn(),
  closeConfirm: vi.fn(),
}

vi.mock('@/stores/ui', () => ({
  useUiStore: () => mockUiStore
}))

describe('operations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('executeOperation', () => {
    it('should execute successful operation', async () => {
      const operation = vi.fn().mockResolvedValue('result data')
      const options: OperationOptions = {
        errorContext: 'test operation',
        loadingMessage: 'Loading...',
        successMessage: 'Success!',
      }

      const result = await executeOperation(operation, options)

      expect(result.success).toBe(true)
      expect(result.data).toBe('result data')
      expect(mockUiStore.showOperationOverlay).toHaveBeenCalledWith('Loading...')
      expect(mockUiStore.hideOperationOverlay).toHaveBeenCalled()
      expect(mockUiStore.showToast).toHaveBeenCalledWith('Success!', 'success')
    })

    it('should not show success toast when successMessage is omitted', async () => {
      const operation = vi.fn().mockResolvedValue('result')
      const options: OperationOptions = {
        errorContext: 'test',
        loadingMessage: 'Loading...',
      }

      await executeOperation(operation, options)

      expect(mockUiStore.showToast).not.toHaveBeenCalled()
    })

    it('should handle operation failure', async () => {
      const error = new Error('Operation failed')
      const operation = vi.fn().mockRejectedValue(error)
      const options: OperationOptions = {
        errorContext: 'test operation',
        loadingMessage: 'Loading...',
      }

      const result = await executeOperation(operation, options)

      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
      expect(mockUiStore.showOperationOverlay).toHaveBeenCalled()
      expect(mockUiStore.hideOperationOverlay).toHaveBeenCalled()
      expect(mockUiStore.showErrorToast).toHaveBeenCalledWith(
        'test operation',
        expect.any(String)
      )
    })

    it('should call onSuccess callback', async () => {
      const operation = vi.fn().mockResolvedValue('result')
      const onSuccess = vi.fn()
      const options: OperationOptions = {
        errorContext: 'test',
        loadingMessage: 'Loading...',
        onSuccess,
      }

      await executeOperation(operation, options)

      expect(onSuccess).toHaveBeenCalled()
    })

    it('should call onError callback', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('fail'))
      const onError = vi.fn()
      const options: OperationOptions = {
        errorContext: 'test',
        loadingMessage: 'Loading...',
        onError,
      }

      await executeOperation(operation, options)

      expect(onError).toHaveBeenCalledWith(expect.any(String))
    })

    it('should skip overlay when useOverlay is false', async () => {
      const operation = vi.fn().mockResolvedValue('result')
      const options: OperationOptions = {
        errorContext: 'test',
        useOverlay: false,
      }

      await executeOperation(operation, options)

      expect(mockUiStore.showOperationOverlay).not.toHaveBeenCalled()
      expect(mockUiStore.hideOperationOverlay).not.toHaveBeenCalled()
    })

    it('should use default timeout', async () => {
      const operation = vi.fn().mockResolvedValue('result')
      const options: OperationOptions = {
        errorContext: 'test',
        loadingMessage: 'Loading...',
      }

      const result = await executeOperation(operation, options)

      expect(result.success).toBe(true)
    })

    it('should respect custom timeout', async () => {
      const operation = vi.fn().mockResolvedValue('result')
      const options: OperationOptions = {
        errorContext: 'test',
        loadingMessage: 'Loading...',
        timeout: 5000,
      }

      const result = await executeOperation(operation, options)

      expect(result.success).toBe(true)
    })

    it('should handle timeout error', async () => {
      const operation = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('done'), 1000))
      )
      const options: OperationOptions = {
        errorContext: 'slow operation',
        loadingMessage: 'Loading...',
        timeout: 10, // Very short timeout
      }

      const result = await executeOperation(operation, options)

      expect(result.success).toBe(false)
      expect(result.error).toContain('timed out')
    })
  })

  describe('executeConfirmedOperation', () => {
    it('should execute operation and close dialog', async () => {
      const operation = vi.fn().mockResolvedValue('result')
      const options: Omit<OperationOptions, 'useOverlay'> = {
        errorContext: 'delete',
        loadingMessage: 'Deleting...',
        successMessage: 'Deleted!',
      }

      const result = await executeConfirmedOperation(
        operation,
        options
      )

      expect(result.success).toBe(true)
      expect(operation).toHaveBeenCalled()
      expect(mockUiStore.setConfirmDialogLoading).toHaveBeenCalledWith(true)
      expect(mockUiStore.closeConfirm).toHaveBeenCalled()
      expect(mockUiStore.showToast).toHaveBeenCalledWith('Deleted!', 'success')
    })

    it('should handle operation failure in confirmed dialog', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('failed'))
      const options: Omit<OperationOptions, 'useOverlay'> = {
        errorContext: 'delete',
        loadingMessage: 'Deleting...',
      }

      const result = await executeConfirmedOperation(
        operation,
        options
      )

      expect(result.success).toBe(false)
      expect(mockUiStore.setConfirmDialogLoading).toHaveBeenCalled()
      expect(mockUiStore.showErrorToast).toHaveBeenCalled()
    })
  })
})
