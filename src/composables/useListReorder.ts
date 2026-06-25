import { ref, computed } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import type { IonContent } from '@ionic/vue'
import { useListsStore } from '@/stores/lists'
import { useUiStore } from '@/stores/ui'
import { foldAccents } from '@/utils/validation'
import { I18N } from '@/constants/i18n'
import type { ListWithItems } from '@/types/database'

export function useListReorder(
  currentList: ComputedRef<ListWithItems | null>,
  searchQuery: Ref<string>,
) {
  const listsStore = useListsStore()
  const uiStore = useUiStore()

  const ionContentRef = ref<InstanceType<typeof IonContent> | null>(null)
  const scrollElement = ref<HTMLElement | null>(null)

  async function initScrollElement() {
    if (ionContentRef.value) {
      try {
        const content = await (ionContentRef.value as any).$el.getScrollElement()
        scrollElement.value = content
      } catch {
        // scroll element unavailable in non-Ionic environments
      }
    }
  }

  const displayedItems = computed({
    get() {
      const all = currentList.value?.items ?? []
      let songs = all.filter(item => item.type === 'song')

      if (searchQuery.value.trim()) {
        const query = foldAccents(searchQuery.value)
        songs = songs.filter(item => {
          if (!item.song) return false
          const song = item.song
          return foldAccents(song.title).includes(query) ||
            (song.artist && foldAccents(song.artist).includes(query)) ||
            song.livenotes_poc_id?.toLowerCase().includes(query) ||
            (song.notes && foldAccents(song.notes).includes(query))
        })
      }

      const result: typeof all = []
      for (const item of all) {
        if (item.type === 'title' || songs.includes(item)) result.push(item)
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

  return { ionContentRef, scrollElement, initScrollElement, displayedItems, handleDragEnd }
}
