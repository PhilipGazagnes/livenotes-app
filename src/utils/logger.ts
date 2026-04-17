/**
 * Centralized logging utility that respects environment modes
 * 
 * This module provides a consistent logging interface across the application.
 * Debug and info messages only appear in development mode, while warnings
 * and errors are always logged.
 * 
 * @module logger
 */

const isDev = import.meta.env.DEV

/**
 * Application logger with environment-aware methods
 * 
 * @example
 * ```typescript
 * import { logger } from '@/utils/logger'
 * 
 * // Only logs in development
 * logger.debug('User clicked button', { buttonId: 'save' })
 * logger.info('Song loaded', song)
 * 
 * // Always logs
 * logger.warn('API rate limit approaching', remainingCalls)
 * logger.error('Failed to save song', error)
 * 
 * // Performance tracking (dev only)
 * const start = performance.now()
 * await heavyOperation()
 * logger.performance('Heavy operation', performance.now() - start)
 * ```
 */
export const logger = {
  /**
   * Log debug information (development only)
   * @param message - Debug message
   * @param args - Additional data to log
   */
  debug: (message: string, ...args: any[]) => {
    if (isDev) {
      console.log(`[DEBUG] ${message}`, ...args)
    }
  },
  
  /**
   * Log informational messages (development only)
   * @param message - Info message
   * @param args - Additional data to log
   */
  info: (message: string, ...args: any[]) => {
    if (isDev) {
      console.info(`[INFO] ${message}`, ...args)
    }
  },
  
  /**
   * Log warnings (always logged)
   * @param message - Warning message
   * @param args - Additional context
   */
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${message}`, ...args)
  },
  
  /**
   * Log errors (always logged)
   * @param message - Error message
   * @param error - Error object or additional context
   */
  error: (message: string, error?: Error | any) => {
    console.error(`[ERROR] ${message}`, error)
  },
  
  /**
   * Log performance metrics (development only)
   * @param label - Operation label
   * @param duration - Duration in milliseconds
   */
  performance: (label: string, duration: number) => {
    if (isDev) {
      console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`)
    }
  }
}
