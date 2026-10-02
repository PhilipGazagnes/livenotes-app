<template>
  <div
    :style="{ width: size + 'px', height: size + 'px' }"
    class="rounded-full overflow-hidden shrink-0 flex items-center justify-center"
  >
    <img
      v-if="thumbnailUrl"
      :src="thumbnailUrl"
      :alt="name"
      class="w-full h-full object-cover"
    />
    <div
      v-else
      class="w-full h-full flex items-center justify-center font-bold text-white"
      :style="{ backgroundColor: bgColor, fontSize: fontSize + 'px' }"
    >
      {{ initials }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  name: string
  thumbnailUrl: string | null
  size?: number
  color?: string
}>(), {
  size: 32,
  color: '',
})

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#3b82f6',
]

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) & 0xffffffff
  }
  return Math.abs(hash)
}

const bgColor = computed(() =>
  props.color || COLORS[hashString(props.name) % COLORS.length]
)

const initials = computed(() => {
  const words = props.name.trim().split(/\s+/)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
})

const fontSize = computed(() => Math.round(props.size * 0.38))
</script>
