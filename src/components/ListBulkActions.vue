<!--
  ListBulkActions.vue
  
  Bulk operations component for list songs
  
  Extracted from ListDetailPage to handle all multi-selection operations:
  - Remove from list
  - Delete permanently
  - Add to other lists
  - Assign/remove tags
  
  Props:
    - listId: ID of the current list
    - selectedSongs: Array of selected song IDs
    - selectedCount: Computed count for display
  
  Emits:
    - selectAll: Toggle all songs selection
    - refresh: Refresh the song list after changes
    - songsDeleted: Notify parent when songs are permanently deleted
  
  Note: All operations use executeOperation pattern for consistent UX
-->

<template>
  <div class="space-y-3">
    <!-- Action Buttons -->
    <div v-if="selectedCount > 0" class="flex flex-wrap gap-2">
      <button
        @click="handleBulkRemoveFromList"
        class="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {{ I18N.BULK_ACTIONS.REMOVE_FROM_LIST }}
      </button>
      <button
        @click="handleBulkDelete"
        class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {{ I18N.BULK_ACTIONS.DELETE }}
      </button>
      <button
        @click="showBulkAddToListsModal = true"
        class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {{ I18N.BULK_ACTIONS.ADD_TO_LISTS }}
      </button>
      <button
        @click="showBulkAssignTagsModal = true"
        class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {{ I18N.BULK_ACTIONS.ASSIGN_TAGS }}
      </button>
      <button
        @click="showBulkRemoveTagsModal = true"
        class="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {{ I18N.BULK_ACTIONS.REMOVE_TAGS }}
      </button>
    </div>

    <!-- Selection Controls -->
    <div class="flex items-center justify-between gap-4">
      <div class="text-white font-medium">
        {{ I18N.COUNTERS.SELECTED(selectedCount) }}
      </div>
      <div class="flex gap-2">
        <button
          @click="emit('selectAll')"
          class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {{ I18N.BUTTONS.SELECT_ALL }}
        </button>
        <button
          v-if="selectedCount > 0"
          @click="uiStore.deselectAll"
          class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {{ I18N.BUTTONS.DESELECT_ALL }}
        </button>
        <button
          @click="uiStore.exitSelectionMode"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {{ I18N.BUTTONS.DONE }}
        </button>
      </div>
    </div>

    <!-- Bulk Action Modals -->
    <BulkAddToListsModal
      :isOpen="showBulkAddToListsModal"
      @close="showBulkAddToListsModal = false"
      @apply="handleBulkAddToListsApply"
    />

    <BulkAssignTagsModal
      :isOpen="showBulkAssignTagsModal"
      @close="showBulkAssignTagsModal = false"
      @apply="handleBulkAssignTagsApply"
    />

    <BulkRemoveTagsModal
      :isOpen="showBulkRemoveTagsModal"
      @close="showBulkRemoveTagsModal = false"
      @apply="handleBulkRemoveTagsApply"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineAsyncComponent } from 'vue'
import { useListsStore } from '@/stores/lists'
import { useSongsStore } from '@/stores/songs'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { supabase } from '@/utils/supabase'
import { I18N } from '@/constants/i18n'
import { executeOperation, executeConfirmedOperation } from '@/utils/operations'
import { TIMEOUTS } from '@/utils/timeout'
// Lazy load modals for better performance
const BulkAddToListsModal = defineAsyncComponent(() => import('./BulkAddToListsModal.vue'))
const BulkAssignTagsModal = defineAsyncComponent(() => import('./BulkAssignTagsModal.vue'))
const BulkRemoveTagsModal = defineAsyncComponent(() => import('./BulkRemoveTagsModal.vue'))

const props = defineProps<{
  listId: string
  listName: string
}>()

const emit = defineEmits<{
  selectAll: []
  refresh: []
  songsDeleted: [songIds: string[]]
}>()

const listsStore = useListsStore()
const songsStore = useSongsStore()
const authStore = useAuthStore()
const uiStore = useUiStore()

const showBulkAddToListsModal = ref(false)
const showBulkAssignTagsModal = ref(false)
const showBulkRemoveTagsModal = ref(false)

const selectedCount = computed(() => uiStore.selectedIds.length)

