import { computed } from 'vue'
import { useOnline } from '@vueuse/core'
import { useSettingsStore } from '@/stores/settings'

export function useOnlineStatus() {
  const rawOnline = useOnline()
  const settingsStore = useSettingsStore()
  const isOnline = computed(() => rawOnline.value && !settingsStore.forceOfflineMode)
  return { isOnline }
}
