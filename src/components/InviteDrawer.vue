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
      <h2 class="text-xl font-semibold text-white">Invite members</h2>
    </div>
  </div>

  <div class="flex-1 overflow-y-auto p-4 space-y-6">

    <!-- Create new key -->
    <section>
      <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Generate a key</h3>
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1">Role</label>
          <select
            v-model="selectedRole"
            class="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
          >
            <option value="reader">Reader — can view songs and lists</option>
            <option value="editor">Editor — can add and edit songs</option>
            <option value="administrator">Admin — full control</option>
          </select>
        </div>
        <button
          @click="handleCreate"
          :disabled="isCreating"
          class="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center justify-center gap-2"
        >
          <svg v-if="isCreating" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          Generate key
        </button>
      </div>
    </section>

    <!-- Active keys -->
    <section v-if="activeLinks.length">
      <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Active keys</h3>
      <div class="space-y-2">
        <div
          v-for="link in activeLinks"
          :key="link.id"
          class="bg-gray-800 rounded-lg p-3 border border-gray-700"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-medium px-2 py-0.5 rounded-full" :class="roleBadgeClass(link.role)">
              {{ roleLabel(link.role) }}
            </span>
            <span class="text-xs text-gray-500">expires {{ formatExpiry(link.expires_at) }}</span>
          </div>
          <div class="flex gap-2">
            <input
              :value="link.token"
              readonly
              class="flex-1 px-2 py-1.5 bg-gray-900 border border-gray-700 rounded text-xs text-gray-300 font-mono truncate focus:outline-none"
            />
            <button
              @click="copyLink(link.token, link.id)"
              class="px-2 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors shrink-0"
            >
              {{ copiedId === link.id ? 'Copied!' : 'Copy' }}
            </button>
            <button
              @click="handleRevoke(link.id)"
              :disabled="revokingId === link.id"
              class="px-2 py-1.5 bg-red-900/50 hover:bg-red-800 text-red-300 rounded text-xs transition-colors shrink-0 disabled:opacity-50"
            >
              Revoke
            </button>
          </div>
        </div>
      </div>
    </section>

    <p v-else-if="!isLoading" class="text-sm text-gray-500 text-center py-4">No active keys.</p>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDrawerStore } from '@/stores/drawer'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import {
  createInvitationLink,
  revokeInvitationLink,
  fetchActiveInvitationLinks,
} from '@/services/membershipService'
import type { InvitationLink, ProjectRole } from '@/types/database'

const drawerStore = useDrawerStore()
const authStore = useAuthStore()
const uiStore = useUiStore()

const activeLinks = ref<InvitationLink[]>([])
const selectedRole = ref<ProjectRole>('editor')
const isLoading = ref(false)
const isCreating = ref(false)
const revokingId = ref<string | null>(null)
const copiedId = ref<string | null>(null)

onMounted(async () => {
  const projectId = authStore.activeProjectId
  if (!projectId) return
  isLoading.value = true
  try {
    activeLinks.value = await fetchActiveInvitationLinks(projectId)
  } finally {
    isLoading.value = false
  }
})

function roleLabel(role: string) {
  return role === 'administrator' ? 'Admin' : role.charAt(0).toUpperCase() + role.slice(1)
}

function roleBadgeClass(role: string) {
  if (role === 'administrator') return 'bg-purple-900/50 text-purple-300'
  if (role === 'editor') return 'bg-blue-900/50 text-blue-300'
  return 'bg-gray-700 text-gray-300'
}

function formatExpiry(expiresAt: string) {
  const d = new Date(expiresAt)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

async function handleCreate() {
  const projectId = authStore.activeProjectId
  const userId = authStore.userId
  if (!projectId || !userId) return
  isCreating.value = true
  try {
    const link = await createInvitationLink(projectId, selectedRole.value, userId)
    activeLinks.value.unshift(link)
    uiStore.showToast('Invitation key generated', 'success')
  } catch {
    uiStore.showToast('Failed to generate key', 'error')
  } finally {
    isCreating.value = false
  }
}

async function copyLink(token: string, id: string) {
  try {
    await navigator.clipboard.writeText(token)
    copiedId.value = id
    setTimeout(() => { copiedId.value = null }, 2000)
  } catch {
    uiStore.showToast('Could not copy to clipboard', 'error')
  }
}

async function handleRevoke(id: string) {
  revokingId.value = id
  try {
    await revokeInvitationLink(id)
    activeLinks.value = activeLinks.value.filter(l => l.id !== id)
    uiStore.showToast('Key revoked', 'success')
  } catch {
    uiStore.showToast('Failed to revoke key', 'error')
  } finally {
    revokingId.value = null
  }
}
</script>
