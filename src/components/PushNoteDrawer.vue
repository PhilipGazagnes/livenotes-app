<template>
  <!-- Header -->
  <div class="flex-shrink-0 bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
    <div>
      <h2 class="text-lg font-semibold text-white">Push note to project</h2>
      <p class="text-sm text-gray-400 mt-0.5 truncate max-w-xs">{{ noteTitle }}</p>
    </div>
    <button
      @click="drawerStore.pop()"
      class="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
      </svg>
    </button>
  </div>

  <!-- Content -->
  <div class="flex-1 overflow-y-auto">
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="targets.length === 0" class="text-center py-12 px-6">
      <p class="text-gray-400 text-sm">No other projects available to push to.</p>
    </div>

    <div v-else class="p-4 space-y-2">
      <button
        v-for="project in targets"
        :key="project.id"
        @click="handlePush(project)"
        :disabled="pushingId === project.id"
        class="w-full flex items-center gap-3 px-4 py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded-lg transition-colors text-left"
      >
        <ProjectAvatarIcon
          :name="project.name"
          :thumbnail-url="project.thumbnail_url"
          :size="32"
          :color="project.slug === 'community' ? '#6366f1' : undefined"
        />
        <span class="flex-1 text-white font-medium truncate">{{ project.name }}</span>
        <span v-if="pushingId === project.id" class="text-xs text-gray-400">Pushing...</span>
        <span v-else-if="project.slug === 'community'" class="text-xs text-indigo-400">Community</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDrawerStore } from '@/stores/drawer'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { fetchUserProjects } from '@/services/projectService'
import { fetchCommunityProject } from '@/services/projectService'
import { pushNoteToProject } from '@/services/notePushService'
import type { Project } from '@/types/database'
import ProjectAvatarIcon from './ProjectAvatarIcon.vue'
import LoadingSpinner from './LoadingSpinner.vue'

const props = defineProps<{
  noteId: string
  noteTitle: string
}>()

const drawerStore = useDrawerStore()
const authStore = useAuthStore()
const uiStore = useUiStore()

const isLoading = ref(true)
const targets = ref<Project[]>([])
const pushingId = ref<string | null>(null)

onMounted(async () => {
  const [userProjects, community] = await Promise.all([
    fetchUserProjects(authStore.userId!),
    fetchCommunityProject(),
  ])

  const list: Project[] = userProjects
    .filter(p => p.id !== authStore.activeProjectId)
    .map(p => p as unknown as Project)

  if (community && community.id !== authStore.activeProjectId) {
    const alreadyIn = list.some(p => p.id === community.id)
    if (!alreadyIn) list.push(community)
  }

  targets.value = list
  isLoading.value = false
})

async function handlePush(project: Project) {
  pushingId.value = project.id
  try {
    await pushNoteToProject(props.noteId, project.id)
    uiStore.showToast(`Note pushed to ${project.name}`, 'success')
    drawerStore.pop()
  } catch (err) {
    uiStore.showErrorToast('push note', err as Error)
  } finally {
    pushingId.value = null
  }
}
</script>
