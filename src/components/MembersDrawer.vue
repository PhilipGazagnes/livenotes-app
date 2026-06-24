<template>
  <div class="flex-shrink-0 bg-gray-800 border-b border-gray-700 p-4">
    <div class="flex items-center justify-between">
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
        <h2 class="text-xl font-semibold text-white">Members</h2>
      </div>
      <button
        v-if="isAdmin"
        @click="openInvite"
        class="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Invite
      </button>
    </div>
  </div>

  <div class="flex-1 overflow-y-auto">
    <div v-if="isLoading" class="flex items-center justify-center py-16">
      <svg class="w-6 h-6 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>

    <ul v-else class="divide-y divide-gray-800">
      <li
        v-for="member in displayedMembers"
        :key="member.id"
        class="flex items-center gap-3 px-4 py-3"
      >
        <!-- Avatar -->
        <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center shrink-0 overflow-hidden">
          <img v-if="member.avatar_url" :src="member.avatar_url" :alt="member.display_name" class="w-full h-full object-cover"/>
          <span v-else class="text-sm font-semibold text-gray-300">{{ member.display_name.charAt(0).toUpperCase() }}</span>
        </div>

        <!-- Name + role -->
        <div class="flex-1 min-w-0">
          <p class="text-sm text-white font-medium truncate">
            {{ member.display_name }}
            <span v-if="member.user_id === authStore.userId" class="text-gray-500 font-normal"> (you)</span>
          </p>
          <span class="text-xs px-1.5 py-0.5 rounded-full" :class="roleBadgeClass(member.role)">
            {{ roleLabel(member.role) }}
          </span>
        </div>

        <!-- Admin actions -->
        <div v-if="isAdmin && member.user_id !== authStore.userId" class="flex items-center gap-1 shrink-0">
          <select
            :value="member.role"
            :disabled="!!changingRoleId"
            @change="handleRoleChange(member.id, ($event.target as HTMLSelectElement).value as ProjectRole)"
            class="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="reader">Reader</option>
            <option value="editor">Editor</option>
            <option value="administrator">Admin</option>
          </select>
          <button
            @click="handleRemove(member)"
            :disabled="!!removingId"
            class="p-1.5 text-gray-500 hover:text-red-400 hover:bg-gray-800 rounded transition-colors disabled:opacity-50"
            title="Remove member"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </li>
    </ul>

    <p v-if="!isLoading && !members.length" class="text-sm text-gray-500 text-center py-12">No members found.</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDrawerStore } from '@/stores/drawer'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { fetchProjectMembers, removeMember, updateMemberRole } from '@/services/membershipService'
import type { MemberWithProfile } from '@/services/membershipService'
import type { ProjectRole } from '@/types/database'
import InviteDrawer from './InviteDrawer.vue'

const drawerStore = useDrawerStore()
const authStore = useAuthStore()
const uiStore = useUiStore()

const members = ref<MemberWithProfile[]>([])
const isLoading = ref(false)
const removingId = ref<string | null>(null)
const changingRoleId = ref<string | null>(null)

const isAdmin = computed(() =>
  members.value.some(m => m.user_id === authStore.userId && m.role === 'administrator')
)

const isCommunityProject = computed(() => authStore.activeProject?.slug === 'community')

const displayedMembers = computed(() =>
  isCommunityProject.value
    ? members.value.filter(m => m.role !== 'reader')
    : members.value
)

onMounted(async () => {
  const projectId = authStore.activeProjectId
  if (!projectId) return
  isLoading.value = true
  try {
    members.value = await fetchProjectMembers(projectId)
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

function openInvite() {
  drawerStore.push(InviteDrawer, {})
}

async function handleRoleChange(membershipId: string, role: ProjectRole) {
  changingRoleId.value = membershipId
  try {
    await updateMemberRole(membershipId, role)
    const m = members.value.find(m => m.id === membershipId)
    if (m) m.role = role
    uiStore.showToast('Role updated', 'success')
  } catch {
    uiStore.showToast('Failed to update role', 'error')
  } finally {
    changingRoleId.value = null
  }
}

async function handleRemove(member: MemberWithProfile) {
  const confirmed = await uiStore.showConfirm(
    'Remove member',
    `Remove ${member.display_name} from this project?`,
    'Remove',
    'Cancel',
  )
  if (!confirmed) return
  removingId.value = member.id
  try {
    await removeMember(member.id)
    members.value = members.value.filter(m => m.id !== member.id)
    uiStore.showToast(`${member.display_name} removed`, 'success')
  } catch {
    uiStore.showToast('Failed to remove member', 'error')
  } finally {
    removingId.value = null
  }
}
</script>
