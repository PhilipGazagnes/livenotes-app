<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="uiStore.isHamburgerMenuOpen"
        class="fixed inset-0 z-[100] bg-black/50"
        @mousedown.self="closeMenu"
      >
        <Transition
          enter-active-class="transition-transform duration-200"
          leave-active-class="transition-transform duration-200"
          enter-from-class="-translate-x-full"
          leave-to-class="-translate-x-full"
        >
          <div
            v-if="uiStore.isHamburgerMenuOpen"
            class="absolute left-0 top-0 bottom-0 w-64 bg-gray-900 shadow-xl"
            @click.stop
          >
            <!-- Header -->
            <div class="flex items-center justify-between px-4 py-4 border-b border-gray-800">
              <h2 class="text-xl font-bold text-white">{{ I18N.APP.NAME }}</h2>
              <button
                @click="closeMenu"
                class="p-2 text-gray-400 hover:text-white transition-colors"
                :aria-label="I18N.ARIA.CLOSE_MENU"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Menu Items -->
            <nav class="flex flex-col p-4 space-y-2">
              <router-link
                :to="ROUTES.LIBRARY"
                @click="handleNavigate(ROUTES.LIBRARY, 'Loading library...')"
                class="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
                </svg>
                <span class="font-medium">My Library</span>
              </router-link>

              <router-link
                :to="ROUTES.TAGS"
                @click="handleNavigate(ROUTES.TAGS, 'Loading tags...')"
                class="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                </svg>
                <span class="font-medium">{{ I18N.NAVIGATION.TAGS }}</span>
              </router-link>

              <router-link
                :to="ROUTES.ARTISTS"
                @click="handleNavigate(ROUTES.ARTISTS, 'Loading artists...')"
                class="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                <span class="font-medium">Artists</span>
              </router-link>

              <router-link
                :to="ROUTES.LISTS"
                @click="handleNavigate(ROUTES.LISTS, 'Loading lists...')"
                class="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
                </svg>
                <span class="font-medium">{{ I18N.NAVIGATION.LISTS }}</span>
              </router-link>

              <router-link
                v-if="authStore.isAdmin"
                :to="ROUTES.PUBLIC_LIBRARIES"
                @click="handleNavigate(ROUTES.PUBLIC_LIBRARIES, 'Loading public libraries...')"
                class="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                </svg>
                <span class="font-medium">Public Libraries</span>
              </router-link>

            </nav>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { ROUTES } from '@/constants/routes'
import { I18N } from '@/constants/i18n'

const route = useRoute()
const uiStore = useUiStore()
const authStore = useAuthStore()

function closeMenu() {
  uiStore.closeHamburgerMenu()
}

function handleNavigate(targetRoute: string, message: string) {
  // Only show overlay if navigating to a different page
  if (route.path !== targetRoute) {
    uiStore.showOperationOverlay(message)
  }
  closeMenu()
}

</script>
