<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { IonApp } from '@ionic/vue'
import { supabase } from '@/lib/supabase'
import HamburgerMenu from '@/components/HamburgerMenu.vue'
import ToastNotification from '@/components/ToastNotification.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import OperationOverlay from '@/components/OperationOverlay.vue'

// Supabase's internal auto-refresh timer can get stuck when the browser tab
// is backgrounded mid-refresh, causing all subsequent API calls to queue
// indefinitely. Explicitly stopping and restarting it on visibility change
// resets that state.
function handleVisibilityChange() {
  if (document.visibilityState === 'visible') {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
}

onMounted(() => {
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<template>
  <ion-app>
    <router-view />
    
    <!-- Global Components -->
    <HamburgerMenu />
    <ToastNotification />
    <ConfirmDialog />
    <OperationOverlay />
  </ion-app>
</template>