async function handleBulkRemoveFromList() {
  const count = selectedCount.value
  
  await executeOperation(
    async () => {
      // Remove all selected songs from the current list
      for (const songId of uiStore.selectedIds) {
        await listsStore.removeSongFromList(props.listId, songId)
      }
      
      return { success: true }
    },
    {
      timeout: TIMEOUTS.BULK,
      loadingMessage: `Removing ${count} song${count > 1 ? 's' : ''} from list...`,
      successMessage: I18N.TOAST.BULK_REMOVED_FROM_LIST(count, props.listName),
      errorContext: 'remove songs from list',
      onSuccess: () => {
        uiStore.exitSelectionMode()
      },
    }
  )
}

async function handleBulkDelete() {
  const count = selectedCount.value
  const confirmed = await uiStore.showConfirm(
    I18N.MODAL_CONTENT.BULK_DELETE_SONGS_TITLE(count),
    I18N.MODAL_CONTENT.BULK_DELETE_SONGS_MESSAGE(count),
    I18N.BUTTONS.DELETE,
    I18N.BUTTONS.CANCEL
  )
  
  if (confirmed) {
    const projectId = await authStore.getPersonalProjectId()
    if (projectId) {
      const deletedIds = [...uiStore.selectedIds]
      const result = await executeConfirmedOperation(
        () => songsStore.bulkDelete(uiStore.selectedIds, projectId),
        {
          loadingMessage: `Deleting ${count} song${count > 1 ? 's' : ''}...`,
          successMessage: I18N.TOAST.BULK_DELETED_SONGS(count),
          errorContext: 'delete songs',
          onSuccess: () => {
            uiStore.exitSelectionMode()
          },
        }
      )
      
      if (result.success) {
        emit('songsDeleted', deletedIds)
      }
    }
  }
}

async function handleBulkAddToListsApply(listIds: string[]) {
  const songCount = selectedCount.value
  
  await executeOperation(
    async () => {
      // Add each selected song to each selected list
      for (const listId of listIds) {
        for (const songId of uiStore.selectedIds) {
          await listsStore.addSongToList(listId, songId)
        }
      }
      return { success: true }
    },
    {
      timeout: TIMEOUTS.BULK,
      loadingMessage: `Adding ${songCount} song${songCount > 1 ? 's' : ''} to lists...`,
      successMessage: I18N.TOAST.BULK_ADDED_TO_LISTS(songCount),
      errorContext: 'add songs to lists',
      onSuccess: () => {
        uiStore.exitSelectionMode()
      },
    }
  )
}

async function handleBulkAssignTagsApply(tagIds: string[]) {
  const songCount = selectedCount.value
  
  await executeOperation(
    async () => {
      // Create song_tag entries for each song-tag combination
      const inserts = []
      for (const songId of uiStore.selectedIds) {
        for (const tagId of tagIds) {
          inserts.push({ song_id: songId, tag_id: tagId })
        }
      }
      
      const { error } = await supabase
        .from('song_tags')
        .upsert(inserts, { onConflict: 'song_id,tag_id', ignoreDuplicates: true })
      
      if (error) throw error
      
      // Refresh list to show updated tags
      emit('refresh')
      
      return { success: true }
    },
    {
      timeout: TIMEOUTS.BULK,
      loadingMessage: `Assigning tags to ${songCount} song${songCount > 1 ? 's' : ''}...`,
      successMessage: I18N.TOAST.BULK_TAGS_ASSIGNED(songCount),
      errorContext: 'assign tags',
      onSuccess: () => {
        uiStore.exitSelectionMode()
      },
    }
  )
}

async function handleBulkRemoveTagsApply(tagIds: string[]) {
  const songCount = selectedCount.value
  
  await executeOperation(
    async () => {
      // Remove tag associations for selected songs and tags
      const { error } = await supabase
        .from('song_tags')
        .delete()
        .in('song_id', uiStore.selectedIds)
        .in('tag_id', tagIds)
      
      if (error) throw error
      
      // Refresh list to show updated tags
      emit('refresh')
      
      return { success: true }
    },
    {
      timeout: TIMEOUTS.BULK,
      loadingMessage: `Removing tags from ${songCount} song${songCount > 1 ? 's' : ''}...`,
      successMessage: I18N.TOAST.BULK_TAGS_REMOVED(songCount),
      errorContext: 'remove tags',
      onSuccess: () => {
        uiStore.exitSelectionMode()
      },
    }
  )
}
</script>
