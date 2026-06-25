import type { ComputedRef, Ref } from 'vue'
import { useUiStore } from '@/stores/ui'
import { useDrawerStore } from '@/stores/drawer'
import { useTagsStore } from '@/stores/tags'
import { useListsStore } from '@/stores/lists'
import { deleteListItem } from '@/services/listItemService'
import { removeFromLibrary } from '@/services/libraryService'
import BulkActionsDrawer from '@/components/BulkActionsDrawer.vue'
import type { BulkAction } from '@/types/bulkAction'
import BulkAddToListsDrawer from '@/components/BulkAddToListsDrawer.vue'
import BulkAssignTagsDrawer from '@/components/BulkAssignTagsDrawer.vue'
import BulkRemoveTagsDrawer from '@/components/BulkRemoveTagsDrawer.vue'
import ConfirmDrawer from '@/components/ConfirmDrawer.vue'
import { I18N } from '@/constants/i18n'
import type { ListItem, SongWithTags } from '@/types/database'

export function useListBulkActions(
  listId: Ref<string>,
  listItems: ComputedRef<Array<ListItem & { song: SongWithTags }>>,
  listName: ComputedRef<string>,
  onRefresh: () => Promise<void>,
) {
  const uiStore = useUiStore()
  const drawerStore = useDrawerStore()
  const tagsStore = useTagsStore()
  const listsStore = useListsStore()

  function handleChooseAction() {
    const actions: BulkAction[] = [
      { label: I18N.BULK_ACTIONS.REMOVE_FROM_LIST, variant: 'warning', keepDrawerOpen: true, onClick: handleBulkRemoveFromList },
      { label: I18N.BULK_ACTIONS.DELETE, variant: 'danger', keepDrawerOpen: true, onClick: handleBulkDeleteSongs },
      { label: I18N.BULK_ACTIONS.ADD_TO_LISTS, keepDrawerOpen: true, onClick: handleBulkAddToLists },
      { label: I18N.BULK_ACTIONS.ASSIGN_TAGS, keepDrawerOpen: true, onClick: handleBulkAssignTags },
      { label: I18N.BULK_ACTIONS.REMOVE_TAGS, keepDrawerOpen: true, onClick: handleBulkRemoveTags },
    ]
    drawerStore.push(BulkActionsDrawer, { actions })
  }

  function handleBulkRemoveFromList() {
    const ids = [...uiStore.selectedIds]
    const count = ids.length
    const name = listName.value
    drawerStore.push(ConfirmDrawer, {
      title: `Remove ${count} song${count !== 1 ? 's' : ''} from list?`,
      message: `This will remove ${count} song${count !== 1 ? 's' : ''} from ${name}.`,
      confirmLabel: I18N.BUTTONS.REMOVE,
      cancelLabel: I18N.BUTTONS.CANCEL,
      confirmCallback: async () => {
        try {
          for (const listItemId of ids) await deleteListItem(listItemId)
          await onRefresh()
          uiStore.showToast(I18N.TOAST.BULK_REMOVED_FROM_LIST(count, name), 'success')
          uiStore.exitSelectionMode()
          drawerStore.popAll()
        } catch (err) {
          uiStore.showErrorToast('remove songs from list', err as Error)
          drawerStore.popAll()
        }
      },
    })
  }

  function handleBulkDeleteSongs() {
    const count = uiStore.selectedIds.length
    const selectedListItemIds = [...uiStore.selectedIds]
    const librarySongIds = selectedListItemIds
      .map(id => listItems.value.find(i => i.id === id)?.library_song_id)
      .filter(Boolean) as string[]
    drawerStore.push(ConfirmDrawer, {
      title: I18N.MODAL_CONTENT.BULK_DELETE_SONGS_TITLE(count),
      message: I18N.MODAL_CONTENT.BULK_DELETE_SONGS_MESSAGE(count),
      confirmLabel: I18N.BUTTONS.DELETE,
      cancelLabel: I18N.BUTTONS.CANCEL,
      confirmVariant: 'danger',
      confirmCallback: async () => {
        try {
          for (const librarySongId of librarySongIds) await removeFromLibrary(librarySongId)
          await onRefresh()
          uiStore.showToast(I18N.TOAST.BULK_DELETED_SONGS(count), 'success')
          uiStore.exitSelectionMode()
          drawerStore.popAll()
        } catch (err) {
          uiStore.showErrorToast('delete songs', err as Error)
          drawerStore.popAll()
        }
      },
    })
  }

  function handleBulkAddToLists() {
    const ids = [...uiStore.selectedIds]
    const librarySongIds = ids
      .map(id => listItems.value.find(i => i.id === id)?.library_song_id)
      .filter(Boolean) as string[]
    drawerStore.push(BulkAddToListsDrawer, {
      excludeListId: listId.value,
      applyCallback: async (targetListIds: string[]) => {
        try {
          for (const targetListId of targetListIds) {
            await listsStore.bulkAddLibrarySongsToList(targetListId, librarySongIds)
          }
          await onRefresh()
          uiStore.showToast(I18N.TOAST.BULK_ADDED_TO_LISTS(ids.length), 'success')
          uiStore.exitSelectionMode()
          drawerStore.popAll()
        } catch (err) {
          uiStore.showErrorToast('add to lists', err as Error)
          drawerStore.popAll()
        }
      },
    })
  }

  function handleBulkAssignTags() {
    const ids = [...uiStore.selectedIds]
    const librarySongIds = ids
      .map(id => listItems.value.find(i => i.id === id)?.library_song_id)
      .filter(Boolean) as string[]
    drawerStore.push(BulkAssignTagsDrawer, {
      applyCallback: async (tagIds: string[]) => {
        try {
          await tagsStore.bulkAssignTags(librarySongIds, tagIds)
          await onRefresh()
          uiStore.showToast(I18N.TOAST.BULK_TAGS_ASSIGNED(ids.length), 'success')
          uiStore.exitSelectionMode()
          drawerStore.popAll()
        } catch (err) {
          uiStore.showErrorToast('assign tags', err as Error)
          drawerStore.popAll()
        }
      },
    })
  }

  function handleBulkRemoveTags() {
    const ids = [...uiStore.selectedIds]
    const librarySongIds = ids
      .map(id => listItems.value.find(i => i.id === id)?.library_song_id)
      .filter(Boolean) as string[]
    drawerStore.push(BulkRemoveTagsDrawer, {
      applyCallback: async (tagIds: string[]) => {
        try {
          await tagsStore.bulkRemoveTags(librarySongIds, tagIds)
          await onRefresh()
          uiStore.showToast(I18N.TOAST.BULK_TAGS_REMOVED(ids.length), 'success')
          uiStore.exitSelectionMode()
          drawerStore.popAll()
        } catch (err) {
          uiStore.showErrorToast('remove tags', err as Error)
          drawerStore.popAll()
        }
      },
    })
  }

  return { handleChooseAction }
}
