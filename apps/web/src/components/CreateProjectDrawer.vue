<template>
  <div class="flex-shrink-0 bg-gray-800 border-b border-gray-700 p-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold text-white">Create a project</h2>
      <button
        @click="drawerStore.pop()"
        :disabled="isLoading"
        class="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Close"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  </div>

  <div class="flex-1 p-6">
    <label class="block text-sm font-medium text-gray-300 mb-2">Project name</label>
    <input
      ref="inputRef"
      v-model="name"
      type="text"
      maxlength="100"
      placeholder="My Band"
      :disabled="isLoading"
      class="w-full px-4 py-2 bg-gray-900 border rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
      :class="error ? 'border-red-500' : 'border-gray-700'"
      @input="error = ''"
      @keyup.enter="handleSubmit"
    />
    <p v-if="error" class="mt-1 text-sm text-red-400">{{ error }}</p>
  </div>

  <div class="flex-shrink-0 p-4 border-t border-gray-700 flex gap-3">
    <button
      @click="drawerStore.pop()"
      :disabled="isLoading"
      class="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
    >
      Cancel
    </button>
    <button
      @click="handleSubmit"
      :disabled="isLoading || !name.trim()"
      class="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
    >
      <svg v-if="isLoading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
      Create
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDrawerStore } from '@/stores/drawer'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { createProject } from '@/services/projectService'

const drawerStore = useDrawerStore()
const authStore = useAuthStore()
const uiStore = useUiStore()

const name = ref('')
const error = ref('')
const isLoading = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

onMounted(() => setTimeout(() => inputRef.value?.focus(), 320))

async function handleSubmit() {
  const trimmed = name.value.trim()
  if (!trimmed) return
  if (!authStore.userId) { error.value = 'Not authenticated'; return }

  isLoading.value = true
  error.value = ''

  try {
    const project = await createProject(trimmed, authStore.userId)
    drawerStore.popAll()
    uiStore.showOperationOverlay('Setting up project...')
    await authStore.setActiveProject(project.id)
    uiStore.hideOperationOverlay()
    uiStore.showToast(`Project "${project.name}" created`, 'success')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to create project'
  } finally {
    isLoading.value = false
  }
}
</script>
