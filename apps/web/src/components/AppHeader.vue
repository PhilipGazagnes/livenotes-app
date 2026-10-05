<template>
  <header class="sticky top-0 z-50 bg-gray-900 border-b border-gray-800">
    <div class="flex items-center justify-between px-4 py-3">
      <!-- Left: Hamburger Menu Icon + offline indicator -->
      <div class="relative -ml-2">
        <button
          @click="openMenu"
          data-testid="hamburger-menu-btn"
          class="p-2 text-gray-300 hover:text-white transition-colors"
          :aria-label="I18N.ARIA.MENU"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
        <span v-if="!isOnline" class="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] text-orange-400 leading-none pointer-events-none">offline</span>
      </div>

      <!-- Center: Title -->
      <div class="flex flex-col items-center leading-tight truncate px-2">
        <span v-if="authStore.activeProject" class="text-[10px] font-medium text-indigo-400 uppercase tracking-wider truncate">
          {{ authStore.activeProject.name }}
        </span>
        <span class="text-base font-bold text-white truncate">{{ props.title }}</span>
      </div>

      <!-- Right: Action slot + Project avatar -->
      <div class="flex items-center gap-1 -mr-1">
        <slot name="action" />
        <button
          @click="openProjectMenu"
          class="relative p-1 rounded-full transition-all"
          :class="editMode.isEditing ? 'ring-2 ring-amber-400' : 'hover:ring-2 hover:ring-gray-600'"
          aria-label="Project menu"
          :title="editIndicatorTitle"
          data-testid="project-menu-btn"
        >
          <ProjectAvatarIcon
            :name="avatarName"
            :thumbnail-url="authStore.activeProject?.thumbnail_url ?? null"
            :size="32"
          />
          <!-- Editing indicator (ADR-011): amber when you hold the flag, grey when another member does -->
          <span
            v-if="editMode.isEditing || editMode.otherEditor"
            data-testid="editing-indicator"
            class="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-gray-900"
            :class="editMode.isEditing ? 'bg-amber-400 text-gray-900' : 'bg-gray-500 text-white'"
          >
            <svg class="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15.232 5.232l3.536 3.536M9 13l6.232-6.232a2.5 2.5 0 113.536 3.536L12.536 16.5H9V13z"/>
            </svg>
          </span>
        </button>
      </div>
    </div>
    <p
      v-if="!isOnline && !hasSnapshot"
      data-testid="offline-no-snapshot"
      class="px-4 py-2 text-xs text-orange-300 bg-orange-500/10 border-t border-orange-500/20"
    >
      {{ I18N.OFFLINE.NO_SNAPSHOT }}
    </p>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { useDrawerStore } from '@/stores/drawer'
import { I18N } from '@/constants/i18n'
import { useOnlineStatus } from '@/composables/useOnlineStatus'
import { useOfflineSync } from '@/composables/useOfflineSync'
import { useEditModeStore } from '@/stores/editMode'
import ProjectAvatarIcon from './ProjectAvatarIcon.vue'
import ProjectMenuDrawer from './ProjectMenuDrawer.vue'

const props = defineProps<{
  title: string
}>()

const uiStore = useUiStore()
const authStore = useAuthStore()
const drawerStore = useDrawerStore()
const { isOnline } = useOnlineStatus()
const { hasSnapshot } = useOfflineSync()
const editMode = useEditModeStore()

const editIndicatorTitle = computed(() => {
  if (editMode.isEditing) return I18N.EDIT_MODE.EDITING
  if (editMode.otherEditor) return I18N.EDIT_MODE.EDITING_BY(editMode.otherEditorName)
  return 'Project menu'
})

const avatarName = computed(() =>
  authStore.activeProject?.name ?? authStore.displayName ?? '?'
)


function openMenu() {
  uiStore.openHamburgerMenu()
}

function openProjectMenu() {
  drawerStore.push(ProjectMenuDrawer, {})
}
</script>
