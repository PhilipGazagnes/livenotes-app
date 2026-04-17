import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { logger } from '../logger'

describe('logger', () => {
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>
    info: ReturnType<typeof vi.spyOn>
    warn: ReturnType<typeof vi.spyOn>
    error: ReturnType<typeof vi.spyOn>
  }

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    }
  })

  afterEach(() => {
    consoleSpy.log.mockRestore()
    consoleSpy.info.mockRestore()
    consoleSpy.warn.mockRestore()
    consoleSpy.error.mockRestore()
  })

  describe('debug', () => {
    it('should format message with DEBUG prefix', () => {
      logger.debug('test message', { data: 'value' })
      
      if (import.meta.env.DEV) {
        expect(consoleSpy.log).toHaveBeenCalledWith('[DEBUG] test message', { data: 'value' })
      }
    })

    it('should support multiple arguments', () => {
      logger.debug('test', 'arg1', 'arg2')
      
      if (import.meta.env.DEV) {
        expect(consoleSpy.log).toHaveBeenCalledWith('[DEBUG] test', 'arg1', 'arg2')
      }
    })
  })

  describe('info', () => {
    it('should format message with INFO prefix', () => {
      logger.info('info message', { data: 'value' })
      
      if (import.meta.env.DEV) {
        expect(consoleSpy.info).toHaveBeenCalledWith('[INFO] info message', { data: 'value' })
      }
    })
  })

  describe('warn', () => {
    it('should always log warnings with WARN prefix', () => {
      logger.warn('warning message', { data: 'value' })
      
      expect(consoleSpy.warn).toHaveBeenCalledWith('[WARN] warning message', { data: 'value' })
    })

    it('should log in both dev and prod', () => {
      logger.warn('test warning')
      
      expect(consoleSpy.warn).toHaveBeenCalled()
    })
  })

  describe('error', () => {
    it('should always log errors with ERROR prefix', () => {
      const error = new Error('test error')
      logger.error('error message', error)
      
      expect(consoleSpy.error).toHaveBeenCalledWith('[ERROR] error message', error)
    })

    it('should log in both dev and prod', () => {
      logger.error('test error')
      
      expect(consoleSpy.error).toHaveBeenCalled()
    })

    it('should handle error without error object', () => {
      logger.error('error message')
      
      expect(consoleSpy.error).toHaveBeenCalledWith('[ERROR] error message', undefined)
    })
  })

  describe('performance', () => {
    it('should format performance logs', () => {
      logger.performance('Operation completed', 124.56)
      
      if (import.meta.env.DEV) {
        expect(consoleSpy.log).toHaveBeenCalledWith('[Performance] Operation completed: 124.56ms')
      }
    })

    it('should format duration to 2 decimal places', () => {
      logger.performance('Test', 123.456789)
      
      if (import.meta.env.DEV) {
        expect(consoleSpy.log).toHaveBeenCalledWith('[Performance] Test: 123.46ms')
      }
    })
  })
})
