import { defineStore } from 'pinia'
import { ref, reactive, markRaw } from 'vue'
import type { Component } from 'vue'

export interface DrawerLayer {
  id: string
  component: Component
  props: Record<string, unknown>
}

export const useDrawerStore = defineStore('drawer', () => {
  const stack = ref<DrawerLayer[]>([])
  let suppressPopstate = 0

  function push(component: Component, initialProps: Record<string, unknown> = {}): Record<string, unknown> {
    const id = `drawer-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const props = reactive(initialProps)
    stack.value.push({ id, component: markRaw(component), props })
    history.pushState({ drawerId: id }, '')
    return props
  }

  function pop() {
    if (stack.value.length === 0) return
    stack.value.pop()
    suppressPopstate++
    history.back()
  }

  function popAll() {
    const count = stack.value.length
    if (count === 0) return
    stack.value = []
    suppressPopstate += count
    history.go(-count)
  }

  function handlePopstate() {
    if (suppressPopstate > 0) {
      suppressPopstate--
      return
    }
    if (stack.value.length > 0) {
      stack.value.pop()
    }
  }

  return { stack, push, pop, popAll, handlePopstate }
})
