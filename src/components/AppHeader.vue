<template>
  <header class="sticky top-0 z-50 bg-gray-900 border-b border-gray-800">
    <div class="flex items-center justify-between px-4 py-3">
      <!-- Left: Hamburger Menu Icon + offline indicator -->
      <div class="relative -ml-2">
        <button
          @click="openMenu"
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
      <h1 class="text-xl font-bold text-white">{{ title }}</h1>

      <!-- Right: Action slot + Project avatar -->
      <div class="flex items-center gap-1 -mr-1">
        <slot name="action" />
        <button
          @click="openProjectMenu"
          class="p-1 rounded-full hover:ring-2 hover:ring-gray-600 transition-all"
          aria-label="Project menu"
        >
          <ProjectAvatarIcon
            :name="avatarName"
            :thumbnail-url="authStore.activeProject?.thumbnail_url ?? null"
            :size="32"
          />
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { useDrawerStore } from '@/stores/drawer'
import { I18N } from '@/constants/i18n'
import { useOnlineStatus } from '@/composables/useOnlineStatus'
import ProjectAvatarIcon from './ProjectAvatarIcon.vue'
import ProjectMenuDrawer from './ProjectMenuDrawer.vue'

defineProps<{
  title: string
}>()

const uiStore = useUiStore()
const authStore = useAuthStore()
const drawerStore = useDrawerStore()
const { isOnline } = useOnlineStatus()

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
