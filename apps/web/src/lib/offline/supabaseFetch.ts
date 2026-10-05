import { OfflineRequestError } from '@livenotes/shared/offline'
import { isOfflineMode } from './offlineState'

const DATA_PATH = '/rest/v1/'

function requestUrl(input: RequestInfo | URL): string {
  return typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
}

/**
 * fetch used by supabase-js. Offline, data requests (REST/RPC) fail
 * immediately instead of hanging, so writes report "you are offline".
 * Auth and storage requests pass through untouched.
 */
export function createOfflineAwareFetch(baseFetch: typeof fetch = (...args) => fetch(...args)): typeof fetch {
  return async (input, init) => {
    if (requestUrl(input).includes(DATA_PATH) && isOfflineMode()) throw new OfflineRequestError()
    return baseFetch(input, init)
  }
}
