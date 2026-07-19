import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { authService } from '../services/auth'
import useAppStore from '../store/useAppStore'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [message, setMessage] = useState('Completing sign in…')
  const { setUser, setAccessToken, setAuthLoading } = useAppStore()

  useEffect(() => {
    let cancelled = false

    const finish = async () => {
      setAuthLoading(true)

      const { user, session, error, redirectError } = await authService.completeAuthFromRedirect()

      if (cancelled) return

      if (redirectError || error) {
        const detail = redirectError || error?.message || 'Sign-in could not be completed.'
        setAuthLoading(false)
        window.location.replace(`/sign-in?auth_error=${encodeURIComponent(detail)}`)
        return
      }

      if (session && user) {
        setUser(user)
        setAccessToken(session.access_token)
        setAuthLoading(false)
        navigate('/', { replace: true })
        return
      }

      setMessage('Could not complete sign in. Redirecting…')
      setAuthLoading(false)
      navigate('/sign-in?auth_error=Sign-in%20could%20not%20be%20completed.%20Please%20try%20again.', {
        replace: true,
      })
    }

    finish()
    return () => {
      cancelled = true
    }
  }, [navigate, setUser, setAccessToken, setAuthLoading])

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-container-lowest px-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 className="size-8 animate-spin text-primary-container" aria-hidden />
        <p className="text-sm text-on-surface-variant">{message}</p>
      </div>
    </div>
  )
}
