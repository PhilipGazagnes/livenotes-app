import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { isAuthRetryableFetchError, type User as SupabaseUser } from '@supabase/supabase-js'
import { NetworkTimeoutError, withNetworkTimeout } from '@livenotes/shared/offline'
import type { Profile, Project } from '@livenotes/shared/types'
import * as authService from '@/services/authService'
import { fetchProfile, updateProfile } from '@/services/profileService'
import { fetchProjectById, fetchCommunityProject } from '@/services/projectService'
import { fetchUserRoleInProject } from '@/services/membershipService'
import { logger } from '@/utils/logger'
import type { ProjectRole } from '@livenotes/shared/types'
import {
  autoSyncIfStale,
  clearOfflineData,
  setAutoSyncPolicy,
  setOfflineActiveProject,
  setOfflineUser,
} from '@/lib/offline/offlineData'
import { forceOffline, isOfflineMode } from '@/lib/offline/offlineState'
import { useOnline } from '@vueuse/core'
import { forgetOfflineUser, readOfflineUser, rememberOfflineUser } from '@/lib/offline/offlineUser'

const ACTIVE_PROJECT_CACHE_KEY = 'livenotes-project-id'
const COMMUNITY_PROJECT_SLUG = 'community'

// How long startup waits for Supabase to restore the session before falling
// back to the remembered user (an expired token cannot be refreshed offline).
const SESSION_TIMEOUT_OFFLINE_MS = 1_500
const SESSION_TIMEOUT_ONLINE_MS = 8_000

type SessionUserResult = { user: SupabaseUser | null }

/**
 * Restore the signed-in user. When the session cannot be restored because the
 * network is unreachable, fall back to the remembered user so the app can
 * start offline and read its snapshot.
 */
