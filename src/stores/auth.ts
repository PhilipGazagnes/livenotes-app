import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import * as authService from '@/services/authService'
import {
  createPersonalProject,
  fetchPersonalProjects,
  countProjectSongs,
} from '@/services/projectService'

const PERSONAL_PROJECT_KEY = 'livenotes-project-id'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<SupabaseUser | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const isInitialized = ref(false)
  const personalProjectId = ref<string | null>(null)
  let initPromise: Promise<void> | null = null

  // Getters
  const isAuthenticated = computed(() => !!user.value)
  const userId = computed(() => user.value?.id ?? null)

  async function _createPersonalProject() {
    if (!user.value) return
    try {
      personalProjectId.value = await createPersonalProject(user.value.id)
    } catch (err) {
      console.error('Failed to create personal project:', err)
    }
  }

  async function _loadPersonalProject() {
    if (!user.value) return

    // Use cached project ID immediately so offline startup never hangs waiting
    // for a network call. Then refresh the value in the background while online.
    const cached = localStorage.getItem(PERSONAL_PROJECT_KEY)
    if (cached) {
      personalProjectId.value = cached
      _refreshPersonalProject().catch(() => {})
      return
    }

    // No cached value yet — first time, must be online.
    await _refreshPersonalProject()
  }

  async function _refreshPersonalProject() {
    if (!user.value) return

    try {
      const projects = await fetchPersonalProjects(user.value.id)

      if (!projects || projects.length === 0) {
        await _createPersonalProject()
        return
      }

      let projectWithMostSongs = projects[0]
      let maxSongCount = 0

      for (const project of projects.slice(0, 10)) {
        const count = await countProjectSongs(project.id)
        if (count > maxSongCount) {
          maxSongCount = count
          projectWithMostSongs = project
        }
      }

      personalProjectId.value = projectWithMostSongs.id
      localStorage.setItem(PERSONAL_PROJECT_KEY, personalProjectId.value)
    } catch (err) {
      console.error('Failed to refresh personal project:', err)
    }
  }

  // Actions
  async function initialize() {
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
            await _loadPersonalProject()
          } else {
            personalProjectId.value = null
          }
        })

        if (session?.user) {
          await _loadPersonalProject()
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

  async function signup(email: string, password: string) {
    isLoading.value = true
    error.value = null

    try {
      const { data, error: signupError } = await authService.signUp(email, password)
      if (signupError) throw signupError

      user.value = data.user

      if (user.value) {
        await _createPersonalProject()
      }

      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Signup failed'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function login(email: string, password: string) {
    isLoading.value = true
    error.value = null

    try {
      const { data, error: loginError } = await authService.signInWithPassword(email, password)
      if (loginError) throw loginError

      user.value = data.user

      if (user.value) {
        await _loadPersonalProject()
      }

      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Login failed'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function loginWithOAuth(provider: 'google' | 'facebook') {
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

  async function logout() {
    isLoading.value = true
    error.value = null

    try {
      const { error: logoutError } = await authService.signOut()
      if (logoutError) throw logoutError

      user.value = null
      personalProjectId.value = null
      localStorage.removeItem(PERSONAL_PROJECT_KEY)

      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Logout failed'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function getPersonalProjectId(): Promise<string | null> {
    if (!isInitialized.value) {
      await initialize()
    }

    if (personalProjectId.value) {
      return personalProjectId.value
    }

    await _loadPersonalProject()
    return personalProjectId.value
  }

  return {
    // State
    user,
    isLoading,
    error,
    isInitialized,
    personalProjectId,
    // Getters
    isAuthenticated,
    userId,
    // Actions
    initialize,
    signup,
    login,
    loginWithOAuth,
    logout,
    getPersonalProjectId,
  }
})
