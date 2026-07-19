import { useEffect, useRef, useState } from 'react'
import { useNavigate }         from 'react-router-dom'
import { LogOut, Pencil, ArrowRight, X } from 'lucide-react'
import PageWrapper   from '../components/layout/PageWrapper'
import useAppStore   from '../store/useAppStore'
import { authService }  from '../services/auth'
import { clearAllHistory, deleteAccount, fetchMe, updateProfile, uploadAvatar } from '../services/api'

// ---- Types -------------------------------------------------------

interface ProfileData {
  user: {
    id:                string
    email:             string
    displayName:       string | null
    avatarUrl:         string | null
    location:          string | null
    lifeStage:         string | null
    preferredLanguage: string
    createdAt:         string
  }
  plan: { tier: string; name: string; desc: string }
  usage: {
    analyses: { used: number; limit: number | null; percent: number; resetAt: string; label: string }
    chat:     { limit: number | null; label: string }
  }
  stats: { totalSessions: number; completedSessions: number }
  recentSessions: Array<{ id: string; situation: string; summary: string; status: string; createdAt: string }>
}

const normalizeProfileData = (raw: unknown): ProfileData => {
  const source = (raw && typeof raw === 'object') ? (raw as Record<string, unknown>) : {}
  const user = (source.user && typeof source.user === 'object')
    ? (source.user as Record<string, unknown>)
    : {}
  const plan = (source.plan && typeof source.plan === 'object')
    ? (source.plan as Record<string, unknown>)
    : {}
  const usage = (source.usage && typeof source.usage === 'object')
    ? (source.usage as Record<string, unknown>)
    : {}
  const analyses = (usage.analyses && typeof usage.analyses === 'object')
    ? (usage.analyses as Record<string, unknown>)
    : {}
  const chat = (usage.chat && typeof usage.chat === 'object')
    ? (usage.chat as Record<string, unknown>)
    : {}
  const stats = (source.stats && typeof source.stats === 'object')
    ? (source.stats as Record<string, unknown>)
    : {}
  const recentSessionsRaw = Array.isArray(source.recentSessions) ? source.recentSessions : []

  return {
    user: {
      id:                typeof user.id === 'string' ? user.id : '',
      email:             typeof user.email === 'string' ? user.email : '',
      displayName:       typeof user.displayName === 'string' ? user.displayName : null,
      avatarUrl:         typeof user.avatarUrl === 'string' ? user.avatarUrl : null,
      location:          typeof user.location === 'string' ? user.location : null,
      lifeStage:         typeof user.lifeStage === 'string' ? user.lifeStage : null,
      preferredLanguage: typeof user.preferredLanguage === 'string' ? user.preferredLanguage : 'English',
      createdAt:         typeof user.createdAt === 'string' ? user.createdAt : new Date().toISOString(),
    },
    plan: {
      tier: typeof plan.tier === 'string' ? plan.tier : 'explorer',
      name: typeof plan.name === 'string' ? plan.name : 'Explorer — Free',
      desc: typeof plan.desc === 'string' ? plan.desc : '3 analyses/month · 5 messages per session',
    },
    usage: {
      analyses: {
        used: typeof analyses.used === 'number' ? analyses.used : 0,
        limit: typeof analyses.limit === 'number' ? analyses.limit : null,
        percent: typeof analyses.percent === 'number' ? analyses.percent : 0,
        resetAt: typeof analyses.resetAt === 'string' ? analyses.resetAt : '',
        label: typeof analyses.label === 'string' ? analyses.label : '0 / 3 used',
      },
      chat: {
        limit: typeof chat.limit === 'number' ? chat.limit : null,
        label: typeof chat.label === 'string' ? chat.label : '5 messages per session',
      },
    },
    stats: {
      totalSessions: typeof stats.totalSessions === 'number' ? stats.totalSessions : 0,
      completedSessions: typeof stats.completedSessions === 'number' ? stats.completedSessions : 0,
    },
    recentSessions: recentSessionsRaw
      .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
      .map((item) => ({
        id: typeof item.id === 'string' ? item.id : crypto.randomUUID(),
        situation: typeof item.situation === 'string' ? item.situation : 'Untitled session',
        summary: typeof item.summary === 'string' ? item.summary : '',
        status: typeof item.status === 'string' ? item.status : 'in-progress',
        createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
      })),
  }
}

