import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { IonicVue } from '@ionic/vue'
import router from './router'
import App from './App.vue'
import { logWebVitals } from './utils/performance'

// Import Ionic core CSS FIRST (required for Ionic components)
import '@ionic/vue/css/core.css'
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'

// Import Tailwind CSS LAST so it can override Ionic defaults
import './style.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(IonicVue, {
  mode: 'md' // Use Material Design mode for consistent styling
})
app.use(router)

// Enable performance monitoring in development
if (import.meta.env.DEV) {
  logWebVitals()
  
  // Vue DevTools performance tracking
  app.config.performance = true
}

// Initialize auth and wait for router to be ready
router.isReady().then(async () => {
  const { useAuthStore } = await import('./stores/auth')
  const authStore = useAuthStore()
  await authStore.initialize()
  
  app.mount('#app')
})
