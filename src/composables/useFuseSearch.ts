import { computed } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import Fuse from 'fuse.js'
import type { FuseResultMatch } from 'fuse.js'
import { getSegments } from '@/utils/highlight'
import type { TextSegment } from '@/utils/highlight'

const FUSE_OPTIONS = {
  keys: [
    { name: 'title', weight: 2 },
    { name: 'subtitle', weight: 1 },
  ],
  includeMatches: true,
  threshold: 0.3,
  minMatchCharLength: 2,
  ignoreLocation: true,
  ignoreDiacritics: true,
}

interface SearchRecord<T> {
  item: T
  title: string
  subtitle: string
}

/**
 * Shared Fuse.js search over an item's card title and card subtitle.
 * getTitle/getSubtitle should be the same accessors used to render the card,
 * so search always matches exactly what's displayed.
 */
export function useFuseSearch<T extends { id: string }>(
  items: Ref<T[]> | ComputedRef<T[]>,
  searchQuery: Ref<string>,
  getTitle: (item: T) => string,
  getSubtitle: (item: T) => string | undefined,
) {
  const searchable = computed<SearchRecord<T>[]>(() =>
    items.value.map(item => ({ item, title: getTitle(item), subtitle: getSubtitle(item) ?? '' }))
  )

  const fuseInstance = computed(() => new Fuse(searchable.value, FUSE_OPTIONS))

  const searchResult = computed(() => {
    if (!searchQuery.value.trim()) {
      return { results: items.value, matchMap: new Map<string, FuseResultMatch[]>() }
    }
    const matches = fuseInstance.value.search(searchQuery.value)
    const matchMap = new Map<string, FuseResultMatch[]>()
    const results = matches.map(m => {
      matchMap.set(m.item.item.id, (m.matches as FuseResultMatch[]) ?? [])
      return m.item.item
    })
    return { results, matchMap }
  })

  const filteredItems = computed(() => searchResult.value.results)
  const matchMap = computed(() => searchResult.value.matchMap)

  function getTitleSegments(item: T): TextSegment[] | undefined {
    const matches = matchMap.value.get(item.id)
    const match = matches?.find(m => m.key === 'title')
    return match ? getSegments(getTitle(item), match.indices as ReadonlyArray<[number, number]>) : undefined
  }

  function getSubtitleSegments(item: T): TextSegment[] | undefined {
    const subtitle = getSubtitle(item)
    if (!subtitle) return undefined
    const matches = matchMap.value.get(item.id)
    const match = matches?.find(m => m.key === 'subtitle')
    return match ? getSegments(subtitle, match.indices as ReadonlyArray<[number, number]>) : undefined
  }

  return { filteredItems, getTitleSegments, getSubtitleSegments }
}
