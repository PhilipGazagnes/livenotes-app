<template>
  <Transition name="slide-down">
    <div
      v-if="!isOnline"
      class="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-orange-600 px-4 py-2 text-sm font-medium text-white"
      role="status"
    >
      <ion-icon name="cloud-offline-outline" class="text-base" />
      <span>Offline — showing cached data</span>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { useOnlineStatus } from '@/composables/useOnlineStatus'

const { isOnline } = useOnlineStatus()
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
