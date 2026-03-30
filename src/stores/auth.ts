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
  let initPromise: Promise<void> | null = null

  // Getters
  const isAuthenticated = computed(() => !!user.value)
  const userId = computed(() => user.value?.id ?? null)

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
        })
        
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
      
      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Logout failed'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function createPersonalProject() {
    if (!user.value) return
    
    try {
      const { error: projectError } = await supabase
        .from('projects')
        .insert({
          name: 'My Songs',
          type: 'personal',
          owner_id: user.value.id,
        })
      
      if (projectError) throw projectError
    } catch (err) {
      console.error('Failed to create personal project:', err)
    }
  }

  return {
    // State
    user,
    isLoading,
    error,
    isInitialized,
    // Getters
    isAuthenticated,
    userId,
    // Actions
    initialize,
    signup,
    login,
    loginWithOAuth,
    logout,
  }
})
