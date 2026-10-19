import { ref, computed } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import type AppPage from '@/components/AppPage.vue'
import { useListsStore } from '@/stores/lists'
import { useUiStore } from '@/stores/ui'
import { useFuseSearch } from '@/composables/useFuseSearch'
import { I18N } from '@/constants/i18n'
import type { ListWithItems, ListItem, SongWithTags } from '@livenotes/shared/types'

type SongItem = ListItem & { song: SongWithTags }

function getTitle(item: SongItem): string {
  return item.song?.title || ''
}

export function useListReorder(
  currentList: ComputedRef<ListWithItems | null>,
  searchQuery: Ref<string>,
  getSubtitle: (item: SongItem) => string | undefined,
) {
  const listsStore = useListsStore()
  const uiStore = useUiStore()

  const pageRef = ref<InstanceType<typeof AppPage> | null>(null)
  const scrollElement = ref<HTMLElement | null>(null)

  function initScrollElement() {
    scrollElement.value = pageRef.value?.scrollElement ?? null
  }

  const allSongItems = computed(
    () => (currentList.value?.items ?? []).filter((item): item is SongItem => item.type === 'song' && !!item.song)
  )

  const { filteredItems: filteredSongItems, getTitleSegments, getSubtitleSegments } =
    useFuseSearch(allSongItems, searchQuery, getTitle, getSubtitle)

  const displayedItems = computed({
    get() {
      const all = currentList.value?.items ?? []
      const songs = filteredSongItems.value
      const result: typeof all = []
      for (const item of all) {
        if (item.type === 'title' || songs.includes(item as SongItem)) result.push(item)
      }
      return result
    },
    set(newValue) {
      if (currentList.value) currentList.value.items = newValue
    },
  })

  async function handleDragEnd() {
    if (!currentList.value) return
    const reorderedItems = displayedItems.value
    currentList.value.items = reorderedItems
    const itemIds = reorderedItems.map(item => item.id)
    const result = await listsStore.reorderListItems(currentList.value.id, itemIds)
    if (!result.success) {
      uiStore.showToast(I18N.TOAST.REORDER_FAILED, 'error')
      await listsStore.fetchListById(currentList.value.id)
    }
  }

  return {
    pageRef,
    scrollElement,
    initScrollElement,
    displayedItems,
    handleDragEnd,
    getTitleSegments,
    getSubtitleSegments,
  }
}
