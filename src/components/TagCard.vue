<template>
  <div 
    class="bg-gray-800 rounded-lg p-4 border border-gray-700 cursor-pointer hover:border-blue-500 transition-colors"
    @click="handleCardClick"
  >
    <div class="flex items-start justify-between gap-3">
      <!-- Tag Info -->
      <div class="flex-1 min-w-0">
        <!-- Tag Name -->
        <h3 class="text-lg font-semibold text-white mb-1 truncate flex items-center gap-2">
          <svg class="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
          </svg>
          {{ tag.name }}
        </h3>

        <!-- Song Count -->
        <p class="text-gray-400 text-sm ml-7">
          {{ I18N.PLURALS.SONG_COUNT(songCount) }}
        </p>
      </div>

      <DropdownMenu :items="dropdownItems" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { Tag } from '@/types/database'
import { supabase } from '@/lib/supabase'
import { I18N } from '@/constants/i18n'
import { ROUTES } from '@/constants/routes'
import DropdownMenu from '@/components/DropdownMenu.vue'

const router = useRouter()

const props = defineProps<{
  tag: Tag
}>()

const emit = defineEmits<{
  rename: [tag: Tag]
  delete: [tag: Tag]
}>()

const songCount = ref(0)

const dropdownItems = [
  { label: I18N.DROPDOWN.RENAME, callback: () => emit('rename', props.tag) },
  { label: I18N.DROPDOWN.DELETE, variant: 'danger' as const, callback: () => emit('delete', props.tag) },
]

onMounted(async () => {
  // Load song count for this tag (V2: library_song_tags)
  const { count } = await supabase
    .from('library_song_tags')
    .select('*', { count: 'exact', head: true })
    .eq('tag_id', props.tag.id)
  
  songCount.value = count || 0
})

function handleCardClick() {
  router.push({
    path: ROUTES.LIBRARY,
    query: {
      tag: props.tag.id,
      tagName: props.tag.name
    }
  })
}
</script>
