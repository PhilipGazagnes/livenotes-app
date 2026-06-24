import { createRouter, createWebHistory } from 'vue-router'
import { ROUTES } from '@/constants/routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: ROUTES.LIBRARY,
    },
    {
      path: ROUTES.LOGIN,
      name: 'Login',
      component: () => import('@/pages/authentication/LoginPage.vue'),
      meta: { public: true, authRedirect: true }
    },
    {
      path: ROUTES.SIGNUP,
      name: 'Signup',
      component: () => import('@/pages/authentication/SignupPage.vue'),
      meta: { public: true, authRedirect: true }
    },
    {
      path: ROUTES.LIBRARY,
      name: 'Library',
      component: () => import('@/pages/authenticated/LibraryPage.vue'),
    },
    {
      path: ROUTES.LISTS,
      name: 'Lists',
      component: () => import('@/pages/authenticated/ListsPage.vue'),
    },
    {
      path: '/project/lists/:id',
      name: 'ListDetail',
      component: () => import('@/pages/authenticated/ListDetailPage.vue'),
    },
    {
      path: ROUTES.TAGS,
      name: 'Tags',
      component: () => import('@/pages/authenticated/TagsPage.vue'),
    },
    {
      path: ROUTES.ARTISTS,
      name: 'Artists',
      component: () => import('@/pages/authenticated/ArtistsPage.vue'),
    },
    {
      path: ROUTES.PUBLIC_LIBRARIES,
      name: 'PublicLibraries',
      component: () => import('@/pages/authenticated/PublicLibrariesPage.vue'),
      meta: { requiresAdmin: true },
    },
    // Public route — must be last to avoid shadowing /project/* paths
    {
      path: '/:projectSlug/:librarySlug',
      name: 'PublicLibrary',
      component: () => import('@/pages/public/PublicLibraryPage.vue'),
      meta: { public: true }
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
  
  // Exit selection mode on real page navigation (not drawer open/close, which reuses the same path)
  if (uiStore.selectionMode && to.path !== _from.path) {
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
  } else if (to.meta.authRedirect && isAuthenticated) {
    uiStore.hideOperationOverlay()
    const redirect = to.query.redirect as string | undefined
    next(redirect || ROUTES.LIBRARY)
  } else if (to.meta.requiresAdmin && !authStore.isAdmin) {
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
