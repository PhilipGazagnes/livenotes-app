<template>
  <div class="bg-gray-900 rounded-lg p-4 border border-gray-800 hover:border-gray-700 transition-colors">
    <!-- Header -->
    <div class="flex items-start justify-between mb-3">
      <div class="flex-1 min-w-0">
        <h4 class="text-white font-medium truncate">{{ note.title }}</h4>
        <p class="text-xs text-gray-500 mt-1">
          Updated {{ formatDate(note.updated_at) }}
        </p>
      </div>
      
      <div class="flex items-center gap-2 ml-3">
        <button
          @click="$emit('edit', note)"
          class="p-2 text-gray-400 hover:text-blue-400 transition-colors"
          title="Edit note"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        
        <button
          @click="$emit('delete', note)"
          class="p-2 text-gray-400 hover:text-red-400 transition-colors"
          title="Delete note"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Content Preview -->
    <div class="text-gray-300 text-sm">
      <!-- SongCode: show formatted preview -->
      <div v-if="note.type === 'songcode'" class="bg-black/30 rounded p-3 font-mono text-xs overflow-x-auto">
        <pre class="whitespace-pre-wrap">{{ contentPreview }}</pre>
      </div>

      <!-- Tablature: show formatted preview -->
      <div v-else-if="note.type === 'tablature'" class="bg-black/30 rounded p-3 font-mono text-xs overflow-x-auto">
        <pre class="whitespace-pre-wrap">{{ contentPreview }}</pre>
      </div>

      <!-- URL-based types: show link -->
      <div v-else-if="isUrlType" class="flex items-center gap-2">
        <svg class="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        <a 
          :href="note.content ?? undefined"
          target="_blank" 
          rel="noopener noreferrer"
          class="text-blue-400 hover:text-blue-300 truncate"
        >
          {{ note.content }}
        </a>
      </div>

      <!-- Text-based content: show preview -->
      <p v-else class="line-clamp-3">
        {{ contentPreview }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Note } from '@/types/database'

interface Props {
  note: Note
}

const props = defineProps<Props>()

defineEmits<{
  edit: [note: Note]
  delete: [note: Note]
}>()

// Computed
const isUrlType = computed(() => {
  return ['youtube', 'image', 'video', 'audio'].includes(props.note.type)
})

const contentPreview = computed(() => {
  if (!props.note.content) return ''
  
  // For formatted types, limit to first 10 lines
  if (['songcode', 'tablature'].includes(props.note.type)) {
    const lines = props.note.content.split('\n').slice(0, 10)
    if (props.note.content.split('\n').length > 10) {
      lines.push('...')
    }
    return lines.join('\n')
  }
  
  // For other text types, limit to 200 characters
  if (props.note.content.length > 200) {
    return props.note.content.substring(0, 200) + '...'
  }
  
  return props.note.content
})

// Methods
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}
</script>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
