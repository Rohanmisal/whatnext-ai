import { Link } from 'react-router-dom'
import { LogIn, UserPlus } from 'lucide-react'
import { GUEST_ANALYSIS_LIMIT } from '../constants/guest'

type GuestAuthBannerProps = {
  analysesUsed: number
  variant?: 'default' | 'exhausted'
}

const btnClass =
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all hover:opacity-95 active:scale-[0.98]'

export default function GuestAuthBanner({ analysesUsed, variant = 'default' }: GuestAuthBannerProps) {
  const exhausted = variant === 'exhausted' || analysesUsed >= GUEST_ANALYSIS_LIMIT
  const remaining = Math.max(0, GUEST_ANALYSIS_LIMIT - analysesUsed)

  return (
    <div
      className={`rounded-2xl border px-5 py-4 ${
        exhausted
          ? 'border-primary/30 bg-primary/10'
          : 'border-white/10 bg-surface-container-low'
      }`}
    >
      <p className="text-sm font-semibold text-on-surface">
        {exhausted ? 'Your free guest analysis is used' : 'Trying WhatNext as a guest'}
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-on-surface-variant">
        {exhausted ? (
          <>
            Sign in or create a free account to run more analyses, save paths, and use follow-up chat.
          </>
        ) : (
          <>
            You get <span className="font-medium text-primary">{remaining}</span> free{' '}
            {remaining === 1 ? 'analysis' : 'analyses'} without signing in. Create an account for 3 analyses
            per month, history, and chat.
          </>
        )}
      </p>
      <div className="mt-4 flex flex-wrap gap-2.5">
        <Link
          to="/sign-in"
          className={`${btnClass} border border-white/15 bg-surface-container-high text-on-surface hover:border-primary/30`}
        >
          <LogIn className="size-4" aria-hidden />
          Sign in
        </Link>
        <Link
          to="/sign-up"
          className={`${btnClass} bg-primary text-on-primary`}
        >
          <UserPlus className="size-4" aria-hidden />
          Create free account
        </Link>
      </div>
    </div>
  )
}
