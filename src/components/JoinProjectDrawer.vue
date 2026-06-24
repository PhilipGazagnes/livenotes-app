<template>
  <div class="flex-shrink-0 bg-gray-800 border-b border-gray-700 p-4">
    <div class="flex items-center gap-3">
      <button
        @click="drawerStore.pop()"
        class="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
        aria-label="Back"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>
      <h2 class="text-xl font-semibold text-white">Join a project</h2>
    </div>
  </div>

  <div class="flex-1 p-6 space-y-4">
    <p class="text-sm text-gray-400">Ask the project administrator for an invitation key, then paste it below.</p>

    <div>
      <input
        ref="inputRef"
        v-model="key"
        type="text"
        placeholder="Paste invitation key…"
        :disabled="isLoading"
        class="w-full px-3 py-2 bg-gray-900 border rounded-lg text-white placeholder-gray-500 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
        :class="error ? 'border-red-500' : 'border-gray-700'"
        @input="error = ''"
        @keyup.enter="handleJoin"
      />
      <p v-if="error" class="mt-1 text-sm text-red-400">{{ error }}</p>
    </div>

    <button
      @click="handleJoin"
      :disabled="isLoading || !key.trim()"
      class="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
    >
      <svg v-if="isLoading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
      {{ isLoading ? 'Joining…' : 'Join' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDrawerStore } from '@/stores/drawer'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { joinViaToken } from '@/services/membershipService'

const drawerStore = useDrawerStore()
const authStore = useAuthStore()
const uiStore = useUiStore()

const key = ref('')
const error = ref('')
const isLoading = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

onMounted(() => setTimeout(() => inputRef.value?.focus(), 320))

async function handleJoin() {
  const token = key.value.trim()
  if (!token) return
  isLoading.value = true
  error.value = ''
  try {
    const result = await joinViaToken(token)
    if (result.already_member) {
      error.value = 'You are already a member of this project.'
      return
    }
    drawerStore.popAll()
    uiStore.showOperationOverlay('Joining project…')
    await authStore.setActiveProject(result.project_id)
    uiStore.hideOperationOverlay()
    uiStore.showToast('Project joined!', 'success')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Invalid or expired key.'
  } finally {
    isLoading.value = false
  }
}
</script>
