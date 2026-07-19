/**
 * Thin auth service wrapper — all Supabase auth calls go through here.
 * If we ever migrate away from Supabase, only this file changes.
 */
import { supabase } from '../lib/supabase'
import { getAuthCallbackUrl } from '../utils/appUrl'
import { clearAuthRedirectParams, parseAuthRedirectError } from '../utils/authRedirect'
import { normalizeEmail } from '../utils/email'
import type { User, Session } from '@supabase/supabase-js'

export interface AuthUser {
  id:    string
  email: string
  name:  string | null
}

const toAuthUser = (user: User): AuthUser => ({
  id:    user.id,
  email: user.email || '',
  name:  user.user_metadata?.full_name || user.user_metadata?.name || null,
})

let cachedAccessToken: string | null = null
let redirectSessionPromise: Promise<{ session: Session | null; error: Error | null }> | null = null

function clearCodeFromUrl(): void {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  if (!url.searchParams.has('code')) return
  url.searchParams.delete('code')
  const cleaned = `${url.pathname}${url.search}${url.hash}`
  window.history.replaceState({}, document.title, cleaned || '/')
}

/** Wait for Supabase detectSessionInUrl to finish PKCE exchange (never call exchangeCodeForSession twice). */
async function waitForRedirectSession(): Promise<{ session: Session | null; error: Error | null }> {
  if (typeof window === 'undefined') {
    return { session: null, error: null }
  }

  const url = new URL(window.location.href)
  const hasCode = url.searchParams.has('code')

  if (!hasCode) {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error: error ?? null }
  }

  // Reuse in-flight wait when App + AuthCallbackPage both bootstrap on /auth/callback.
  if (redirectSessionPromise) return redirectSessionPromise

  redirectSessionPromise = new Promise((resolve) => {
    let settled = false
    const done = (session: Session | null, error: Error | null) => {
      if (settled) return
      settled = true
      redirectSessionPromise = null
      if (session) clearCodeFromUrl()
      resolve({ session, error })
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        subscription.unsubscribe()
        done(session, null)
      }
    })

    // detectSessionInUrl runs on client init; poll getSession as a fallback.
    const poll = async (attemptsLeft: number) => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (session) {
        subscription.unsubscribe()
        done(session, null)
        return
      }
      if (error) {
        subscription.unsubscribe()
        done(null, error)
        return
      }
      if (attemptsLeft <= 0) {
        subscription.unsubscribe()
        done(null, new Error('Sign-in could not be completed. Please try again.'))
        return
      }
      setTimeout(() => poll(attemptsLeft - 1), 250)
    }

    poll(32) // ~8s max
  })

  return redirectSessionPromise
}

export const authService = {
  /** Sign up with email + password */
  signUp: async (
    email: string,
    password: string,
    name?: string,
    metadata?: { lifeStage?: string; preferredLanguage?: string }
  ) => {
    const cleanEmail = normalizeEmail(email)
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        emailRedirectTo: getAuthCallbackUrl(),
        data: {
          full_name:          name,
          life_stage:         metadata?.lifeStage,
          preferred_language: metadata?.preferredLanguage,
        },
      },
    })
    cachedAccessToken = data.session?.access_token || null
    const isNewUser = (data.user?.identities?.length ?? 0) > 0
    return {
      user: data.user ? toAuthUser(data.user) : null,
      session: data.session,
      error,
      isNewUser,
    }
  },

  /** Sign in with email + password */
  signIn: async (email: string, password: string) => {
    const cleanEmail = normalizeEmail(email)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    })
    cachedAccessToken = data.session?.access_token || null
    return { user: data.user ? toAuthUser(data.user) : null, session: data.session, error }
  },

  /** Sign in / sign up with Google OAuth */
  signInWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getAuthCallbackUrl(),
        queryParams: {
          prompt: 'select_account',
        },
      },
    })
    return { data, error }
  },

  /** Sign out */
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    cachedAccessToken = null
    return { error }
  },

  /** Complete OAuth redirect — call on app boot and /auth/callback */
  completeAuthFromRedirect: async (): Promise<{
    session: Session | null
    user: AuthUser | null
    error: Error | null
    redirectError: string | null
  }> => {
    const redirectError = parseAuthRedirectError()
    if (redirectError) {
      clearAuthRedirectParams()
      return { session: null, user: null, error: null, redirectError }
    }

    const waited = await waitForRedirectSession()
    if (waited.error) {
      return { session: null, user: null, error: waited.error, redirectError: null }
    }

    const session = waited.session

    cachedAccessToken = session?.access_token ?? null
    return {
      session,
      user: session?.user ? toAuthUser(session.user) : null,
      error: null,
      redirectError: null,
    }
  },

  /** Get the current session (reads from persisted storage) */
  getSession: async (): Promise<{ session: Session | null; user: AuthUser | null }> => {
    const { data: { session } } = await supabase.auth.getSession()
    cachedAccessToken = session?.access_token || null
    return {
      session,
      user: session?.user ? toAuthUser(session.user) : null,
    }
  },

  /** Get the JWT access token for API requests */
  getAccessToken: async (): Promise<string | null> => {
    if (cachedAccessToken) return cachedAccessToken
    const { data: { session } } = await supabase.auth.getSession()
    cachedAccessToken = session?.access_token || null
    return cachedAccessToken
  },

  /** Subscribe to auth state changes */
  onAuthStateChange: (callback: (user: AuthUser | null, session: Session | null) => void) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      cachedAccessToken = session?.access_token || null
      callback(session?.user ? toAuthUser(session.user) : null, session)
    })
    return subscription
  },
}
