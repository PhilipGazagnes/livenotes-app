import { ref } from 'vue'

/**
 * Connectivity state shared by the Supabase fetch wrapper and the offline
 * data layer. Kept dependency-free so `lib/supabase.ts` can import it
 * without an import cycle.
 */

const SETTINGS_STORAGE_KEY = 'livenotes-settings'

function readPersistedForceOffline(): boolean {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
    return stored ? Boolean(JSON.parse(stored).forceOfflineMode) : false
  } catch {
    return false
  }
}

/**
 * "Force offline" setting: no data requests at all, reads come from the
 * snapshot. For networks without internet (e.g. a mixing console hotspot).
 * Initialised from localStorage so it applies before the settings store loads.
 */
export const forceOffline = ref(readPersistedForceOffline())

export function setForceOffline(value: boolean): void {
  forceOffline.value = value
}

export function isOfflineMode(): boolean {
  return forceOffline.value || (typeof navigator !== 'undefined' && navigator.onLine === false)
}

type WriteListener = () => void
let writeListener: WriteListener | null = null

export function onDataWritten(listener: WriteListener): void {
  writeListener = listener
}

export function notifyDataWritten(): void {
  writeListener?.()
}
