import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '@/utils/supabase'

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

  // Helper function to create personal project
  async function createPersonalProject() {
    if (!user.value) return
    
    try {
      const { data, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: 'My Songs',
          type: 'personal',
          owner_id: user.value.id,
        })
        .select('id')
        .single()
      
      if (projectError) throw projectError
      
      if (data) {
        personalProjectId.value = data.id
      }
    } catch (err) {
      console.error('Failed to create personal project:', err)
    }
  }

  // Helper function to load personal project
  async function loadPersonalProject() {
    if (!user.value) {
      return
    }
    
    try {
      // Get all personal projects for this user with song counts
      const { data: projects, error: projectError } = await supabase
        .from('projects')
        .select('id, created_at')
        .eq('owner_id', user.value.id)
        .eq('type', 'personal')
        .order('created_at', { ascending: true })
      
      if (projectError) throw projectError
      
      if (!projects || projects.length === 0) {
        await createPersonalProject()
        return
      }
      
      // For each project, count how many songs it has
      let projectWithMostSongs = projects[0]
      let maxSongCount = 0
      
      for (const project of projects.slice(0, 10)) { // Check first 10 projects
        const { count } = await supabase
          .from('songs')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', project.id)
        
        if (count && count > maxSongCount) {
          maxSongCount = count
          projectWithMostSongs = project
        }
      }
      
      personalProjectId.value = projectWithMostSongs.id
    } catch (err) {
      console.error('Failed to load personal project:', err)
    }
  }

  // Actions
  async function initialize() {
    // Return existing promise if already initializing
    if (initPromise) return initPromise
    
    // Return immediately if already initialized
    if (isInitialized.value) return
    
    isLoading.value = true
    
    initPromise = (async () => {
      try {
        // Check for existing session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError
        
        if (session?.user) {
          user.value = session.user
        }

        // Listen to auth state changes
        supabase.auth.onAuthStateChange(async (_event, session) => {
          user.value = session?.user ?? null
          if (session?.user) {
            await loadPersonalProject()
          } else {
            personalProjectId.value = null
          }
        })
        
        // Load personal project if user is logged in
        if (session?.user) {
          await loadPersonalProject()
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
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
      })
      
      if (signupError) throw signupError
      
      user.value = data.user
      
      // Create personal project automatically after signup
      if (user.value) {
        await createPersonalProject()
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
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (loginError) throw loginError
      
      user.value = data.user
      
      // Load personal project after login
      if (user.value) {
        await loadPersonalProject()
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
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
      })
      
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
      const { error: logoutError } = await supabase.auth.signOut()
      if (logoutError) throw logoutError
      
      user.value = null
      personalProjectId.value = null
      
      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Logout failed'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function getPersonalProjectId(): Promise<string | null> {
    // Ensure auth is initialized
    if (!isInitialized.value) {
      await initialize()
    }
    
    if (personalProjectId.value) {
      return personalProjectId.value
    }
    
    await loadPersonalProject()
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
