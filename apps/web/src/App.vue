<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import * as authService from '@/services/authService'
import HamburgerMenu from '@/components/HamburgerMenu.vue'
import ToastNotification from '@/components/ToastNotification.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import OperationOverlay from '@/components/OperationOverlay.vue'
import DrawerManager from '@/components/DrawerManager.vue'
import AppUpdateBanner from '@/components/AppUpdateBanner.vue'
import SyncAvailableBanner from '@/components/SyncAvailableBanner.vue'
import KeepEditingDialog from '@/components/KeepEditingDialog.vue'
import { useEditModeStore } from '@/stores/editMode'
import { useLibraryStore } from '@/stores/library'
import { useListsStore } from '@/stores/lists'
import { useTagsStore } from '@/stores/tags'
import { useNotesStore } from '@/stores/notes'
import { useSettingsStore } from '@/stores/settings'
import { useDrawerStore } from '@/stores/drawer'
import { localCopyEpoch } from '@/lib/offline/offlineData'
import { useAuthStore } from '@/stores/auth'
import { logger } from '@/utils/logger'

// Registers the write guard and the editing-flag countdown for the whole app
useEditModeStore()

// What the user sees is exactly the local copy: when it is replaced as a whole
// (Sync, "Delete local data"), drop every in-memory copy and re-read the page.
const viewKey = ref(0)
const libraryStore = useLibraryStore()
const listsStore = useListsStore()
const tagsStore = useTagsStore()
const notesStore = useNotesStore()
const settingsStore = useSettingsStore()
const drawerStore = useDrawerStore()
const authStore = useAuthStore()

watch(localCopyEpoch, () => {
  libraryStore.$patch({ librarySongs: [], currentLibrarySong: null })
  listsStore.$patch({ lists: [], currentList: null })
  tagsStore.$patch({ tags: [] })
  notesStore.clearNotes()
  settingsStore.$patch({
    projectName: '', projectDescription: null, projectSlug: null,
    thumbnailUrl: null, contactEnabled: false, contactInfo: null,
  })
  drawerStore.popAll()
  viewKey.value++
  authStore.reloadActiveProject().catch(err => logger.warn('Could not reload the active project', err))
})

// Supabase's internal auto-refresh timer can get stuck when the browser tab
// is backgrounded mid-refresh, causing all subsequent API calls to queue
// indefinitely. Explicitly stopping and restarting it on visibility change
// resets that state.
function handleVisibilityChange() {
  if (document.visibilityState === 'visible') {
    authService.startAutoRefresh()
  } else {
    authService.stopAutoRefresh()
  }
}

onMounted(() => {
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<template>
  <div class="fixed inset-0 overflow-hidden bg-gray-900">
    <router-view :key="viewKey" />

    <!-- Global Components -->
    <HamburgerMenu />
    <ToastNotification />
    <ConfirmDialog />
    <OperationOverlay />
    <DrawerManager />
    <AppUpdateBanner />
    <SyncAvailableBanner />
    <KeepEditingDialog />
  </div>
</template>

