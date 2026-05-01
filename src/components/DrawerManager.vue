<template>
  <Teleport to="body">
    <!-- Single backdrop — fades in when first drawer opens, out when last closes -->
    <Transition name="drawer-fade">
      <div
        v-if="drawerStore.stack.length > 0"
        class="fixed inset-0 bg-black/50"
        style="z-index: 200"
        @click="drawerStore.pop()"
      />
    </Transition>

    <!-- Panels -->
    <TransitionGroup name="drawer-slide">
      <div
        v-for="(layer, index) in drawerStore.stack"
        :key="`panel-${layer.id}`"
        class="fixed top-0 right-0 h-full w-full md:w-[500px] bg-gray-900 shadow-2xl flex flex-col overflow-hidden"
        :style="{ zIndex: 201 + index * 10 }"
      >
        <component :is="layer.component" v-bind="layer.props" />
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useDrawerStore } from '@/stores/drawer'

const drawerStore = useDrawerStore()

function handlePopstate() {
  drawerStore.handlePopstate()
}

onMounted(() => {
  window.addEventListener('popstate', handlePopstate)
})

onUnmounted(() => {
  window.removeEventListener('popstate', handlePopstate)
})
</script>

<style scoped>
.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 0.2s ease;
}
.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}

.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform 0.3s ease;
}
.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateX(100%);
}
</style>
