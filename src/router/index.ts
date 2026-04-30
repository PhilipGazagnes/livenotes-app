import { createRouter, createWebHistory } from 'vue-router'
import { ROUTES } from '@/constants/routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: ROUTES.LOGIN,
      name: 'Login',
      component: () => import('@/pages/LoginPage.vue'),
      meta: { public: true }
    },
    {
      path: ROUTES.SIGNUP,
      name: 'Signup',
      component: () => import('@/pages/SignupPage.vue'),
      meta: { public: true }
    },
    {
      path: ROUTES.LIBRARY,
      name: 'Library',
      component: () => import('@/pages/LibraryPage.vue'),
    },
    {
      path: ROUTES.SONG_NEW,
      name: 'SongNew',
      component: () => import('@/pages/SongNewPage.vue'),
    },
    {
      path: '/song/:id/edit',
      name: 'SongEdit',
      component: () => import('@/pages/SongEditPage.vue'),
    },
    {
      path: ROUTES.LISTS,
      name: 'Lists',
      component: () => import('@/pages/ListsPage.vue'),
    },
    {
      path: '/lists/:id',
      name: 'ListDetail',
      component: () => import('@/pages/ListDetailPage.vue'),
    },
    {
      path: ROUTES.TAGS,
      name: 'Tags',
      component: () => import('@/pages/TagsPage.vue'),
    },
    {
      path: ROUTES.ARTISTS,
      name: 'Artists',
      component: () => import('@/pages/ArtistsPage.vue'),
    },
    {
      path: ROUTES.SETTINGS,
      name: 'Settings',
      component: () => import('@/pages/SettingsPage.vue'),
    },
  ],
})

// Auth guard - redirect to login if not authenticated
router.beforeEach(async (to, _from, next) => {
  const { useAuthStore } = await import('@/stores/auth')
  const { useUiStore } = await import('@/stores/ui')
  const authStore = useAuthStore()
  const uiStore = useUiStore()
  
  // Show loading overlay for non-public routes
  if (!to.meta.public) {
    uiStore.showOperationOverlay('Loading...')
  }
  
  // Exit selection mode on navigation
  if (uiStore.selectionMode) {
    uiStore.exitSelectionMode()
  }
  
  // Wait for auth to initialize before checking authentication
  if (!authStore.isInitialized) {
    await authStore.initialize()
  }
  
  const isPublic = to.meta.public
  const isAuthenticated = authStore.isAuthenticated
  
  if (!isPublic && !isAuthenticated) {
    uiStore.hideOperationOverlay()
    next(ROUTES.LOGIN)
  } else if (isPublic && isAuthenticated) {
    uiStore.hideOperationOverlay()
    next(ROUTES.LIBRARY)
  } else {
    next()
  }
})

// Hide loading overlay after navigation completes
router.afterEach(async () => {
  const { useUiStore } = await import('@/stores/ui')
  const uiStore = useUiStore()
  uiStore.hideOperationOverlay()
})

export default router
