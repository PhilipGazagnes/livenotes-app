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
        @click="closeMenu"
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
              <h2 class="text-xl font-bold text-white">Livenotes</h2>
              <button
                @click="closeMenu"
                class="p-2 text-gray-400 hover:text-white transition-colors"
                aria-label="Close menu"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Menu Items -->
            <nav class="flex flex-col p-4 space-y-2">
              <router-link
                :to="ROUTES.ALL_SONGS"
                @click="closeMenu"
                class="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
                </svg>
                <span class="font-medium">All Songs</span>
              </router-link>

              <router-link
                :to="ROUTES.TAGS"
                @click="closeMenu"
                class="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                </svg>
                <span class="font-medium">Tags</span>
              </router-link>

              <router-link
                :to="ROUTES.LISTS"
                @click="closeMenu"
                class="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
                </svg>
                <span class="font-medium">Lists</span>
              </router-link>

              <!-- Divider -->
              <div class="border-t border-gray-800 my-2"></div>

              <!-- Logout -->
              <button
                @click="handleLogout"
                class="flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                <span class="font-medium">Logout</span>
              </button>
            </nav>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { ROUTES } from '@/constants/routes'
import { MESSAGES } from '@/constants/messages'

const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUiStore()

function closeMenu() {
  uiStore.closeHamburgerMenu()
}

async function handleLogout() {
  const confirmed = await uiStore.showConfirm(
    'Sign Out',
    'Are you sure you want to sign out?',
    'Sign Out',
    'Cancel'
  )

  if (confirmed) {
    const result = await authStore.logout()
    if (result.success) {
      uiStore.showToast(MESSAGES.SUCCESS.LOGOUT, 'success')
      closeMenu()
      router.push(ROUTES.LOGIN)
    } else {
      uiStore.showToast(result.error || MESSAGES.ERROR.LOGOUT_FAILED, 'error')
    }
  }
}
</script>
