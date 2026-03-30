<script setup lang="ts">
import { IonApp } from '@ionic/vue'
import HamburgerMenu from '@/components/HamburgerMenu.vue'
import ToastNotification from '@/components/ToastNotification.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
</script>

<template>
  <ion-app>
    <router-view />
    
    <!-- Global Components -->
    <HamburgerMenu />
    <ToastNotification />
    <ConfirmDialog />
  </ion-app>
</template>

