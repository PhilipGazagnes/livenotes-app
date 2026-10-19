import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import { logWebVitals } from './utils/performance'
import { useAuthStore } from './stores/auth'
import { initProjectStatusChecks } from './lib/offline/projectStatus'
import { registerAppUpdates } from './lib/appUpdates'

import './style.css'

registerAppUpdates()
initProjectStatusChecks()

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Enable performance monitoring in development
if (import.meta.env.DEV) {
  logWebVitals()
  
  // Vue DevTools performance tracking
  app.config.performance = true
}

// Initialize auth and wait for router to be ready
router.isReady().then(async () => {
  const authStore = useAuthStore()
  await authStore.initialize()
  
  app.mount('#app')
})
