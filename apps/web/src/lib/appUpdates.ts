import { ref } from 'vue'
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
        if (document.visibilityState === 'visible') checkForUpdate()
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
