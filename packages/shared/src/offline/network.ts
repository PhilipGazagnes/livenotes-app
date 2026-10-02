/**
 * Thrown when a read is needed while offline and no snapshot exists yet.
 */
export class OfflineDataUnavailableError extends Error {
  constructor(message = 'This data is not available offline yet. Sync this project while online first.') {
    super(message)
    this.name = 'OfflineDataUnavailableError'
  }
}

/** Thrown when a network request (typically a write) is attempted while offline. */
export class OfflineRequestError extends Error {
  constructor(message = 'You are offline. This action requires an internet connection.') {
    super(message)
    this.name = 'OfflineRequestError'
  }
}

export class NetworkTimeoutError extends Error {
  constructor(ms: number) {
    super(`Network request timed out after ${ms} ms`)
    this.name = 'NetworkTimeoutError'
  }
}

// Messages of fetch failures across browsers / runtimes:
// Chrome "Failed to fetch", Firefox "NetworkError when attempting to fetch resource.",
// Safari "Load failed", Node/undici "fetch failed", React Native "Network request failed".
// supabase-js wraps fetch rejections as `{ message: "<name>: <message>" }`, hence the error names.
const NETWORK_ERROR_PATTERN = /failed to fetch|networkerror|load failed|fetch failed|network request failed|network error|offlinerequesterror|networktimeouterror/i

/**
 * True when `err` means "the server could not be reached" (as opposed to the
 * server answering with an error, e.g. RLS or validation, which must surface).
 * Handles thrown errors and Supabase `{ message }` error objects.
 */
export function isNetworkError(err: unknown): boolean {
  if (err instanceof NetworkTimeoutError || err instanceof OfflineRequestError) return true
  if (err instanceof Error && err.name === 'AbortError') return true
  const message =
    err instanceof Error
      ? err.message
      : typeof err === 'object' && err !== null && 'message' in err
        ? String((err as { message: unknown }).message)
        : ''
  return NETWORK_ERROR_PATTERN.test(message)
}

/** Reject with NetworkTimeoutError if `promise` takes longer than `ms`. */
export function withNetworkTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new NetworkTimeoutError(ms)), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}
