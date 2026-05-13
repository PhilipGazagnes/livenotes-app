<template>
  <div class="sticky top-0 z-10 py-1.5 bg-gray-900">
    <div v-if="beforeSegs.length" class="flex flex-wrap font-mono text-[11px] leading-snug mb-0.5">
      <span v-for="(seg, i) in beforeSegs" :key="i" :class="seg.hi ? 'text-violet-500 font-bold' : seg.sep ? 'text-gray-700' : 'text-gray-500'">{{ seg.t }}</span>
    </div>

    <div class="flex items-center font-mono text-[13px] leading-snug flex-wrap">
      <span v-if="repeat > 1" class="text-violet-500 font-bold mr-0.5">[</span>
      <span
        v-if="cutStartVal !== null"
        class="inline-block bg-black text-yellow-400 text-[10px] font-bold leading-none px-1 py-0.5 rounded mr-1"
      >{{ cutStartVal }}</span>
      <span v-for="(seg, i) in mainSegs" :key="i" :class="seg.hi ? 'text-violet-500 font-bold' : seg.sep ? 'text-gray-600' : 'text-gray-300'">{{ seg.t }}</span>
      <span
        v-if="cutEndVal !== null"
        class="inline-block bg-black text-yellow-400 text-[10px] font-bold leading-none px-1 py-0.5 rounded ml-1"
      >{{ cutEndVal }}</span>
      <span v-if="repeat > 1" class="text-violet-500 font-bold ml-0.5">]{{ repeat }}</span>
    </div>

    <div v-if="afterSegs.length" class="flex flex-wrap font-mono text-[11px] leading-snug mt-0.5">
      <span v-for="(seg, i) in afterSegs" :key="i" :class="seg.hi ? 'text-violet-500 font-bold' : seg.sep ? 'text-gray-700' : 'text-gray-500'">{{ seg.t }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type Chord = [string, string]
type PatternToken = Chord[] | (Chord | string)[] | string

interface Seg { t: string; hi?: true; sep?: true }

const props = withDefaults(defineProps<{
  mainJson: PatternToken[] | null
  beforeJson?: PatternToken[] | null
  afterJson?: PatternToken[] | null
  repeat?: number
  cutStart?: number[] | null
  cutEnd?: number[] | null
}>(), {
  repeat: 1,
  beforeJson: null,
  afterJson: null,
  cutStart: null,
  cutEnd: null,
})

const cutStartVal = computed(() => props.cutStart?.[0] ?? null)
const cutEndVal = computed(() => props.cutEnd?.[0] ?? null)

const mainSegs = computed(() => props.mainJson ? renderSegs(props.mainJson) : [])
const beforeSegs = computed(() => props.beforeJson ? renderSegs(props.beforeJson) : [])
const afterSegs = computed(() => props.afterJson ? renderSegs(props.afterJson) : [])

function renderSegs(items: PatternToken[]): Seg[] {
  const segs: Seg[] = []
  let needSep = false

  function sep() {
    if (needSep) segs.push({ t: ' | ', sep: true })
  }

  let i = 0
  while (i < items.length) {
    const item = items[i]
    if (typeof item === 'string') {
      if (item === 'loopStart') {
        const inner: PatternToken[] = []
        i++
        while (i < items.length) {
          const t = items[i]
          if (typeof t === 'string' && t.startsWith('loopEnd:')) break
          inner.push(t as PatternToken)
          i++
        }
        const rep = i < items.length
          ? parseInt((items[i] as string).split(':')[1] ?? '2')
          : 2
        sep()
        segs.push({ t: '[', hi: true })
        segs.push(...renderSegs(inner))
        segs.push({ t: `]${rep}`, hi: true })
        needSep = true
      }
      // 'newLine' and others: ignore
    } else if (Array.isArray(item)) {
      const chords = (item as (Chord | string)[])
        .map(c => typeof c === 'string' ? c : c[0] + c[1])
        .join(' ')
      if (chords) {
        sep()
        segs.push({ t: chords })
        needSep = true
      }
    }
    i++
  }
  return segs
}
</script>
