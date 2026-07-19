import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import router from './router'
import { authService } from './services/auth'
import useAppStore from './store/useAppStore'

export default function App() {
  const { setUser, setAccessToken, setAuthLoading } = useAppStore()

  useEffect(() => {
    let cancelled = false

    const bootstrapAuth = async () => {
      setAuthLoading(true)

      // /auth/callback is handled by AuthCallbackPage to avoid double PKCE exchange.
      if (window.location.pathname === '/auth/callback') {
        return
      }

      const { user, session, error, redirectError } = await authService.completeAuthFromRedirect()

      if (cancelled) return

      if (redirectError) {
        setAuthLoading(false)
        window.location.replace(`/sign-in?auth_error=${encodeURIComponent(redirectError)}`)
        return
      }

      if (error) {
        console.error('[auth] redirect completion failed:', error.message)
        window.location.replace(
          `/sign-in?auth_error=${encodeURIComponent(error.message)}`
        )
        return
      }

      setUser(user)
      setAccessToken(session?.access_token ?? null)
      setAuthLoading(false)
    }

    bootstrapAuth()

    const subscription = authService.onAuthStateChange((user, session) => {
      setUser(user)
      setAccessToken(session?.access_token ?? null)
      setAuthLoading(false)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [setUser, setAccessToken, setAuthLoading])

  return <RouterProvider router={router} />
}
