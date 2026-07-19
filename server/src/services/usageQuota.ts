import { supabase } from './supabase.js'
import type { SubscriptionTier } from '../types/index.js'

const PLAN_LIMITS: Record<SubscriptionTier, { analyses: number }> = {
  explorer:  { analyses: 3 },
  navigator: { analyses: Infinity },
  guide:     { analyses: Infinity },
}

export interface AnalysisQuota {
  allowed:   boolean
  used:      number
  limit:     number | null
  resetAt:   string
  message:   string | null
  tier:      SubscriptionTier
}

export function getNextMonthResetIso(): string {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()
}

export function formatResetLabel(resetAt: string): string {
  return new Date(resetAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })
}

export async function getAnalysisQuota(
  userId: string,
  tier: SubscriptionTier,
): Promise<AnalysisQuota> {
  const resetAt = getNextMonthResetIso()
  const limit = PLAN_LIMITS[tier].analyses

  if (limit === Infinity) {
    return { allowed: true, used: 0, limit: null, resetAt, message: null, tier }
  }

  const { data: usage } = await supabase
    .from('user_usage')
    .select('analyses_this_month')
    .eq('user_id', userId)
    .single()

  const used = usage?.analyses_this_month ?? 0
  const allowed = used < limit
  const message = allowed
    ? null
    : `You've used all ${limit} free analyses this month. Resets on ${formatResetLabel(resetAt)}.`

  return { allowed, used, limit, resetAt, message, tier }
}
