import { describe, it, expect, vi } from 'vitest'
import { withTimeout, TimeoutError, TIMEOUTS } from '../timeout'

describe('timeout', () => {
  describe('withTimeout', () => {
    it('should resolve when operation completes within timeout', async () => {
      const operation = () => Promise.resolve('success')
      const result = await withTimeout(operation, 1000)
      expect(result).toBe('success')
    })

    it('should reject with TimeoutError when operation exceeds timeout', async () => {
      const operation = () => new Promise(resolve => setTimeout(() => resolve('done'), 200))
      
      await expect(
        withTimeout(operation, 100)
      ).rejects.toThrow(TimeoutError)
    })

    it('should include operation name in timeout error', async () => {
      const operation = () => new Promise(resolve => setTimeout(() => resolve('done'), 200))
      
      try {
        await withTimeout(operation, 100, 'test operation')
      } catch (error) {
        expect(error).toBeInstanceOf(TimeoutError)
        expect((error as TimeoutError).operation).toBe('test operation')
      }
    })

    it('should reject with original error when operation fails', async () => {
      const operation = () => Promise.reject(new Error('operation failed'))
      
      await expect(
        withTimeout(operation, 1000)
      ).rejects.toThrow('operation failed')
    })

    it('should use default timeout of 15000ms', async () => {
      const operation = () => Promise.resolve('success')
      const result = await withTimeout(operation)
      expect(result).toBe('success')
    })

    it('should clear timeout when operation resolves', async () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')
      const operation = () => Promise.resolve('success')
      
      await withTimeout(operation, 1000)
      
      expect(clearTimeoutSpy).toHaveBeenCalled()
      clearTimeoutSpy.mockRestore()
    })

    it('should clear timeout when operation rejects', async () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')
      const operation = () => Promise.reject(new Error('fail'))
      
      try {
        await withTimeout(operation, 1000)
      } catch {
        // Expected to fail
      }
      
      expect(clearTimeoutSpy).toHaveBeenCalled()
      clearTimeoutSpy.mockRestore()
    })
  })

  describe('TimeoutError', () => {
    it('should create error with message', () => {
      const error = new TimeoutError('Timeout occurred')
      expect(error.message).toBe('Timeout occurred')
      expect(error.name).toBe('TimeoutError')
    })

    it('should store operation name', () => {
      const error = new TimeoutError('Timeout occurred', 'my operation')
      expect(error.operation).toBe('my operation')
    })
  })

  describe('TIMEOUTS', () => {
    it('should have NORMAL timeout defined', () => {
      expect(TIMEOUTS.NORMAL).toBe(15000)
    })
  })
})
