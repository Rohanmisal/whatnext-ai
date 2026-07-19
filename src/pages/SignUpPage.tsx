import { ArrowRight, LogIn, Loader2, MailCheck } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import AuthBrandMark from '../components/AuthBrandMark'
import PasswordInput from '../components/PasswordInput'
import { authService } from '../services/auth'
import { updateProfile } from '../services/api'
import useAppStore from '../store/useAppStore'
import { normalizeEmail, validateEmail } from '../utils/email'

// ─── Google SVG icon ──────────────────────────────────────────────────────────
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

// ─── Reusable field wrapper ───────────────────────────────────────────────────
function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-[12px] font-medium text-outline mb-1.5 tracking-[0.01em]">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-outline-variant">{hint}</p>}
    </div>
  )
}

// ─── Text input shared styles ─────────────────────────────────────────────────
const inputCls =
  'w-full rounded-xl border border-white/[0.08] bg-surface-container px-3.5 py-2.5 text-sm text-on-surface outline-none transition-colors placeholder:text-outline-variant focus:border-primary-container/40'

export default function SignUpPage() {
  const navigate = useNavigate()
  const { setUser, setAccessToken } = useAppStore()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [preferredLanguage, setPreferredLanguage] = useState<
    'English' | 'हिंदी' | 'বাংলা' | 'தமிழ்'
  >('English')
  const [stage, setStage] = useState<
    'Student' | 'Working' | 'Business owner' | 'Job seeking'
  >('Student')

  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

  const emailCheck = validateEmail(email)
  const passwordsMatch = password === confirmPassword
  const canSubmit =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    emailCheck.valid &&
    password.trim().length >= 8 &&
    confirmPassword.trim().length >= 8 &&
    passwordsMatch

  const clearError = () => {
    setError(null)
    setEmailError(null)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || isLoading) return

    const validation = validateEmail(email)
    if (!validation.valid) {
      setEmailError(validation.message || 'Please enter a valid email address.')
      return
    }

    if (!passwordsMatch) {
      setError('Passwords do not match. Please check and try again.')
      return
    }

    setIsLoading(true)
    setError(null)
    setEmailError(null)

    const fullName = `${firstName.trim()} ${lastName.trim()}`
    const cleanEmail = normalizeEmail(email)

    const { user, session, error: authError, isNewUser } = await authService.signUp(
      cleanEmail,
      password,
      fullName,
      { lifeStage: stage, preferredLanguage }
    )

    if (authError) {
      setIsLoading(false)
      const msg = authError.message.toLowerCase()
      if (
        msg.includes('already registered') ||
        msg.includes('already exists') ||
        msg.includes('unique')
      ) {
        setError('An account with this email already exists. Try signing in instead.')
      } else if (msg.includes('password')) {
        setError('Password must be at least 6 characters.')
      } else {
        setError(authError.message)
      }
      return
    }

    // Supabase omits identities when the email already exists — no confirmation email is sent.
    if (!isNewUser) {
      setIsLoading(false)
      setError('An account with this email already exists. Try signing in instead.')
      return
    }

    if (!session) {
      setIsLoading(false)
      setEmailSent(true)
      return
    }

    if (user) {
      setUser(user)
      setAccessToken(session.access_token)
    }

    try {
      await updateProfile({ lifeStage: stage, preferredLanguage })
    } catch {
      // Non-critical — profile metadata can be updated later
    }

    setIsLoading(false)
    navigate('/')
  }

  const onGoogleSignUp = async () => {
    setIsGoogleLoading(true)
    setError(null)
    const { error: authError } = await authService.signInWithGoogle()
    if (authError) {
      setIsGoogleLoading(false)
      setError(authError.message || 'Google sign-up failed. Please try again.')
    }
  }

  if (emailSent) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface-container-lowest px-5 py-16">
        <div className="pointer-events-none absolute -top-52 left-1/2 -translate-x-1/2 w-[700px] h-[600px] rounded-full bg-[radial-gradient(ellipse,rgba(244,162,97,0.06)_0%,transparent_65%)]" />

        <motion.main
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative z-10 w-full max-w-[460px] rounded-[20px] border border-white/[0.1] bg-surface-container-low px-10 py-10 text-center"
        >
          <div className="mb-5 flex justify-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <MailCheck className="size-7 text-emerald-400" />
            </div>
          </div>
          <h2 className="font-display text-xl font-semibold text-on-surface mb-2">
            Check your email
          </h2>
          <p className="text-sm text-outline-variant leading-relaxed mb-4">
            We sent a confirmation link to{' '}
            <span className="text-on-surface font-medium">{email}</span>.
            Click it to activate your account and you&apos;re all set.
          </p>
          <p className="text-xs text-outline-variant mb-6">
            Didn&apos;t get it? Check your spam folder or{' '}
            <button
              type="button"
              className="text-primary-container hover:underline"
              onClick={() => {
                setEmailSent(false)
                setPassword('')
                setConfirmPassword('')
              }}
            >
              try again
            </button>
            .
          </p>
          <button
            type="button"
            onClick={() => navigate('/sign-in')}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary-container px-4 py-3 text-sm font-semibold text-[#1a0d06] hover:opacity-90 transition active:scale-95"
          >
            Go to sign in
            <ArrowRight className="size-4" />
          </button>
        </motion.main>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface-container-lowest px-5 py-14">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -top-52 left-1/2 -translate-x-1/2 w-[700px] h-[600px] rounded-full bg-[radial-gradient(ellipse,rgba(244,162,97,0.06)_0%,transparent_65%)]" />

      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative z-10 w-full max-w-[480px] rounded-[20px] border border-white/[0.1] bg-surface-container-low px-8 py-10 sm:px-10"
      >
        <AuthBrandMark />

        <h1 className="font-display text-center text-[22px] font-semibold text-on-surface mb-1.5">
          Create your account
        </h1>
        <p className="text-center text-[14px] text-outline-variant font-light leading-relaxed mb-7">
          Free to start. Your paths and progress will be saved to your account.
        </p>

        {/* Google */}
        <button
          type="button"
          disabled={isGoogleLoading || isLoading}
          onClick={onGoogleSignUp}
          className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-white/[0.1] bg-surface-container px-4 py-3 text-sm font-medium text-on-surface transition-all hover:bg-surface-container-high hover:border-white/[0.15] disabled:opacity-60 disabled:cursor-not-allowed mb-5"
        >
          {isGoogleLoading ? (
            <Loader2 className="size-[18px] animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          Sign up with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="h-px flex-1 bg-white/[0.06]" />
          <span className="text-[12px] text-outline-variant whitespace-nowrap">
            or create with email
          </span>
          <div className="h-px flex-1 bg-white/[0.06]" />
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/[0.08] px-3.5 py-2.5 text-xs text-red-300 leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name">
              <input
                value={firstName}
                onChange={(e) => { setFirstName(e.target.value); clearError() }}
                type="text"
                placeholder="Rahul"
                autoComplete="given-name"
                className={inputCls}
              />
            </Field>
            <Field label="Last name">
              <input
                value={lastName}
                onChange={(e) => { setLastName(e.target.value); clearError() }}
                type="text"
                placeholder="Sharma"
                autoComplete="family-name"
                className={inputCls}
              />
            </Field>
          </div>

          {/* Email */}
          <Field label="Email address">
            <input
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearError() }}
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
          </Field>

          {/* Password */}
          <Field label="Password" hint="Use at least 8 characters.">
            <PasswordInput
              value={password}
              onChange={(v) => { setPassword(v); clearError() }}
              placeholder="Min. 8 characters"
              autoComplete="new-password"
            />
          </Field>

          {/* Confirm password */}
          <Field
            label="Confirm password"
            hint={
              confirmPassword.length > 0 && !passwordsMatch ? (
                <span className="text-red-300">Passwords do not match.</span>
              ) : undefined
            }
          >
            <PasswordInput
              value={confirmPassword}
              onChange={(v) => { setConfirmPassword(v); clearError() }}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              aria-invalid={confirmPassword.length > 0 && !passwordsMatch}
            />
          </Field>

          {/* ── Persona section ── */}
          <div className="pt-1">
            <div className="border-t border-white/[0.06] pt-5 mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-outline-variant">
                A little about you — helps us personalise your paths
              </p>
            </div>

            {/* Language */}
            <p className="text-xs font-medium text-outline mb-2">Preferred language</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {(['English', 'हिंदी', 'বাংলা', 'தமிழ்'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setPreferredLanguage(lang)}
                  className={[
                    'rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-all',
                    preferredLanguage === lang
                      ? 'border-primary-container/30 bg-primary-container/10 text-primary-container'
                      : 'border-white/[0.08] bg-surface-container text-outline hover:border-outline-variant',
                  ].join(' ')}
                >
                  {lang}
                </button>
              ))}
            </div>

            {/* Life stage */}
            <p className="text-xs font-medium text-outline mb-2">Which best describes you?</p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {([
                { key: 'Student', icon: '🎓' },
                { key: 'Working', icon: '💼' },
                { key: 'Business owner', icon: '🚀' },
                { key: 'Job seeking', icon: '🔍' },
              ] as const).map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setStage(opt.key)}
                  className={[
                    'rounded-xl border px-3 py-2.5 text-left text-[13px] font-medium transition-all flex items-center gap-2',
                    stage === opt.key
                      ? 'border-primary-container/30 bg-primary-container/10 text-primary-container'
                      : 'border-white/[0.08] bg-surface-container text-outline hover:border-outline-variant',
                  ].join(' ')}
                >
                  <span className="text-base">{opt.icon}</span>
                  {opt.key}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit || isLoading}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-primary-container px-4 py-3.5 text-[15px] font-semibold text-[#1a0d06] shadow-[0_8px_24px_rgba(244,162,97,0.22)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(244,162,97,0.3)] disabled:cursor-not-allowed disabled:opacity-50 disabled:translate-y-0 active:scale-[0.98]"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating account…
              </>
            ) : (
              <>
                Create my account →
              </>
            )}
          </button>
        </form>

        {/* Sign in link */}
        <p className="mt-4 text-center text-[13px] text-outline-variant">
          Already have an account?{' '}
          <Link to="/sign-in" className="text-primary-container hover:underline font-medium">
            Sign in →
          </Link>
        </p>

        {/* Legal */}
        <p className="mt-3 text-center text-[11px] leading-relaxed text-outline-variant">
          By creating an account you agree to our{' '}
          <button type="button" className="text-outline-variant underline hover:text-outline transition-colors">
            Terms of Service
          </button>{' '}
          and{' '}
          <button type="button" className="text-outline-variant underline hover:text-outline transition-colors">
            Privacy Policy
          </button>
        </p>

        {/* Guest skip */}
        <div className="mt-5 border-t border-white/[0.06] pt-4 text-center">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-transparent px-5 py-2.5 text-[13px] text-outline-variant transition-all hover:border-white/[0.15] hover:text-on-surface"
            onClick={() => navigate('/')}
          >
            <LogIn className="size-3.5" aria-hidden />
            Skip for now — try as guest
          </button>
        </div>
      </motion.main>
    </div>
  )
}
