<template>
  <ion-page>
    <ion-content class="bg-gray-900">
      <div class="flex items-center justify-center min-h-screen p-4">
        <div class="w-full max-w-md">
          <!-- Header -->
          <div class="text-center mb-8">
            <h1 class="text-4xl font-bold text-white mb-2">{{ I18N.APP.NAME }}</h1>
            <p class="text-gray-400">{{ I18N.PAGE_TITLES.LOGIN }}</p>
          </div>

          <!-- Error message -->
          <div v-if="authStore.error" class="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg">
            <p class="text-red-400 text-sm">{{ authStore.error }}</p>
          </div>

          <!-- Login Form -->
          <form @submit.prevent="handleLogin" class="space-y-4">
            <!-- Email -->
            <div>
              <label for="email" class="block text-sm font-medium text-gray-300 mb-1">
                {{ I18N.FORM.EMAIL }}
              </label>
              <input
                id="email"
                v-model="email"
                type="email"
                required
                autocomplete="email"
                class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                :placeholder="I18N.PLACEHOLDERS.EMAIL"
              />
            </div>

            <!-- Password -->
            <div>
              <label for="password" class="block text-sm font-medium text-gray-300 mb-1">
                {{ I18N.FORM.PASSWORD }}
              </label>
              <input
                id="password"
                v-model="password"
                type="password"
                required
                autocomplete="current-password"
                class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                :placeholder="I18N.PLACEHOLDERS.PASSWORD"
              />
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              :disabled="authStore.isLoading"
              class="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {{ authStore.isLoading ? I18N.LOADING.SIGNING_IN : I18N.AUTH.SIGN_IN }}
            </button>
          </form>

          <!-- Divider -->
          <div class="relative my-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-700"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-gray-900 text-gray-400">{{ I18N.AUTH.OR_CONTINUE_WITH }}</span>
            </div>
          </div>

          <!-- OAuth Buttons -->
          <div class="space-y-3">
            <button
              type="button"
              @click="handleOAuthLogin('google')"
              :disabled="authStore.isLoading"
              class="w-full px-4 py-3 bg-white hover:bg-gray-100 disabled:bg-gray-700 disabled:cursor-not-allowed text-gray-900 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>

            <button
              type="button"
              @click="handleOAuthLogin('facebook')"
              :disabled="authStore.isLoading"
              class="w-full px-4 py-3 bg-[#1877F2] hover:bg-[#166FE5] disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Sign in with Facebook
            </button>
          </div>

          <!-- Signup Link -->
          <div class="mt-6 text-center">
            <p class="text-gray-400 text-sm">
              {{ I18N.AUTH.NO_ACCOUNT }}
              <router-link to="/signup" class="text-blue-400 hover:text-blue-300 font-medium">
                {{ I18N.AUTH.SIGN_UP_LINK }}
              </router-link>
            </p>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { IonPage, IonContent } from '@ionic/vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { ROUTES } from '@/constants/routes'
import { MESSAGES } from '@/constants/messages'
import { I18N } from '@/constants/i18n'

const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUiStore()

const email = ref('')
const password = ref('')

async function handleLogin() {
  const result = await authStore.login(email.value, password.value)
  
  if (result.success) {
    uiStore.showToast(MESSAGES.SUCCESS.LOGIN, 'success')
    uiStore.showOperationOverlay('Loading songs...')
    router.push(ROUTES.ALL_SONGS)
  } else {
    uiStore.showToast(result.error || MESSAGES.ERROR.LOGIN_FAILED, 'error')
  }
}

async function handleOAuthLogin(provider: 'google' | 'facebook') {
  const result = await authStore.loginWithOAuth(provider)
  
  if (!result.success) {
    uiStore.showToast(result.error || MESSAGES.ERROR.LOGIN_FAILED, 'error')
  }
  // OAuth redirects to provider, no need to handle success here
}
</script>
