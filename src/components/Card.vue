<template>
  <div
    class="bg-gray-800 rounded-lg border transition-colors flex items-stretch"
    :class="{
      'border-blue-500 bg-gray-700': id && uiStore.selectionMode && isSelected,
      'border-gray-700 hover:border-gray-600': !(id && uiStore.selectionMode && isSelected),
      'cursor-pointer': true,
    }"
  >
    <!-- Main clickable area -->
    <div class="flex-1 p-4 min-w-0" @click="handleClick">
      <div class="flex items-start gap-3">
        <!-- Checkbox (Selection Mode) -->
        <div v-if="id && uiStore.selectionMode" class="flex-shrink-0 pt-1">
          <div
            class="w-5 h-5 rounded border-2 flex items-center justify-center"
            :class="isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-400'"
          >
            <svg v-if="isSelected" class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <!-- Title -->
          <h3 class="text-lg font-semibold text-white mb-1 truncate">
            <template v-if="effectiveTitleSegments && effectiveTitleSegments.length > 0">
              <template v-for="seg in effectiveTitleSegments" :key="seg.text + seg.highlighted">
                <mark v-if="seg.highlighted" class="bg-yellow-400/30 text-yellow-200 rounded-sm not-italic">{{ seg.text }}</mark>
                <span v-else>{{ seg.text }}</span>
              </template>
            </template>
            <template v-else>{{ title }}</template>
          </h3>

          <!-- Text -->
          <p v-if="text || (effectiveTextSegments && effectiveTextSegments.length > 0)" class="text-gray-400 text-sm mb-2 truncate">
            <template v-if="effectiveTextSegments && effectiveTextSegments.length > 0">
              <template v-for="seg in effectiveTextSegments" :key="seg.text + seg.highlighted">
                <mark v-if="seg.highlighted" class="bg-yellow-400/30 text-yellow-200 rounded-sm not-italic">{{ seg.text }}</mark>
                <span v-else>{{ seg.text }}</span>
              </template>
            </template>
            <template v-else>{{ text }}</template>
          </p>

          <!-- Tags -->
          <div v-if="tags && tags.length > 0" class="flex flex-wrap gap-2 mb-2">
            <span
              v-for="tag in tags"
              :key="tag.id"
              class="inline-flex items-center px-2 py-1 bg-blue-900/30 border border-blue-700 rounded text-blue-400 text-xs"
            >
              <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
              </svg>
              {{ tag.name }}
            </span>
          </div>

          <!-- Lists -->
          <div v-if="lists && lists.length > 0" class="flex flex-wrap gap-2">
            <span
              v-for="list in lists"
              :key="list.id"
              class="inline-flex items-center px-2 py-1 bg-green-900/30 border border-green-700 rounded text-green-400 text-xs"
            >
              <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
              </svg>
              {{ list.name }}
            </span>
          </div>
        </div>

        <!-- Dropdown -->
        <DropdownMenu
          v-if="dropdownItems && dropdownItems.length > 0 && !(id && uiStore.selectionMode)"
          :items="dropdownItems"
        />
      </div>
    </div>

    <!-- Drag handle zone -->
    <div
      v-if="draggable && !(id && uiStore.selectionMode)"
      class="drag-handle w-10 flex-shrink-0 border-l border-gray-700/50 bg-gray-900/30 flex items-center justify-center"
      @click.stop
    >
      <svg class="w-2.5 h-5 text-gray-600" viewBox="0 0 10 20" fill="currentColor" aria-hidden="true">
        <circle cx="3" cy="4" r="1.5"/>
        <circle cx="7" cy="4" r="1.5"/>
        <circle cx="3" cy="10" r="1.5"/>
        <circle cx="7" cy="10" r="1.5"/>
        <circle cx="3" cy="16" r="1.5"/>
        <circle cx="7" cy="16" r="1.5"/>
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TextSegment } from '@/utils/highlight'
import { getSegmentsFromQuery } from '@/utils/highlight'
import type { DropdownMenuItem } from '@/components/DropdownMenu.vue'
import DropdownMenu from '@/components/DropdownMenu.vue'
import { useUiStore } from '@/stores/ui'

const props = defineProps<{
  title: string
  titleSegments?: TextSegment[]
  text?: string
  textSegments?: TextSegment[]
  highlightText?: string
  tags?: { id: string; name: string }[]
  lists?: { id: string; name: string }[]
  dropdownItems?: DropdownMenuItem[]
  id?: string
  draggable?: boolean
}>()

const effectiveTitleSegments = computed<TextSegment[] | undefined>(() => {
  if (props.titleSegments?.length) return props.titleSegments
  if (props.highlightText && props.title) return getSegmentsFromQuery(props.title, props.highlightText)
  return undefined
})

const effectiveTextSegments = computed<TextSegment[] | undefined>(() => {
  if (props.textSegments?.length) return props.textSegments
  if (props.highlightText && props.text) return getSegmentsFromQuery(props.text, props.highlightText)
  return undefined
})

const emit = defineEmits<{
  click: []
}>()

const uiStore = useUiStore()
const isSelected = computed(() => props.id ? uiStore.isSelected(props.id) : false)

function handleClick() {
  if (props.id && uiStore.selectionMode) {
    uiStore.toggleSelection(props.id)
  } else {
    emit('click')
  }
}
</script>
