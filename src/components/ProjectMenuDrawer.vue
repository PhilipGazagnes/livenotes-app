<template>
  <div class="flex flex-col h-full bg-gray-900 overflow-y-auto">

    <!-- User info -->
    <div class="flex items-start justify-between px-4 pt-5 pb-3">
      <div>
        <p class="text-xs text-gray-500 uppercase tracking-wider mb-1">Logged in as</p>
        <p class="text-white font-semibold truncate">{{ authStore.displayName }}</p>
      </div>
      <button @click="drawerStore.popAll()" class="p-1 text-gray-500 hover:text-white transition-colors" aria-label="Close">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <button
      @click="goToSettings"
      class="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors text-sm"
    >
      <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
      User settings
    </button>

    <div class="border-t border-gray-800 mx-4 my-1" />

    <!-- Active project -->
    <template v-if="authStore.activeProject">
      <div class="px-4 pt-3 pb-1">
        <div class="flex items-center gap-2">
          <ProjectAvatarIcon
            :name="authStore.activeProject.name"
            :thumbnail-url="authStore.activeProject.thumbnail_url"
            :size="28"
          />
          <span class="text-white font-semibold text-sm truncate">{{ authStore.activeProject.name }}</span>
        </div>
      </div>
      <button
        v-if="authStore.isAdmin"
        @click="goToProjectSettings"
        class="flex items-center gap-3 px-6 py-2.5 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors text-sm"
      >
        Project settings
      </button>
      <button
        v-if="authStore.isAdmin"
        @click="openMembers"
        class="flex items-center gap-3 px-6 py-2.5 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors text-sm"
      >
        Members
      </button>
      <button
        v-if="!isCommunityActive"
        @click="openOfflineSync"
        class="flex items-center justify-between px-6 py-2.5 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors text-sm w-full"
      >
        <span>Sync for offline use</span>
        <span v-if="lastSyncedAt" class="text-xs text-gray-600">synced {{ formatSyncDate(lastSyncedAt) }}</span>
      </button>

      <div class="border-t border-gray-800 mx-4 my-1" />
    </template>

    <!-- Other projects -->
    <template v-if="otherProjects.length">
      <button
        v-for="project in otherProjects"
        :key="project.id"
        @click="switchProject(project.id)"
        class="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors text-sm"
      >
        <ProjectAvatarIcon
          :name="project.name"
          :thumbnail-url="project.thumbnail_url"
          :size="24"
        />
        <span class="truncate">{{ project.name }}</span>
      </button>

      <div class="border-t border-gray-800 mx-4 my-1" />
    </template>

    <!-- Community project -->
    <button
      v-if="communityProject && !isActiveProject(communityProject.id)"
      @click="switchProject(communityProject.id)"
      class="flex items-center gap-3 px-4 py-3 transition-colors text-sm"
      :class="isActiveProject(communityProject.id)
        ? 'text-white font-semibold'
        : 'text-gray-300 hover:text-white hover:bg-gray-800'"
    >
      <ProjectAvatarIcon
        name="Community"
        :thumbnail-url="null"
        :size="24"
        color="#6366f1"
      />
      <span>Community</span>
    </button>

    <div v-if="communityProject && !isActiveProject(communityProject.id)" class="border-t border-gray-800 mx-4 my-1" />

    <!-- Create / Join -->
    <button
      @click="openCreateProject"
      class="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors text-sm"
    >
      <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
      </svg>
      Create a project
    </button>
    <button
      @click="showJoinInfo"
      class="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors text-sm"
    >
      <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
      </svg>
      Join a project
    </button>

    <div class="border-t border-gray-800 mx-4 my-1" />

    <!-- Log out -->
    <button
      @click="handleLogout"
      class="flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-gray-800 transition-colors text-sm mb-4"
    >
      <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
      </svg>
      Log out
    </button>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDrawerStore } from '@/stores/drawer'
import { useUiStore } from '@/stores/ui'
import { fetchUserProjects, fetchCommunityProject } from '@/services/projectService'
import type { ProjectWithRole } from '@/services/projectService'
import type { Project } from '@/types/database'
import { ROUTES } from '@/constants/routes'
import { MESSAGES } from '@/constants/messages'
import { useOfflineSync, formatSyncDate } from '@/composables/useOfflineSync'
import ProjectAvatarIcon from './ProjectAvatarIcon.vue'
import CreateProjectDrawer from './CreateProjectDrawer.vue'
import ProjectSettingsDrawer from './ProjectSettingsDrawer.vue'
import MembersDrawer from './MembersDrawer.vue'
import JoinProjectDrawer from './JoinProjectDrawer.vue'
import UserSettingsDrawer from './UserSettingsDrawer.vue'
import OfflineSyncDrawer from './OfflineSyncDrawer.vue'

const router = useRouter()
const authStore = useAuthStore()
const drawerStore = useDrawerStore()
const uiStore = useUiStore()

const allProjects = ref<ProjectWithRole[]>([])
const communityProject = ref<Project | null>(null)

const otherProjects = computed(() =>
  allProjects.value.filter(p => p.id !== authStore.activeProjectId && p.slug !== 'community')
)

const isCommunityActive = computed(() => authStore.activeProject?.slug === 'community')
const { lastSyncedAt } = useOfflineSync(authStore.activeProjectId ?? '')

function isActiveProject(id: string) {
  return authStore.activeProjectId === id
}

onMounted(async () => {
  const [projects, community] = await Promise.all([
    fetchUserProjects(authStore.userId!),
    fetchCommunityProject(),
  ])
  allProjects.value = projects.filter(p => p.slug !== 'community')
  communityProject.value = community
})

async function switchProject(projectId: string) {
  drawerStore.popAll()
  uiStore.showOperationOverlay('Loading project...')
  await authStore.setActiveProject(projectId)
  await router.push(ROUTES.LIBRARY)
  uiStore.hideOperationOverlay()
}

function goToSettings() {
  drawerStore.push(UserSettingsDrawer, {})
}

function goToProjectSettings() {
  drawerStore.push(ProjectSettingsDrawer, {})
}

function openCreateProject() {
  drawerStore.push(CreateProjectDrawer, {})
}

function openMembers() {
  drawerStore.push(MembersDrawer, {})
}

function openOfflineSync() {
  drawerStore.push(OfflineSyncDrawer, {})
}

function showJoinInfo() {
  drawerStore.push(JoinProjectDrawer, {})
}

async function handleLogout() {
  const confirmed = await uiStore.showConfirm(
    'Sign Out',
    'Are you sure you want to sign out?',
    'Sign Out',
    'Cancel'
  )
  if (!confirmed) return

  drawerStore.clearForNavigation()
  const result = await authStore.logout()
  if (result.success) {
    window.location.replace(ROUTES.LOGIN)
  } else {
    uiStore.showToast(result.error || MESSAGES.ERROR.LOGOUT_FAILED, 'error')
  }
}
</script>
