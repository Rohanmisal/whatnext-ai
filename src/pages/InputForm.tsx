import { FormEvent, useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { motion } from 'motion/react'
import PageWrapper from '../components/layout/PageWrapper'
import GuestAuthBanner from '../components/GuestAuthBanner'
import LimitReachedModal from '../components/LimitReachedModal'
import Toggle from '../components/ui/Toggle'
import { GUEST_ANALYSIS_LIMIT } from '../constants/guest'
import {
  analyzeInput,
  fetchAnalysisQuota,
  isLimitReachedError,
  quotaToLimitPayload,
  type AnalysisQuota,
  type LimitReachedPayload,
} from '../services/api'
import useAppStore from '../store/useAppStore'
import { Session } from '../types'
import { createSessionId } from '../utils/helpers'

const categories = ['Learning', 'Career', 'Business', 'Tech', 'Creative', 'Personal', 'Other']

const textareaCls =
  'min-h-[120px] w-full resize-y rounded-[14px] border border-white/[0.08] bg-surface-container-low px-4 py-4 text-[15px] leading-relaxed text-on-surface outline-none transition placeholder:text-outline-variant placeholder:font-light focus:border-primary-container/40 disabled:cursor-not-allowed disabled:opacity-60'

export default function InputForm() {
  const navigate = useNavigate()
  const authUser = useAppStore((state) => state.user)
  const guestAnalysesUsed = useAppStore((state) => state.guestAnalysesUsed)
  const markGuestAnalysisUsed = useAppStore((state) => state.markGuestAnalysisUsed)
  const setCurrentSession = useAppStore((state) => state.setCurrentSession)
  const addToHistory = useAppStore((state) => state.addToHistory)
  const setLoading = useAppStore((state) => state.setLoading)
  const setError = useAppStore((state) => state.setError)

  const [situation, setSituation] = useState('')
  const [blockage, setBlockage] = useState('')
  const [category, setCategory] = useState(categories[0])
  const [wantsDownloads, setWantsDownloads] = useState(true)
  const [quota, setQuota] = useState<AnalysisQuota | null>(null)
  const [isCheckingQuota, setIsCheckingQuota] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [limitPayload, setLimitPayload] = useState<LimitReachedPayload | null>(null)
  const [limitModalOpen, setLimitModalOpen] = useState(false)

  const refreshQuota = useCallback(async () => {
    if (!authUser) {
      setQuota(null)
      return
    }
    setIsCheckingQuota(true)
    try {
      const next = await fetchAnalysisQuota()
      setQuota(next)
    } catch {
      setQuota(null)
    } finally {
      setIsCheckingQuota(false)
    }
  }, [authUser])

  useEffect(() => {
    refreshQuota()
  }, [refreshQuota])

  const showLimitModal = (payload: LimitReachedPayload) => {
    setLimitPayload(payload)
    setLimitModalOpen(true)
  }

  const closeLimitModal = () => {
    setLimitModalOpen(false)
  }

  const isGuest = !authUser
  const guestAtLimit = isGuest && guestAnalysesUsed >= GUEST_ANALYSIS_LIMIT

  const checkQuotaBeforeAnalyze = async (): Promise<boolean> => {
    if (isGuest) {
      if (guestAtLimit) return false
      return true
    }

    try {
      const latest = await fetchAnalysisQuota()
      setQuota(latest)
      const blocked = quotaToLimitPayload(latest)
      if (blocked) {
        showLimitModal(blocked)
        return false
      }
      return true
    } catch {
      return true
    }
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!situation.trim() || !blockage.trim() || isSubmitting) return

    setError(null)

    const canProceed = await checkQuotaBeforeAnalyze()
    if (!canProceed) return

    if (isGuest && guestAtLimit) return

    setIsSubmitting(true)
    setLoading(true)
    navigate('/loading')

    try {
      const result = await analyzeInput(situation, blockage, category, wantsDownloads)
      const resolvedSessionId = authUser && result.sessionId ? result.sessionId : createSessionId()
      const pathDbIds = result.pathIds
        ? Object.fromEntries(
            Object.entries(result.pathIds).map(([order, id]) => [Number(order), id])
          )
        : undefined
      const session: Session = {
        id: resolvedSessionId,
        createdAt: new Date(),
        category,
        situation,
        blockage,
        result,
        pathDbIds,
        status: 'in-progress',
        messages: [],
      }

      setCurrentSession(session)
      addToHistory(session)
      if (isGuest) markGuestAnalysisUsed()
      await refreshQuota()
      navigate('/results')
    } catch (error: unknown) {
      const limit = isLimitReachedError(error)
      if (limit) {
        setQuota((q) =>
          q
            ? { ...q, allowed: false, used: limit.used, limit: limit.limit, message: limit.message }
            : null
        )
        showLimitModal(limit)
        navigate('/input')
        return
      }

      const message =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { error?: string; message?: string } } }).response?.data
          ?.message === 'string'
          ? (error as { response?: { data?: { message?: string } } }).response!.data!.message!
          : typeof error === 'object' &&
              error !== null &&
              'response' in error &&
              typeof (error as { response?: { data?: { error?: string } } }).response?.data?.error ===
                'string'
            ? (error as { response?: { data?: { error?: string } } }).response!.data!.error!
            : 'We could not analyze your input right now.'
      setError(message)
      navigate('/error')
    } finally {
      setIsSubmitting(false)
      setLoading(false)
    }
  }

  const atLimit = authUser
    ? quota != null && quota.limit != null && !quota.allowed
    : guestAtLimit
  const formDisabled = atLimit || isSubmitting

  return (
    <PageWrapper>
      <LimitReachedModal open={limitModalOpen} payload={limitPayload} onClose={closeLimitModal} />

      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mx-auto max-w-[720px] px-5 pb-24 pt-28 sm:px-6"
      >
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary-container/25 bg-primary-container/10 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-primary-container">
          <span className="text-[11px]">🧭</span>
          Navigation Engine
        </div>

        <h1 className="font-display text-[clamp(26px,3vw,32px)] font-bold tracking-tight text-on-surface">
          Tell us your current situation
        </h1>
        <p className="mt-2 text-[15px] font-light text-on-surface-variant">
          Two quick inputs and we'll map your options — Easy, Medium, and Advanced paths forward.
        </p>

        {isGuest && (
          <div className="mt-7">
            <GuestAuthBanner
              analysesUsed={guestAnalysesUsed}
              variant={guestAtLimit ? 'exhausted' : 'default'}
            />
          </div>
        )}

        {authUser && quota?.limit != null && (
          <div
            className={`mt-7 flex items-center gap-3.5 rounded-[14px] border px-4 py-3.5 ${
              atLimit
                ? 'border-amber-500/30 bg-amber-500/10'
                : 'border-white/[0.08] bg-surface-container-low'
            }`}
          >
            <AlertCircle
              className={`size-3.5 shrink-0 ${atLimit ? 'text-amber-400' : 'text-outline-variant'}`}
              aria-hidden
            />
            <span className="whitespace-nowrap text-[13px] text-on-surface-variant">
              Analyses used this month
            </span>
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-container-highest">
              <div
                className="h-full rounded-full bg-primary-container transition-all duration-500"
                style={{
                  width: atLimit
                    ? '100%'
                    : `${Math.min((quota.used / quota.limit) * 100, 100)}%`,
                }}
              />
            </div>
            <span className="whitespace-nowrap font-display text-[13px] font-semibold text-primary-container">
              {atLimit ? `${quota.used} / ${quota.limit}` : `${quota.used} / ${quota.limit}`}
            </span>
          </div>
        )}

        {authUser && isCheckingQuota && !quota && (
          <p className="mt-4 text-xs text-outline-variant">Checking your plan usage…</p>
        )}

        <form onSubmit={onSubmit} className="mt-9 space-y-7">
          <div>
            <label className="mb-2 block text-[13px] font-medium text-on-surface-variant">
              What are you trying to do?
            </label>
            <p className="-mt-1 mb-2.5 text-[12px] text-outline-variant">
              Describe your goal — big or small, personal or professional.
            </p>
            <textarea
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              className={textareaCls}
              placeholder={'I am trying to...\n\ne.g. Start a small online business, switch careers, save money each month, learn a new skill...'}
              required
              disabled={formDisabled}
            />
          </div>

          <div>
            <label className="mb-2 block text-[13px] font-medium text-on-surface-variant">
              What is blocking you right now?
            </label>
            <p className="-mt-1 mb-2.5 text-[12px] text-outline-variant">
              Be honest — the more specific, the better your paths will be.
            </p>
            <textarea
              value={blockage}
              onChange={(e) => setBlockage(e.target.value)}
              className={textareaCls}
              placeholder={'The main blocker is...\n\ne.g. I don\'t know where to start, I have no money, I\'m afraid of failing, I lack time...'}
              required
              disabled={formDisabled}
            />
          </div>

          <div>
            <label className="mb-2 block text-[13px] font-medium text-on-surface-variant">
              Category
            </label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full cursor-pointer appearance-none rounded-[14px] border border-white/[0.08] bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none transition focus:border-primary-container/40 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={formDisabled}
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-outline-variant">
                ▾
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-[14px] border border-white/[0.08] bg-surface-container-low px-4 py-4">
            <div>
              <p className="text-sm font-medium text-on-surface">Include downloadable resources</p>
              <p className="text-[12px] text-outline-variant">Guides and checklists where available</p>
            </div>
            <Toggle checked={wantsDownloads} onChange={setWantsDownloads} />
          </div>

          <button
            type="submit"
            disabled={formDisabled}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary-container px-8 py-4 text-base font-semibold text-[#1a0d06] shadow-[0_6px_28px_rgba(244,162,97,0.24)] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_36px_rgba(244,162,97,0.32)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 active:scale-[0.98]"
          >
            {guestAtLimit
              ? 'Sign in to continue'
              : atLimit
                ? 'Monthly limit reached'
                : isSubmitting
                  ? 'Mapping your paths…'
                  : 'Map My Paths Forward →'}
          </button>

          {!atLimit && (
            <p className="text-center text-[12px] text-outline-variant">
              Estimated time: under 30 seconds
            </p>
          )}

          {atLimit && authUser && (
            <p className="text-center text-xs text-outline-variant">
              Upgrade for unlimited analyses, or wait until your free quota resets.
            </p>
          )}
        </form>
      </motion.main>
    </PageWrapper>
  )
}