// ---- Helpers -----------------------------------------------------

const LANGUAGES = ['English', 'हिंदी', 'বাংলা', 'தமிழ்'] as const

const LIFE_STAGES = [
  { key: 'Student',        icon: '🎓' },
  { key: 'Working',        icon: '💼' },
  { key: 'Business owner', icon: '🚀' },
  { key: 'Job seeking',    icon: '🔍' },
] as const

const LIFE_STAGE_ICONS: Record<string, string> = {
  'Student':        '🎓',
  'Working':        '💼',
  'Business owner': '🚀',
  'Job seeking':    '🔍',
}

const badgeClass = (variant: 'green' | 'amber' | 'blue') => {
  switch (variant) {
    case 'green': return 'bg-[rgba(74,222,128,.1)] text-[#4ade80] border-[0.5px] border-[rgba(74,222,128,.2)]'
    case 'amber': return 'bg-primary/10 text-primary border-[0.5px] border-primary/30'
    case 'blue':  return 'bg-[rgba(147,197,253,.1)] text-[#93c5fd] border-[0.5px] border-[rgba(147,197,253,.2)]'
  }
}

const getInitials = (name: string | null, email: string): string => {
  if (name && name.trim()) return name.trim()[0].toUpperCase()
  return email[0].toUpperCase()
}

const btnBase =
  'cursor-pointer transition-all active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50'

const relativeDate = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime()
  const days  = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7)  return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`
  return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''} ago`
}

