<template>
  <ion-page>
    <ion-content class="bg-gray-900">
      <!-- 404 -->
      <div v-if="notFound" class="flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <svg class="w-24 h-24 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <h1 class="text-2xl font-bold text-white mb-2">Not found</h1>
        <p class="text-gray-400">This library doesn't exist or is no longer active.</p>
      </div>

      <template v-else>
        <!-- Header: centered title, matching AppHeader layout -->
        <header class="sticky top-0 z-50 bg-gray-900 border-b border-gray-800">
          <div class="flex items-center justify-between px-4 py-3">
            <div class="w-10"></div>
            <h1 class="text-xl font-bold text-white truncate">{{ library?.name ?? ' ' }}</h1>
            <div class="w-10"></div>
          </div>
        </header>

        <!-- Loading -->
        <div v-if="isLoading" class="flex justify-center py-24">
          <LoadingSpinner />
        </div>

        <div v-else class="pb-24">
          <!-- Empty state -->
          <div v-if="displayedSongs.length === 0" class="text-center py-12 px-4">
            <p class="text-gray-400">No songs match your search.</p>
          </div>

          <!-- Song list -->
          <div v-else class="p-4 space-y-3">
            <PublicSongCard
              v-for="song in displayedSongs"
              :key="song.id"
              :song="song"
              :matches="matchMap.get(song.id)"
              @click="openDrawer(song)"
            />
          </div>
        </div>

        <!-- Sticky bottom bar: search -->
        <div class="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4 z-10">
          <div class="max-w-2xl mx-auto">
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search songs..."
                class="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

      </template>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { IonPage, IonContent } from '@ionic/vue'
import Fuse from 'fuse.js'
import type { FuseResultMatch } from 'fuse.js'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import PublicSongCard from '@/components/PublicSongCard.vue'
import PublicLyricDrawer from '@/components/PublicLyricDrawer.vue'
import { useDrawerStore } from '@/stores/drawer'
import { fetchPublicLibraryBySlug, fetchPublicLibrarySongs } from '@/services/publicLibraryService'
import type { LibrarySongWithDetails, PublicLibraryWithTags } from '@/types/database'

const route = useRoute()
const drawerStore = useDrawerStore()

const library = ref<PublicLibraryWithTags | null>(null)
const songs = ref<LibrarySongWithDetails[]>([])
const isLoading = ref(true)
const notFound = ref(false)
const searchQuery = ref('')

onMounted(async () => {
  const projectSlug = route.params.projectSlug as string
  const librarySlug = route.params.librarySlug as string

  const lib = await fetchPublicLibraryBySlug(projectSlug, librarySlug)
  if (!lib) { notFound.value = true; isLoading.value = false; return }

  library.value = lib
  songs.value = await fetchPublicLibrarySongs(lib.project_id, lib.tags.map(t => t.id))
  isLoading.value = false
})

const fuseInstance = computed(() => new Fuse(songs.value, {
  keys: [
    { name: 'custom_title', weight: 2 },
    { name: 'song.title', weight: 2 },
    { name: 'song.artists.name', weight: 1 },
  ],
  includeMatches: true,
  threshold: 0.3,
  minMatchCharLength: 2,
  ignoreLocation: true,
}))

const searchResult = computed(() => {
  if (!searchQuery.value.trim()) return { songs: songs.value, matchMap: new Map<string, FuseResultMatch[]>() }
  const results = fuseInstance.value.search(searchQuery.value)
  const matchMap = new Map<string, FuseResultMatch[]>()
  const filtered = results.map(r => {
    matchMap.set(r.item.id, (r.matches as FuseResultMatch[]) ?? [])
    return r.item
  })
  return { songs: filtered, matchMap }
})

const matchMap = computed(() => searchResult.value.matchMap)

const displayedSongs = computed(() =>
  [...searchResult.value.songs].sort((a, b) => {
    const titleA = (a.custom_title || a.song.title).toLowerCase()
    const titleB = (b.custom_title || b.song.title).toLowerCase()
    return titleA.localeCompare(titleB)
  })
)

function openDrawer(song: LibrarySongWithDetails) {
  drawerStore.push(PublicLyricDrawer, { song })
}
</script>
