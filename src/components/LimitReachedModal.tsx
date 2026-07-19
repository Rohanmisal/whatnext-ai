import { useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowRight, X } from 'lucide-react'
import type { LimitReachedPayload } from '../services/api'

type LimitReachedModalProps = {
  open: boolean
  payload: LimitReachedPayload | null
  onClose: () => void
}

function formatResetDate(iso?: string): string | null {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })
  } catch {
    return null
  }
}

export default function LimitReachedModal({ open, payload, onClose }: LimitReachedModalProps) {
  const navigate = useNavigate()

  if (!open || !payload) return null

  const resetLabel = formatResetDate(payload.resetAt)
  const isAnalyses = payload.limitType === 'analyses'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="limit-reached-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-amber-500/25 bg-surface-container p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-400">
            <AlertCircle className="h-5 w-5" aria-hidden />
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-outline transition-colors hover:bg-surface-container-high hover:text-on-surface"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h2 id="limit-reached-title" className="font-display text-xl font-semibold text-on-surface">
          {isAnalyses ? 'Monthly analysis limit reached' : 'Chat message limit reached'}
        </h2>

        <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">{payload.message}</p>

        <div className="mt-4 rounded-xl border border-white/10 bg-surface-container-low px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wider text-outline-variant">
            {isAnalyses ? 'Usage this month' : 'This session'}
          </p>
          <p className="mt-1 font-display text-2xl font-bold text-primary">
            {payload.used} <span className="text-base font-normal text-outline">/ {payload.limit}</span>
          </p>
          {resetLabel && isAnalyses && (
            <p className="mt-2 text-xs text-outline-variant">Resets on {resetLabel}</p>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 cursor-pointer rounded-xl border border-white/15 bg-surface-container-high py-3 text-sm font-semibold text-on-surface-variant transition-all hover:border-white/25 hover:bg-surface-container-highest hover:text-on-surface active:scale-[0.98]"
          >
            Got it
          </button>
          {isAnalyses && (
            <button
              type="button"
              onClick={() => {
                onClose()
                navigate('/pricing')
              }}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-br from-primary-container to-primary py-3 text-sm font-semibold text-on-primary transition-all hover:opacity-95 active:scale-[0.98]"
            >
              Upgrade plan
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