// ---- Skeleton ----------------------------------------------------

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-white/5 ${className ?? ''}`} />
}

function ProfileSkeleton() {
  return (
    <main className="pt-28 pb-20 px-6 max-w-[720px] mx-auto space-y-4">
      <Skeleton className="h-7 w-48 mb-7" />
      <div className="bg-surface-container border-[0.5px] border-[#2a2c2c] rounded-2xl p-6 flex gap-5 items-center">
        <Skeleton className="w-[72px] h-[72px] rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-5 w-52 mt-1" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
      <Skeleton className="h-40 rounded-[14px]" />
      <Skeleton className="h-48 rounded-[14px]" />
    </main>
  )
}

// ---- Main component ----------------------------------------------

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user: authUser, clearAuth, isAuthLoading, clearLocalHistory } = useAppStore()

  const [data,       setData]      = useState<ProfileData | null>(null)
  const [isLoading,  setIsLoading] = useState(true)
  const [error,      setError]     = useState<string | null>(null)
  const [activeLang, setActiveLang] = useState('English')
  const [isSavingLang, setIsSavingLang] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ displayName: '', location: '', lifeStage: '' })
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [isClearingHistory, setIsClearingHistory] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // Redirect to sign-in if not logged in (after auth has finished hydrating)
  useEffect(() => {
    if (!isAuthLoading && !authUser) {
      navigate('/sign-in')
    }
  }, [authUser, isAuthLoading, navigate])

  // Load profile once we know the user is signed in
  useEffect(() => {
    if (isAuthLoading || !authUser) return

    let cancelled = false
    setIsLoading(true)
    setError(null)

    fetchMe()
      .then((profileData: unknown) => {
        if (cancelled) return
        const normalized = normalizeProfileData(profileData)
        setData(normalized)
        setActiveLang(normalized.user.preferredLanguage || 'English')
      })
      .catch(() => {
        if (cancelled) return
        setError('Could not load your profile. Please try again.')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => { cancelled = true }
  }, [authUser, isAuthLoading])

  const reloadProfile = async () => {
    const profileData = await fetchMe()
    const normalized = normalizeProfileData(profileData)
    setData(normalized)
    setActiveLang(normalized.user.preferredLanguage || 'English')
  }

  const openEditModal = () => {
    if (!data) return
    setEditForm({
      displayName: data.user.displayName || '',
      location: data.user.location || '',
      lifeStage: data.user.lifeStage || '',
    })
    setAvatarPreview(data.user.avatarUrl)
    setPendingAvatarFile(null)
    setEditError(null)
    setIsEditOpen(true)
  }

  const handleAvatarFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setEditError('Please choose a JPEG, PNG, WebP, or GIF image.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setEditError('Image must be 2 MB or smaller.')
      return
    }
    setPendingAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
    setEditError(null)
    event.target.value = ''
  }

  const handleSaveProfile = async () => {
    if (!data) return
    setIsSavingProfile(true)
    setEditError(null)
    try {
      if (pendingAvatarFile) {
        await uploadAvatar(pendingAvatarFile)
      }
      await updateProfile({
        displayName: editForm.displayName.trim(),
        location: editForm.location.trim(),
        lifeStage: editForm.lifeStage || undefined,
      })
      await reloadProfile()
      setIsEditOpen(false)
      setPendingAvatarFile(null)
      setActionMessage('Profile updated.')
    } catch {
      setEditError('Could not save profile. Please try again.')
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)
    setActionMessage(null)
    try {
      await authService.signOut()
    } catch {
      setActionMessage('Sign out failed. Please try again.')
      setIsSigningOut(false)
      return
    }
    clearAuth()
    navigate('/sign-in')
  }

  const handleClearHistory = async () => {
    if (!window.confirm('Clear all session history? This cannot be undone.')) return
    setIsClearingHistory(true)
    setActionMessage(null)
    try {
      await clearAllHistory()
      useAppStore.getState().setCurrentSession(null)
      clearLocalHistory()
      await reloadProfile()
      setActionMessage('History cleared.')
    } catch {
      setActionMessage('Could not clear history. Please try again.')
    } finally {
      setIsClearingHistory(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!window.confirm('Permanently delete your account and all data? This cannot be undone.')) return
    setIsDeletingAccount(true)
    setActionMessage(null)
    try {
      await deleteAccount()
      try {
        await authService.signOut()
      } catch { /* session may already be invalid */ }
      clearAuth()
      navigate('/sign-in')
    } catch {
      setActionMessage('Could not delete account. Please try again.')
      setIsDeletingAccount(false)
    }
  }

  const handleLangChange = async (lang: string) => {
    setActiveLang(lang)
    setIsSavingLang(true)
    try {
      await updateProfile({ preferredLanguage: lang })
    } catch { /* non-critical */ }
    finally { setIsSavingLang(false) }
  }

  if (isLoading) {
    return <PageWrapper><ProfileSkeleton /></PageWrapper>
  }

  if (error || !data) {
    return (
      <PageWrapper>
        <main className="pt-28 pb-20 px-6 max-w-[720px] mx-auto">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
            <p className="text-sm text-red-300">{error || 'Profile unavailable.'}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 text-xs text-primary hover:underline"
            >
              Retry
            </button>
          </div>
        </main>
      </PageWrapper>
    )
  }

  const { user, plan, usage, stats, recentSessions } = data
  const displayName = user.displayName || user.email.split('@')[0]
  const initials    = getInitials(user.displayName, user.email)

  // Build badges from real data
  const badges: Array<{ label: string; variant: 'green' | 'amber' | 'blue' }> = [
    { label: plan.tier === 'explorer' ? 'Free plan' : plan.name, variant: 'green' },
    ...(user.lifeStage
      ? [{ label: `${LIFE_STAGE_ICONS[user.lifeStage] ?? '👤'} ${user.lifeStage}`, variant: 'amber' as const }]
      : []),
    ...(user.location
      ? [{ label: user.location, variant: 'blue' as const }]
      : []),
  ]

  const editInitials = getInitials(editForm.displayName || null, user.email)

  return (
    <PageWrapper>
      <main className="pt-28 pb-20 px-6 max-w-[720px] mx-auto">
        <header className="mb-7">
          <h1 className="font-display text-2xl font-semibold text-on-surface tracking-tight">My Profile</h1>
          <p className="mt-1 text-sm text-outline">Manage your account, preferences, and usage</p>
        </header>

        {actionMessage && (
          <p
            className={`mb-4 rounded-lg border px-4 py-2.5 text-sm ${
              actionMessage.startsWith('Could not')
                ? 'border-red-500/20 bg-red-500/10 text-red-300'
                : 'border-primary/20 bg-primary/10 text-primary'
            }`}
          >
            {actionMessage}
          </p>
        )}

        <input
          ref={avatarInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          aria-label="Upload profile photo"
          onChange={handleAvatarFileChange}
        />

        {/* ── Hero ── */}
        <section className="bg-surface-container border-[0.5px] border-[#2a2c2c] rounded-2xl p-6 mb-4 flex flex-col sm:flex-row gap-5 items-center">
          <div className="relative shrink-0">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={displayName}
                className="w-[72px] h-[72px] rounded-full object-cover"
              />
            ) : (
              <div className="w-[72px] h-[72px] rounded-full bg-linear-to-br from-primary-container to-primary flex items-center justify-center font-display text-[26px] font-bold text-on-primary select-none">
                {initials}
              </div>
            )}
            <button
              type="button"
              aria-label="Edit profile photo"
              onClick={openEditModal}
              className={`absolute bottom-0 right-0 w-[22px] h-[22px] rounded-full bg-primary border-2 border-surface-container flex items-center justify-center text-on-primary hover:opacity-90 hover:scale-105 ${btnBase}`}
            >
              <Pencil className="w-2.5 h-2.5" strokeWidth={2.5} />
            </button>
          </div>

          <div className="flex-1 text-center sm:text-left min-w-0">
            <p className="font-display text-xl font-semibold text-on-surface">{displayName}</p>
            <p className="text-[13px] text-outline mt-1">{user.email}</p>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-2.5">
              {badges.map((b) => (
                <span
                  key={b.label}
                  className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${badgeClass(b.variant)}`}
                >
                  {b.label}
                </span>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={openEditModal}
            className={`shrink-0 py-2 px-4 bg-surface-container-low border-[0.5px] border-[#2a2c2c] rounded-lg text-xs font-medium text-outline hover:border-outline-variant hover:bg-surface-container-high hover:text-on-surface font-sans ${btnBase}`}
          >
            Edit profile
          </button>
        </section>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          {[
            { value: String(stats.totalSessions),     label: 'Sessions total'     },
            { value: String(stats.completedSessions),  label: 'Paths completed'    },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-surface-container border-[0.5px] border-[#2a2c2c] rounded-xl py-3.5 px-4 text-center"
            >
              <p className="font-display text-[26px] font-bold text-primary leading-none mb-1">{s.value}</p>
              <p className="text-xs text-outline-variant">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Personal information ── */}
        <section className="bg-surface-container border-[0.5px] border-[#2a2c2c] rounded-[14px] p-5 mb-3.5">
          <h2 className="text-[13px] font-semibold text-on-surface mb-4">Personal information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'Full name',   value: user.displayName || '—' },
              { label: 'Email',       value: user.email },
              { label: 'Location',    value: user.location   || 'Not set' },
              { label: 'Life stage',  value: user.lifeStage  ? `${LIFE_STAGE_ICONS[user.lifeStage] ?? ''} ${user.lifeStage}` : 'Not set' },
            ].map((f) => (
              <div key={f.label} className="flex flex-col gap-1">
                <span className="text-[11px] font-medium uppercase tracking-wider text-outline-variant">{f.label}</span>
                <span className={`text-sm font-medium ${f.value === 'Not set' ? 'text-outline-variant italic' : 'text-on-surface'}`}>
                  {f.value}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Language ── */}
        <section className="bg-surface-container border-[0.5px] border-[#2a2c2c] rounded-[14px] p-5 mb-3.5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[13px] font-semibold text-on-surface">Preferred language</h2>
            {isSavingLang && <span className="text-[11px] text-outline-variant">Saving…</span>}
          </div>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => handleLangChange(lang)}
                className={`py-1.5 px-3.5 rounded-full text-xs font-medium border-[0.5px] font-sans ${btnBase} ${
                  activeLang === lang
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'border-[#2a2c2c] text-outline bg-surface-container-low hover:border-outline-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </section>

        {/* ── Plan & usage ── */}
        <section className="bg-surface-container border-[0.5px] border-[#2a2c2c] rounded-[14px] p-5 mb-3.5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[13px] font-semibold text-on-surface">Plan & usage</h2>
          </div>

          <div className="flex items-center justify-between py-3 px-3.5 bg-surface-container-low rounded-[10px] mb-2.5">
            <div>
              <p className="text-sm font-semibold text-on-surface">{plan.name}</p>
              <p className="text-xs text-outline-variant mt-0.5">{plan.desc}</p>
            </div>
            <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-[rgba(74,222,128,.1)] text-[#4ade80] border-[0.5px] border-[rgba(74,222,128,.2)] shrink-0">
              Active
            </span>
          </div>

          {/* Analyses progress */}
          <div className="flex items-center gap-3 mb-2.5">
            <span className="text-[13px] text-outline w-40 shrink-0">Analyses this month</span>
            <div className="flex-1 bg-surface-container-low rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-linear-to-r from-primary to-primary-container transition-all"
                style={{ width: `${usage.analyses.percent}%` }}
              />
            </div>
            <span className="text-xs text-outline whitespace-nowrap">{usage.analyses.label}</span>
          </div>

          {/* Chat limit info */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[13px] text-outline w-40 shrink-0">Chat messages</span>
            <span className="text-xs text-outline-variant flex-1">{usage.chat.label}</span>
          </div>

          {plan.tier === 'explorer' && (
            <button
              type="button"
              onClick={() => navigate('/pricing')}
              className={`w-full py-3 rounded-[10px] text-[13px] font-semibold text-on-primary font-sans bg-linear-to-br from-primary-container to-primary hover:opacity-95 hover:shadow-lg hover:shadow-primary-container/20 flex items-center justify-center gap-2 ${btnBase}`}
            >
              Upgrade to Navigator — pricing soon
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </section>

        {/* ── Recent sessions ── */}
        <section className="bg-surface-container border-[0.5px] border-[#2a2c2c] rounded-[14px] p-5 mb-3.5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[13px] font-semibold text-on-surface">Recent sessions</h2>
            <button
              type="button"
              onClick={() => navigate('/history')}
              className={`text-xs text-primary bg-transparent border-none font-sans hover:underline ${btnBase}`}
            >
              View all →
            </button>
          </div>

          {recentSessions.length === 0 ? (
            <p className="text-sm text-outline-variant text-center py-4">
              No sessions yet.{' '}
              <button type="button" onClick={() => navigate('/input')} className={`text-primary hover:underline ${btnBase}`}>
                Start your first analysis →
              </button>
            </p>
          ) : (
            <ul>
              {recentSessions.map((s) => (
                <li
                  key={s.id}
                  className={`flex gap-3 items-start py-2.5 border-b-[0.5px] border-surface-container-low last:border-none last:pb-0 hover:bg-surface-container-low/50 rounded-lg px-1 -mx-1 transition-colors ${btnBase}`}
                  onClick={() => navigate(`/sessions/${s.id}`)}
                >
                  <div className="w-[34px] h-[34px] rounded-[9px] bg-surface-container-low flex items-center justify-center text-base shrink-0 select-none">
                    💡
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-on-surface line-clamp-1">{s.situation}</p>
                    <p className="text-xs text-outline-variant mt-0.5">{relativeDate(s.createdAt)}</p>
                  </div>
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 self-center ${
                      s.status === 'completed'
                        ? 'bg-[rgba(74,222,128,.1)] text-[#4ade80]'
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {s.status === 'completed' ? 'Completed' : 'In progress'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── Account actions ── */}
        <section className="bg-surface-container border-[0.5px] border-red-500/15 rounded-[14px] p-5 mb-3.5">
          <h2 className="text-[13px] font-semibold text-red-400 mb-3">Account actions</h2>
          <div className="flex flex-col gap-2.5">
            {stats.totalSessions > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-[13px] font-medium text-on-surface">Clear all history</p>
                  <p className="text-xs text-outline-variant mt-0.5">
                    Remove all {stats.totalSessions} saved session{stats.totalSessions === 1 ? '' : 's'} and step progress permanently
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClearHistory}
                  disabled={isClearingHistory}
                  className={`py-2 px-3.5 rounded-lg text-xs font-medium text-red-400 bg-red-500/8 border-[0.5px] border-red-500/20 hover:bg-red-500/15 hover:border-red-500/35 font-sans whitespace-nowrap self-start sm:self-center ${btnBase}`}
                >
                  {isClearingHistory ? 'Clearing…' : 'Clear history'}
                </button>
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-[13px] font-medium text-on-surface">Delete account</p>
                <p className="text-xs text-outline-variant mt-0.5">Permanently delete your account and all data</p>
              </div>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount}
                className={`py-2 px-3.5 rounded-lg text-xs font-medium text-red-400 bg-red-500/8 border-[0.5px] border-red-500/20 hover:bg-red-500/15 hover:border-red-500/35 font-sans whitespace-nowrap self-start sm:self-center ${btnBase}`}
              >
                {isDeletingAccount ? 'Deleting…' : 'Delete account'}
              </button>
            </div>
          </div>
        </section>

        {/* ── Sign out ── */}
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className={`w-full py-3.5 bg-surface-container border-[0.5px] border-[#2a2c2c] rounded-xl text-sm font-medium text-outline hover:border-outline-variant hover:bg-surface-container-high hover:text-on-surface font-sans flex items-center justify-center gap-2 ${btnBase}`}
        >
          <LogOut className="w-4 h-4" strokeWidth={1.4} />
          {isSigningOut ? 'Signing out…' : 'Sign out'}
        </button>

        {isEditOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
            onClick={() => !isSavingProfile && setIsEditOpen(false)}
          >
            <div
              className="w-full max-w-md rounded-2xl border border-[#2a2c2c] bg-surface-container p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 id="edit-profile-title" className="font-display text-lg font-semibold text-on-surface">
                  Edit profile
                </h2>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => !isSavingProfile && setIsEditOpen(false)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-outline hover:bg-surface-container-high hover:text-on-surface ${btnBase}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-5 flex flex-col items-center gap-3">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="" className="h-20 w-20 rounded-full object-cover" />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-primary-container to-primary font-display text-2xl font-bold text-on-primary">
                    {editInitials}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className={`text-xs font-medium text-primary hover:underline ${btnBase}`}
                >
                  Change photo
                </button>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-outline">Full name</span>
                  <input
                    type="text"
                    value={editForm.displayName}
                    onChange={(e) => setEditForm((f) => ({ ...f, displayName: e.target.value }))}
                    maxLength={100}
                    className="w-full rounded-[10px] border border-white/10 bg-surface-container-low px-3.5 py-2.5 text-sm text-on-surface outline-none transition focus:border-primary/40"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-outline">Email</span>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full cursor-not-allowed rounded-[10px] border border-white/10 bg-surface-container-low/50 px-3.5 py-2.5 text-sm text-outline-variant"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-outline">Location</span>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))}
                    maxLength={100}
                    placeholder="City, country"
                    className="w-full rounded-[10px] border border-white/10 bg-surface-container-low px-3.5 py-2.5 text-sm text-on-surface outline-none transition placeholder:text-outline-variant focus:border-primary/40"
                  />
                </label>

                <div>
                  <span className="mb-2 block text-xs font-medium text-outline">Life stage</span>
                  <div className="grid grid-cols-2 gap-2">
                    {LIFE_STAGES.map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setEditForm((f) => ({ ...f, lifeStage: opt.key }))}
                        className={`rounded-[10px] border px-3 py-2 text-center text-xs font-medium ${btnBase} ${
                          editForm.lifeStage === opt.key
                            ? 'border-primary/30 bg-primary/10 text-primary'
                            : 'border-white/10 bg-surface-container-low text-outline hover:border-outline-variant hover:text-on-surface'
                        }`}
                      >
                        <span className="block text-base">{opt.icon}</span>
                        {opt.key}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {editError && (
                <p className="mt-3 text-xs text-red-300">{editError}</p>
              )}

              <div className="mt-6 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => !isSavingProfile && setIsEditOpen(false)}
                  disabled={isSavingProfile}
                  className={`flex-1 rounded-[10px] border border-white/10 py-2.5 text-sm font-medium text-outline hover:bg-surface-container-high hover:text-on-surface ${btnBase}`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                  className={`flex-1 rounded-[10px] bg-primary py-2.5 text-sm font-semibold text-on-primary hover:opacity-90 ${btnBase}`}
                >
                  {isSavingProfile ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </PageWrapper>
  )
}
