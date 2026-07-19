import { ArrowRight, LogIn, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import AuthBrandMark from '../components/AuthBrandMark'
import PasswordInput from '../components/PasswordInput'
import { authService } from '../services/auth'
import useAppStore from '../store/useAppStore'
import { normalizeEmail, validateEmail } from '../utils/email'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 18 18" fill="none" aria-hidden className="size-[18px] shrink-0">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  )
}

const inputCls =
  'w-full rounded-xl border border-white/[0.08] bg-surface-container px-3.5 py-2.5 text-sm text-on-surface outline-none transition-colors placeholder:text-outline-variant focus:border-primary-container/40'

export default function SignInPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { setUser, setAccessToken } = useAppStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)

  const emailCheck = validateEmail(email)
  const canSubmit = emailCheck.valid && password.trim().length > 0

  const clearError = () => {
    setError(null)
    setEmailError(null)
  }

  useEffect(() => {
    const authError = searchParams.get('auth_error')
    if (authError) {
      setError(decodeURIComponent(authError))
      searchParams.delete('auth_error')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || isLoading) return

    const validation = validateEmail(email)
    if (!validation.valid) {
      setEmailError(validation.message || 'Please enter a valid email address.')
      return
    }

    setIsLoading(true)
    setError(null)

    const { user, session, error: authError } = await authService.signIn(
      normalizeEmail(email),
      password
    )

    if (authError) {
      setIsLoading(false)
      const msg = authError.message.toLowerCase()
      if (msg.includes('invalid') || msg.includes('credentials') || msg.includes('not found')) {
        setError('Incorrect email or password. Please try again.')
      } else if (msg.includes('email not confirmed')) {
        setError('Please verify your email address first. Check your inbox for a confirmation link.')
      } else {
        setError(authError.message)
      }
      return
    }

    if (user && session) {
      setUser(user)
      setAccessToken(session.access_token)
    }

    setIsLoading(false)
    navigate('/')
  }

  const onGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    setError(null)
    const { error: authError } = await authService.signInWithGoogle()
    if (authError) {
      setIsGoogleLoading(false)
      setError(authError.message || 'Google sign-in failed. Please try again.')
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface-container-lowest px-5 py-14">
      <div className="pointer-events-none absolute -top-52 left-1/2 -translate-x-1/2 w-[700px] h-[600px] rounded-full bg-[radial-gradient(ellipse,rgba(244,162,97,0.06)_0%,transparent_65%)]" />

      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative z-10 w-full max-w-[480px] rounded-[20px] border border-white/[0.1] bg-surface-container-low px-8 py-10 sm:px-10"
      >
        <AuthBrandMark />

        <h1 className="font-display text-center text-[22px] font-semibold text-on-surface mb-1.5">
          Welcome back
        </h1>
        <p className="text-center text-[14px] text-outline-variant font-light leading-relaxed mb-7">
          Sign in to access your paths, history and progress.
        </p>

        <button
          type="button"
          disabled={isGoogleLoading || isLoading}
          onClick={onGoogleSignIn}
          className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-white/[0.1] bg-surface-container px-4 py-3 text-sm font-medium text-on-surface transition-all hover:bg-surface-container-high hover:border-white/[0.15] disabled:opacity-60 disabled:cursor-not-allowed mb-5"
        >
          {isGoogleLoading ? <Loader2 className="size-[18px] animate-spin" /> : <GoogleIcon />}
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="h-px flex-1 bg-white/[0.06]" />
          <span className="text-[12px] text-outline-variant whitespace-nowrap">
            or sign in with email
          </span>
          <div className="h-px flex-1 bg-white/[0.06]" />
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/[0.08] px-3.5 py-2.5 text-xs text-red-300 leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
          <div>
            <label className="block text-[12px] font-medium text-outline mb-1.5">
              Email address
            </label>
            <input
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                clearError()
              }}
              onBlur={() => {
                if (email.trim()) {
                  const result = validateEmail(email)
                  setEmailError(result.valid ? null : result.message || null)
                }
              }}
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              inputMode="email"
              aria-invalid={email.length > 0 && !emailCheck.valid}
              className={inputCls}
            />
            {(emailError || (email.length > 0 && !emailCheck.valid)) && (
              <p className="mt-1 text-[11px] text-red-300">
                {emailError || emailCheck.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-[12px] font-medium text-outline mb-1.5">Password</label>
            <PasswordInput
              value={password}
              onChange={(v) => {
                setPassword(v)
                clearError()
              }}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={!canSubmit || isLoading}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-primary-container px-4 py-3.5 text-[15px] font-semibold text-[#1a0d06] shadow-[0_8px_24px_rgba(244,162,97,0.22)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(244,162,97,0.3)] disabled:cursor-not-allowed disabled:opacity-50 disabled:translate-y-0 active:scale-[0.98]"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Signing in…
              </>
            ) : (
              <>
                Sign in
                <ArrowRight className="size-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-4 text-center text-[13px] text-outline-variant">
          Don&apos;t have an account?{' '}
          <Link to="/sign-up" className="text-primary-container hover:underline font-medium">
            Create one free →
          </Link>
        </p>

        <div className="mt-5 border-t border-white/[0.06] pt-4 text-center">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-transparent px-5 py-2.5 text-[13px] text-outline-variant transition-all hover:border-white/[0.15] hover:text-on-surface"
            onClick={() => navigate('/')}
          >
            <LogIn className="size-3.5" aria-hidden />
            Continue as guest — try it free
          </button>
        </div>
      </motion.main>
    </div>
  )
}
