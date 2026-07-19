import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AppState } from '../types'
import type { AuthUser } from '../services/auth'

interface AuthState {
  user:           AuthUser | null
  accessToken:    string | null
  isAuthLoading:  boolean
  setUser:        (user: AuthUser | null) => void
  setAccessToken: (token: string | null) => void
  setAuthLoading: (loading: boolean) => void
  clearAuth:      () => void
}

type StoreState = AppState & AuthState

const useAppStore = create<StoreState>()(
  persist(
    (set) => ({
      // ---- Session / UI state ----
      currentSession:             null,
      history:                    [],
      isLoading:                  false,
      error:                      null,
      hasSeenWelcome:             false,
      hasCompletedOnboarding:     false,
      guestAnalysesUsed:          0,
      setCurrentSession:          (session) => set({ currentSession: session }),
      setLoading:                 (loading) => set({ isLoading: loading }),
      setError:                   (error)   => set({ error }),
      setHasSeenWelcome:          (seen)    => set({ hasSeenWelcome: seen }),
      setHasCompletedOnboarding:  (completed) => set({ hasCompletedOnboarding: completed }),
      addToHistory:               (session) =>
        set((state) => ({ history: [session, ...state.history] })),
      clearLocalHistory:          () => set({ history: [] }),
      markGuestAnalysisUsed:      () =>
        set((state) => ({
          guestAnalysesUsed: Math.min(state.guestAnalysesUsed + 1, 99),
        })),

      // ---- Auth state ----
      user:           null,
      accessToken:    null,
      isAuthLoading:  true,   // starts true — resolves on app init
      setUser:        (user)  => set({ user }),
      setAccessToken: (token) => set({ accessToken: token }),
      setAuthLoading: (loading) => set({ isAuthLoading: loading }),
      clearAuth:      () =>
        set({
          user:            null,
          accessToken:     null,
          currentSession:  null,
          history:         [],
        }),
    }),
    {
      name: 'whatnext-storage',
      // Don't persist auth tokens — always re-hydrate from Supabase on load
      partialize: (state) => ({
        currentSession:         state.currentSession,
        history:                state.history,
        hasSeenWelcome:         state.hasSeenWelcome,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        guestAnalysesUsed:      state.guestAnalysesUsed,
      }),
    }
  )
)

export default useAppStore
