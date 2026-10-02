import { OfflineRequestError } from '@livenotes/shared/offline'
import { isOfflineMode, notifyDataWritten } from './offlineState'

const DATA_PATH = '/rest/v1/'
const READ_METHODS = new Set(['GET', 'HEAD'])

function requestInfo(input: RequestInfo | URL, init?: RequestInit): { url: string; method: string } {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  const method = init?.method ?? (input instanceof Request ? input.method : 'GET')
  return { url, method: method.toUpperCase() }
}

/**
 * fetch used by supabase-js.
 * - Offline: data requests (REST/RPC) fail immediately instead of hanging, so
 *   writes report "you are offline" and reads fall back to the snapshot.
 * - Online: a successful write marks the offline snapshot as dirty, which
 *   schedules a background re-sync.
 * Auth and storage requests pass through untouched.
 */
export function createOfflineAwareFetch(baseFetch: typeof fetch = (...args) => fetch(...args)): typeof fetch {
  return async (input, init) => {
    const { url, method } = requestInfo(input, init)
    const isDataRequest = url.includes(DATA_PATH)
    if (isDataRequest && isOfflineMode()) throw new OfflineRequestError()

    const response = await baseFetch(input, init)
    if (isDataRequest && !READ_METHODS.has(method) && response.ok) notifyDataWritten()
    return response
  }
}
