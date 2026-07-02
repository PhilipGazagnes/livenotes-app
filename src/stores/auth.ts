import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { Profile, Project } from '@/types/database'
import * as authService from '@/services/authService'
import { fetchProfile, updateProfile } from '@/services/profileService'
import { fetchProjectById, fetchCommunityProject } from '@/services/projectService'
import { fetchUserRoleInProject } from '@/services/membershipService'
import { logger } from '@/utils/logger'
import type { ProjectRole } from '@/types/database'

const ACTIVE_PROJECT_CACHE_KEY = 'livenotes-project-id'

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
  const isEditor = computed(() =>
    activeProjectRole.value === 'editor' || activeProjectRole.value === 'administrator'
  )
  const isAdmin = computed(() => activeProjectRole.value === 'administrator')

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
      ]).catch(() => {})
      _refreshProfile().catch(() => {})
      return
    }

    await _refreshProfile()
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
  }

  // Actions
  async function initialize(): Promise<void> {
    if (initPromise) return initPromise
    if (isInitialized.value) return

    isLoading.value = true

    initPromise = (async () => {
      try {
        const { data: { session }, error: sessionError } = await authService.getSession()
        if (sessionError) throw sessionError

        if (session?.user) {
          user.value = session.user
        }

        authService.subscribeToAuthChanges(async (_event, session) => {
          user.value = session?.user ?? null
          if (session?.user) {
            await _loadProfile()
          } else {
            profile.value = null
            activeProjectId.value = null
            activeProjectRole.value = null
          }
        })

        if (session?.user) {
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
      if (!requiresEmailConfirmation) {
        user.value = data.user
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

      user.value = data.user

      if (user.value) {
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
