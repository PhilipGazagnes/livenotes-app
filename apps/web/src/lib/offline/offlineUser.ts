import type { User } from '@supabase/supabase-js'

/**
 * Last signed-in user, kept so the app can start offline.
 *
 * Offline, supabase-js cannot refresh an expired access token and reports
 * "no session" (the stored session is kept and refreshed once back online).
 * The data comes from the offline snapshot, so the app only needs to know who
 * the user is. Cleared on sign-out.
 */
const OFFLINE_USER_KEY = 'livenotes-offline-user'

export function rememberOfflineUser(user: User): void {
  try {
    localStorage.setItem(OFFLINE_USER_KEY, JSON.stringify(user))
  } catch {
    // storage unavailable: offline startup just won't be possible
  }
}

export function readOfflineUser(): User | null {
  try {
    const stored = localStorage.getItem(OFFLINE_USER_KEY)
    return stored ? (JSON.parse(stored) as User) : null
  } catch {
    return null
  }
}

export function forgetOfflineUser(): void {
  try {
    localStorage.removeItem(OFFLINE_USER_KEY)
  } catch {
    // nothing to remove
  }
}
