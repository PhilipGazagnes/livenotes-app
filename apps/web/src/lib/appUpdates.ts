import { computed, ref } from 'vue'
import { registerSW } from 'virtual:pwa-register'
import { logger } from '@/utils/logger'

/**
 * PWA update flow (#13). Installed PWAs have no browser reload button, so:
 * - check for a new version at startup and whenever the app comes back to
 *   the foreground;
 * - never reload by itself (a reload during a gig would lose the lyrics on
 *   screen): it sets `updateAvailable` and the user reloads from the banner.
 */
export const updateAvailable = ref(false)

const BANNER_DISMISSED_KEY = 'livenotes-update-banner-dismissed-until'
const DAY_MS = 24 * 60 * 60 * 1000

function readDismissedUntil(): number {
  try {
    return Number(localStorage.getItem(BANNER_DISMISSED_KEY)) || 0
  } catch {
    return 0
  }
}

const dismissedUntil = ref(readDismissedUntil())
// Re-evaluated when the app comes back to the foreground, so the banner returns the next day
const now = ref(Date.now())

/** The update banner shows unless closed less than a day ago (ADR-015). */
export const showUpdateBanner = computed(() => updateAvailable.value && now.value >= dismissedUntil.value)

export function dismissUpdateBanner(): void {
  dismissedUntil.value = Date.now() + DAY_MS
  try {
    localStorage.setItem(BANNER_DISMISSED_KEY, String(dismissedUntil.value))
  } catch {
    // storage unavailable: hidden for this session only
  }
}

let applyUpdate: ((reloadPage?: boolean) => Promise<void>) | null = null

export function registerAppUpdates(): void {
  applyUpdate = registerSW({
    immediate: true,
    onNeedRefresh() {
      updateAvailable.value = true
    },
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return
      const checkForUpdate = () => {
        if (!navigator.onLine) return
        registration.update().catch(err => logger.warn('Service worker update check failed', err))
      }
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState !== 'visible') return
        now.value = Date.now()
        checkForUpdate()
      })
    },
    onRegisterError(err) {
      logger.error('Service worker registration failed', err)
    },
  })
}

/** Activate the waiting version (if any) and reload the page. */
export async function reloadApp(): Promise<void> {
  if (updateAvailable.value && applyUpdate) {
    await applyUpdate(true)
    return
  }
  window.location.reload()
}
