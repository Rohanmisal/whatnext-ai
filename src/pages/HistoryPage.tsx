import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Plus } from 'lucide-react'
import { motion } from 'motion/react'
import PageWrapper from '../components/layout/PageWrapper'
import useAppStore from '../store/useAppStore'
import { fetchSessions } from '../services/api'
import { getSessionProgressMeta } from '../lib/sessionProgress'

interface SessionSummary {
  id: string
  category: string
  situation: string
  summary: string
  status: string
  created_at: string
  progress_percent?: number
  completed_steps?: number | null
  total_steps?: number | null
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
}

function groupLabel(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 14) return '1 week ago'
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  if (days < 60) return '1 month ago'
  return `${Math.floor(days / 30)} months ago`
}

function groupSessions(sessions: SessionSummary[]): Array<{ label: string; items: SessionSummary[] }> {
  const map = new Map<string, SessionSummary[]>()
  for (const session of sessions) {
    const label = groupLabel(session.created_at)
    const bucket = map.get(label) ?? []
    bucket.push(session)
    map.set(label, bucket)
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }))
}

function truncate(text: string, max = 72): string {
  const trimmed = text.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max).trim()}…`
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-white/5 ${className ?? ''}`} />
}

function HistoryCard({
  session,
  onOpen,
}: {
  session: SessionSummary
  onOpen: () => void
}) {
  const meta = getSessionProgressMeta(
    session.status,
    session.progress_percent ?? 0,
    session.completed_steps ?? undefined,
    session.total_steps ?? undefined
  )

  return (
    <motion.article
      variants={fadeUp}
      className="mb-3 block w-full cursor-pointer rounded-[20px] border border-white/[0.08] bg-surface-container-low p-6 text-left transition-all hover:translate-x-0.5 hover:border-white/[0.12] sm:px-7"
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen()
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="mb-2.5 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.09em] text-primary-container">
            {session.category}
          </p>
          <h2 className="font-display text-[17px] font-semibold leading-snug tracking-tight text-on-surface">
            {truncate(session.situation, 80)}
          </h2>
        </div>
        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium whitespace-nowrap ${meta.pill}`}
        >
          {meta.label}
        </span>
      </div>

      {session.summary && (
        <p className="mb-4 text-[13px] font-light italic leading-relaxed text-on-surface-variant">
          "{truncate(session.summary, 160)}"
        </p>
      )}

      <div className="mb-4 flex items-center gap-3">
        <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-surface-container-highest">
          <div
            className={`h-full rounded-full transition-all duration-500 ${meta.progressColor}`}
            style={{ width: `${meta.progress}%` }}
          />
        </div>
        <span className={`whitespace-nowrap text-[12px] ${meta.progressLabelColor}`}>
          {meta.progressLabel}
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-[12px] text-outline-variant">
          <span>{session.category} session</span>
          <span className="flex items-center gap-1.5">
            <span className="size-1 rounded-full bg-white/15" />
            {groupLabel(session.created_at)}
          </span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onOpen()
          }}
          className="rounded-full border border-primary-container/25 bg-primary-container/10 px-4 py-2 text-[13px] font-medium text-primary-container transition hover:bg-primary-container/15"
        >
          {meta.action}
        </button>
      </div>
    </motion.article>
  )
}

export default function HistoryPage() {
  const navigate = useNavigate()
  const authUser = useAppStore((s) => s.user)

  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSessions = (silent = false) => {
    if (!silent) {
      setIsLoading(true)
      setError(null)
    }
    return fetchSessions()
      .then((data) => {
        setSessions(data as SessionSummary[])
      })
      .catch(() => {
        if (!silent) setError('Could not load history. Please try again.')
      })
      .finally(() => {
        if (!silent) setIsLoading(false)
      })
  }

  useEffect(() => {
    if (!authUser) {
      setIsLoading(false)
      return
    }

    void loadSessions()
  }, [authUser])

  useEffect(() => {
    if (!authUser) return

    const onFocus = () => {
      void loadSessions(true)
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [authUser])

  const grouped = useMemo(() => groupSessions(sessions), [sessions])

  return (
    <PageWrapper>
      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mx-auto max-w-[800px] px-5 pb-24 pt-28 sm:px-6"
      >
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="flex items-center gap-2.5 font-display text-[28px] font-bold tracking-tight text-on-surface">
            <span className="text-2xl" aria-hidden>
              🕐
            </span>
            History
          </h1>
          <button
            type="button"
            onClick={() => navigate('/input')}
            className="inline-flex items-center justify-center gap-1.5 self-start rounded-full bg-primary-container px-5 py-2.5 text-[13px] font-medium text-[#1a0d06] transition hover:-translate-y-0.5 hover:opacity-95 sm:self-auto"
          >
            <Plus className="size-4" aria-hidden />
            New Session
          </button>
        </div>

        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-[20px] border border-white/[0.08] bg-surface-container-low p-6 space-y-3"
              >
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-1 w-full" />
                <Skeleton className="h-8 w-32" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-[20px] border border-red-500/20 bg-red-500/10 p-6 text-center">
            <p className="text-sm text-red-300">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-3 text-xs text-primary-container hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !error && !authUser && (
          <div className="rounded-[20px] border border-white/[0.08] bg-surface-container-low p-8 text-center">
            <p className="mb-4 text-on-surface-variant">
              Sign in to see your full session history saved across devices.
            </p>
            <button
              type="button"
              onClick={() => navigate('/sign-in')}
              className="inline-flex items-center gap-2 rounded-full bg-primary-container px-5 py-2.5 text-sm font-semibold text-[#1a0d06] transition hover:opacity-90"
            >
              Sign in <ArrowRight className="size-4" />
            </button>
          </div>
        )}

        {!isLoading && !error && authUser && sessions.length === 0 && (
          <div className="rounded-[20px] border border-white/[0.08] bg-surface-container-low p-8 text-center">
            <p className="mb-4 text-on-surface-variant">
              No sessions yet. Start your first analysis to see your history here.
            </p>
            <button
              type="button"
              onClick={() => navigate('/input')}
              className="inline-flex items-center gap-2 rounded-full bg-primary-container px-5 py-2.5 text-sm font-semibold text-[#1a0d06] transition hover:opacity-90"
            >
              Start an analysis <ArrowRight className="size-4" />
            </button>
          </div>
        )}

        {!isLoading && !error && grouped.length > 0 && (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.05 } } }}
          >
            {grouped.map((group, groupIndex) => (
              <div key={group.label} className={groupIndex > 0 ? 'mt-7' : ''}>
                <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.08em] text-outline-variant">
                  {group.label}
                </p>
                {group.items.map((session) => (
                  <HistoryCard
                    key={session.id}
                    session={session}
                    onOpen={() => navigate(`/sessions/${session.id}`)}
                  />
                ))}
              </div>
            ))}
          </motion.div>
        )}

        {!isLoading && !error && authUser && (
          <button
            type="button"
            onClick={() => navigate('/input')}
            className="mt-8 flex w-full items-center gap-5 rounded-[20px] border border-white/[0.08] bg-surface-container-low p-6 text-left transition hover:-translate-y-0.5 hover:border-primary-container/25"
          >
            <span className="text-[30px] opacity-50" aria-hidden>
              🧭
            </span>
            <div className="min-w-0 flex-1">
              <strong className="mb-1 block text-sm font-medium text-on-surface">
                Start a new navigation
              </strong>
              <span className="text-[13px] font-light text-outline-variant">
                Describe a new situation and get fresh paths forward in under 60 seconds.
              </span>
            </div>
            <span className="shrink-0 text-xl text-outline-variant" aria-hidden>
              →
            </span>
          </button>
        )}
      </motion.main>
    </PageWrapper>
  )
}
