/**
 * Timeout handling for async operations
 */

export class TimeoutError extends Error {
  constructor(message: string, public readonly operation?: string) {
    super(message)
    this.name = 'TimeoutError'
  }
}

/**
 * Wraps an async operation with a timeout
 * @param operation The async function to execute
 * @param timeoutMs Timeout in milliseconds (default: 15000)
 * @param operationName Optional name for better error messages
 * @returns Promise that rejects with TimeoutError if timeout is exceeded
 */
export async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number = 15000,
  operationName?: string
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new TimeoutError(
          `Operation timed out after ${timeoutMs / 1000} seconds`,
          operationName
        )
      )
    }, timeoutMs)

    operation()
      .then((result) => {
        clearTimeout(timer)
        resolve(result)
      })
      .catch((error) => {
        clearTimeout(timer)
        reject(error)
      })
  })
}

/**
 * Timeout durations for different operation types
 */
export const TIMEOUTS = {
  NORMAL: 15000, // 15s for regular operations
  BULK: 30000,   // 30s for bulk operations
  QUICK: 5000,   // 5s for quick operations like fetching
} as const
