<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <div
      v-if="isOpen && !showManageTagsModal && !showManageListsModal"
      class="fixed inset-0 z-40"
      @click="handleClose"
    ></div>

    <!-- Dropdown Menu -->
    <div
      v-if="isOpen && !showManageTagsModal && !showManageListsModal"
      class="fixed z-50 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl"
      :style="menuPosition"
    >
      <div class="py-1">
        <button
          @click="handleRemoveFromList"
          class="w-full flex items-center gap-3 px-4 py-3 text-left text-yellow-400 hover:text-yellow-300 hover:bg-gray-700 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span>Remove from List</span>
        </button>

        <div class="border-t border-gray-700 my-1"></div>

        <button
          @click="handleEdit"
          class="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
          <span>Edit</span>
        </button>

        <button
          @click="handleDuplicate"
          class="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
          </svg>
          <span>Duplicate</span>
        </button>

        <button
          @click="handleManageTags"
          class="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
          </svg>
          <span>Manage Tags</span>
        </button>

        <button
          @click="handleManageLists"
          class="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
          </svg>
          <span>Manage Lists</span>
        </button>

        <div class="border-t border-gray-700 my-1"></div>

        <button
          @click="handleDelete"
          class="w-full flex items-center gap-3 px-4 py-3 text-left text-red-400 hover:text-red-300 hover:bg-gray-700 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
          <span>Delete</span>
        </button>
      </div>
    </div>

    <!-- Manage Tags Modal -->
    <ManageTagsModal
      :isOpen="showManageTagsModal"
      :songId="props.song.id"
      :songTitle="props.song.title"
      :initialTagIds="props.song.tags?.map(t => t.id) || []"
      @close="handleModalClose"
      @saved="handleTagsSaved"
    />

    <!-- Manage Lists Modal -->
    <ManageListsModal
      :isOpen="showManageListsModal"
      :songId="props.song.id"
      :songTitle="props.song.title"
      :initialListIds="props.song.lists?.map(l => l.id) || []"
      @close="() => { showManageListsModal = false; handleClose(); }"
      @saved="handleListsSaved"
    />
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { SongWithTags } from '@/types/database'
import { useSongsStore } from '@/stores/songs'
import { useAuthStore } from '@/stores/auth'
import { useTagsStore } from '@/stores/tags'
import { useListsStore } from '@/stores/lists'
import { useUiStore } from '@/stores/ui'
import { ROUTES } from '@/constants/routes'
import { MESSAGES } from '@/constants/messages'
import ManageTagsModal from './ManageTagsModal.vue'
import ManageListsModal from './ManageListsModal.vue'

const props = defineProps<{
  song: SongWithTags
}>()

const emit = defineEmits<{
  close: []
  remove: []
  tagsUpdated: []
  listsUpdated: []
}>()

const router = useRouter()
const songsStore = useSongsStore()
const authStore = useAuthStore()
const tagsStore = useTagsStore()
const listsStore = useListsStore()
const uiStore = useUiStore()

const isOpen = ref(true)
const menuPosition = ref({ top: '0px', left: '0px' })
const showManageTagsModal = ref(false)
const showManageListsModal = ref(false)

onMounted(() => {
  // Position menu near cursor
  // For now, center it on screen
  menuPosition.value = {
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)'
  }
})

function handleClose() {
  isOpen.value = false
  emit('close')
}

function handleRemoveFromList() {
  emit('remove')
  handleClose()
}

function handleEdit() {
  router.push(`/song/${props.song.id}/edit`)
  handleClose()
}

async function handleDuplicate() {
  const confirmed = await uiStore.showConfirm(
    'Duplicate Song',
    `Create a copy of "${props.song.title}"?`,
    'Duplicate',
    'Cancel'
  )

  if (confirmed) {
    const result = await songsStore.createSong({
      project_id: props.song.project_id,
      title: `${props.song.title} (copy)`,
      artist: props.song.artist,
      notes: props.song.notes,
      livenotes_poc_id: null, // Don't copy POC ID
    })

    if (result.success) {
      uiStore.showToast(MESSAGES.SUCCESS.SONG_DUPLICATED, 'success')
    } else {
      uiStore.showToast(result.error || MESSAGES.ERROR.SAVE_FAILED, 'error')
    }
  }
  
  handleClose()
}

async function handleManageTags() {
  // Lazy load tags only when modal is opened
  const personalProjectId = await authStore.getPersonalProjectId()
  if (personalProjectId) {
    await tagsStore.fetchTags(personalProjectId)
  }
  showManageTagsModal.value = true
}

function handleModalClose() {
  showManageTagsModal.value = false
  isOpen.value = false
  emit('close')
}

async function handleTagsSaved() {
  showManageTagsModal.value = false
  isOpen.value = false
  emit('tagsUpdated')
  emit('close')
}

async function handleManageLists() {
  // Lazy load lists only when modal is opened
  const personalProjectId = await authStore.getPersonalProjectId()
  if (personalProjectId) {
    await listsStore.fetchLists(personalProjectId)
  }
  showManageListsModal.value = true
}

async function handleListsSaved() {
  showManageListsModal.value = false
  isOpen.value = false
  emit('listsUpdated')
  emit('close')
}

async function handleDelete() {
  const confirmed = await uiStore.showConfirm(
    'Delete Song',
    MESSAGES.CONFIRM_DELETE_SONG(props.song.title),
    'Delete',
    'Cancel'
  )

  if (confirmed) {
    const result = await songsStore.deleteSong(props.song.id, props.song.project_id)
    
    if (result.success) {
      uiStore.showToast(MESSAGES.SUCCESS.SONG_DELETED, 'success')
      // Refresh the list to remove deleted song from UI
      emit('tagsUpdated') // Reusing this event to trigger refresh
    } else {
      uiStore.showToast(result.error || MESSAGES.ERROR.SAVE_FAILED, 'error')
    }
  }
  
  handleClose()
}
</script>