async function resolveSessionUser(): Promise<SessionUserResult> {
  const offlineUser = readOfflineUser()
  const pending = authService.getSession()
  try {
    const { data: { session }, error } = offlineUser
      ? await withNetworkTimeout(pending, isOfflineMode() ? SESSION_TIMEOUT_OFFLINE_MS : SESSION_TIMEOUT_ONLINE_MS)
      : await pending
    if (session?.user) return { user: session.user }
    if (error && isAuthRetryableFetchError(error) && offlineUser) {
      logger.warn('Session refresh failed (network); starting with the remembered user')
      return { user: offlineUser }
    }
    if (error) throw error
    return { user: null }
  } catch (err) {
    if (err instanceof NetworkTimeoutError && offlineUser) {
      logger.warn('Session restore timed out; starting with the remembered user')
      return { user: offlineUser }
    }
    throw err
  }
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<SupabaseUser | null>(null)
  const profile = ref<Profile | null>(null)
  const activeProject = ref<Project | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const isInitialized = ref(false)
  const activeProjectId = ref<string | null>(null)
  const activeProjectRole = ref<ProjectRole | null>(null)
  let initPromise: Promise<void> | null = null

  // Getters
  const isAuthenticated = computed(() => !!user.value)
  const userId = computed(() => user.value?.id ?? null)
  const displayName = computed(() => profile.value?.display_name ?? user.value?.email ?? '')
  // Offline the app is read-only: hiding edit controls is driven by isEditor
  const browserOnline = useOnline()
  const isOnline = computed(() => browserOnline.value && !forceOffline.value)
  const isEditor = computed(() =>
    isOnline.value &&
    (activeProjectRole.value === 'editor' || activeProjectRole.value === 'administrator')
  )
  const isAdmin = computed(() => activeProjectRole.value === 'administrator')

  // Offline data layer follows the signed-in user and active project.
  // 'sync' so reads issued right after the change already use the right snapshot.
  watch(userId, id => setOfflineUser(id), { flush: 'sync', immediate: true })
  watch(activeProjectId, id => setOfflineActiveProject(id), { flush: 'sync', immediate: true })

  function setSignedInUser(sessionUser: SupabaseUser): void {
    user.value = sessionUser
    rememberOfflineUser(sessionUser)
  }

  // Automatic syncs never download the shared community project, and wait
  // until the active project is known
  setAutoSyncPolicy(() => !!activeProject.value && activeProject.value.slug !== COMMUNITY_PROJECT_SLUG)

  /** Keep the active project's offline snapshot fresh. */
  function startBackgroundSync(): void {
    autoSyncIfStale().catch(err => logger.warn('Background sync failed', err))
  }

  async function _loadProfile(): Promise<void> {
    if (!user.value) return

    // Use cached active project ID immediately for offline startup,
    // then refresh the full profile in the background.
    const cached = localStorage.getItem(ACTIVE_PROJECT_CACHE_KEY)
    if (cached) {
      activeProjectId.value = cached
      Promise.all([
        fetchProjectById(cached).then(p => { activeProject.value = p }),
        fetchUserRoleInProject(cached, user.value.id).then(r => { activeProjectRole.value = r }),
      ]).catch(err => logger.warn('Failed to load cached project', err))
      _refreshProfile()
        .catch(err => logger.warn('Failed to refresh profile', err))
        .finally(startBackgroundSync)
      return
    }

    await _refreshProfile()
    startBackgroundSync()
  }

  async function _refreshProfile(): Promise<void> {
    if (!user.value) return
    try {
      const data = await fetchProfile(user.value.id)
      if (data) {
        profile.value = data
        activeProjectId.value = data.active_project_id
        if (data.active_project_id) {
          localStorage.setItem(ACTIVE_PROJECT_CACHE_KEY, data.active_project_id)
          const [project, role] = await Promise.all([
            fetchProjectById(data.active_project_id),
            fetchUserRoleInProject(data.active_project_id, user.value.id),
          ])
          activeProject.value = project
          activeProjectRole.value = role
        } else {
          // No active project set — fall back to the community project
          const community = await fetchCommunityProject()
          if (community) {
            await setActiveProject(community.id)
          } else {
            localStorage.removeItem(ACTIVE_PROJECT_CACHE_KEY)
            activeProject.value = null
            activeProjectRole.value = null
          }
        }
      }
    } catch (err) {
      logger.error('Failed to refresh profile:', err)
    }
  }

  async function setActiveProject(projectId: string): Promise<void> {
    if (!user.value) return
    activeProjectId.value = projectId
    localStorage.setItem(ACTIVE_PROJECT_CACHE_KEY, projectId)
    if (profile.value) {
      profile.value = { ...profile.value, active_project_id: projectId }
    }
    // Load new project details, role, and persist in parallel
    const [project, role] = await Promise.all([
      fetchProjectById(projectId),
      fetchUserRoleInProject(projectId, user.value.id),
      updateProfile(user.value.id, { active_project_id: projectId }),
    ])
    activeProject.value = project
    activeProjectRole.value = role
    startBackgroundSync()
  }

  // Actions
  async function initialize(): Promise<void> {
    if (initPromise) return initPromise
    if (isInitialized.value) return

    isLoading.value = true

    initPromise = (async () => {
      try {
        const { user: sessionUser } = await resolveSessionUser()
        if (sessionUser) setSignedInUser(sessionUser)

        authService.subscribeToAuthChanges(async (event, session) => {
          if (session?.user) {
            setSignedInUser(session.user)
            await _loadProfile()
            return
          }
          // Offline, the initial session can be missing only because the token
          // could not be refreshed: keep the remembered user.
          if (event === 'INITIAL_SESSION' && user.value) return
          user.value = null
          profile.value = null
          activeProjectId.value = null
          activeProjectRole.value = null
          if (event === 'SIGNED_OUT') {
            forgetOfflineUser()
            await clearOfflineData()
          }
        })

        if (sessionUser) {
          await _loadProfile()
        }

        isInitialized.value = true
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to initialize auth'
      } finally {
        isLoading.value = false
      }
    })()

    await initPromise
    return initPromise
  }

  async function signup(email: string, password: string): Promise<{ success: boolean; requiresEmailConfirmation?: boolean; error?: string }> {
    isLoading.value = true
    error.value = null

    try {
      const { data, error: signupError } = await authService.signUp(email, password)
      if (signupError) throw signupError

      const requiresEmailConfirmation = data.session === null
      if (!requiresEmailConfirmation && data.user) {
        setSignedInUser(data.user)
      }
      // Profile is auto-created by the DB trigger; no project is set on signup.

      return { success: true, requiresEmailConfirmation }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Signup failed'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    isLoading.value = true
    error.value = null

    try {
      const { data, error: loginError } = await authService.signInWithPassword(email, password)
      if (loginError) throw loginError

      if (data.user) {
        setSignedInUser(data.user)
        await _loadProfile()
      }

      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Login failed'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function loginWithOAuth(provider: 'google' | 'facebook'): Promise<{ success: boolean; error?: string }> {
    isLoading.value = true
    error.value = null

    try {
      const { error: oauthError } = await authService.signInWithOAuth(provider)
      if (oauthError) throw oauthError

      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'OAuth login failed'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function logout(): Promise<{ success: boolean; error?: string }> {
    isLoading.value = true
    error.value = null

    try {
      const { error: logoutError } = await authService.signOut()
      if (logoutError) throw logoutError

      user.value = null
      profile.value = null
      activeProject.value = null
      activeProjectId.value = null
      activeProjectRole.value = null
      localStorage.removeItem(ACTIVE_PROJECT_CACHE_KEY)
      forgetOfflineUser()
      await clearOfflineData()

      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Logout failed'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  return {
    // State
    user,
    profile,
    activeProject,
    isLoading,
    error,
    isInitialized,
    activeProjectId,
    activeProjectRole,
    // Getters
    isAuthenticated,
    userId,
    displayName,
    isEditor,
    isAdmin,
    // Actions
    initialize,
    signup,
    login,
    loginWithOAuth,
    logout,
    setActiveProject,
  }
})
