import { supabase } from '@/lib/supabase'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

export async function getSession() {
  return supabase.auth.getSession()
}

export function subscribeToAuthChanges(
  callback: (event: AuthChangeEvent, session: Session | null) => void | Promise<void>
) {
  return supabase.auth.onAuthStateChange(callback)
}

export async function signUp(email: string, password: string) {
  return supabase.auth.signUp({ email, password })
}

export async function signInWithPassword(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signInWithOAuth(provider: 'google' | 'facebook') {
  return supabase.auth.signInWithOAuth({ provider })
}

export async function signOut() {
  return supabase.auth.signOut()
}
