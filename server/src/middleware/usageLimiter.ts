import type { Request, Response, NextFunction } from 'express'
import { supabase } from '../services/supabase.js'
import { getAnalysisQuota } from '../services/usageQuota.js'

// ---- Plan limits ------------------------------------------------

const PLAN_LIMITS = {
  explorer:  { analyses: 3,        chatMsgsPerSession: 5 },
  navigator: { analyses: Infinity, chatMsgsPerSession: Infinity },
  guide:     { analyses: Infinity, chatMsgsPerSession: Infinity },
} as const

// ---- Analyses quota (monthly) -----------------------------------

/**
 * Runs after requireAuth / optionalAuth.
 * Blocks the request with 429 when an Explorer user has used all 3
 * monthly analyses. Silently passes through if no user is attached
 * (anonymous usage) — auth enforcement is separate.
 */
export async function analyzeUsageLimiter(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const user = req.user
  if (!user) return next() // unauthenticated — let auth middleware handle it

  const limits = PLAN_LIMITS[user.subscription_tier]
  if (limits.analyses === Infinity) return next()

  try {
    const quota = await getAnalysisQuota(user.id, user.subscription_tier)

    if (!quota.allowed && quota.limit != null) {
      return res.status(429).json({
        success:   false,
        error:     'LIMIT_REACHED',
        limitType: 'analyses',
        used:      quota.used,
        limit:     quota.limit,
        resetAt:   quota.resetAt,
        message:   quota.message,
      })
    }
  } catch (err) {
    // If usage check fails, don't block the user — log and continue
    console.error('[usageLimiter] analyses check failed:', err)
  }

  next()
}

// ---- Chat quota (per session) -----------------------------------

/**
 * Blocks with 429 when an Explorer user has sent 5 messages in
 * this specific session. Requires `sessionId` in the request body.
 */
export async function chatUsageLimiter(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const user = req.user
  if (!user) return next()

  const limits = PLAN_LIMITS[user.subscription_tier]
  if (limits.chatMsgsPerSession === Infinity) return next()

  const { sessionId } = req.body as { sessionId?: string }
  if (!sessionId) return next() // no session ID yet — first message

  try {
    const { data: ownedSession, error: sessionErr } = await supabase
      .from('sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (sessionErr || !ownedSession) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN_SESSION',
        message: 'You do not have access to this session.',
      })
    }

    const { count } = await supabase
      .from('chat_messages')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .eq('role', 'user')

    const used = count ?? 0

    if (used >= limits.chatMsgsPerSession) {
      return res.status(429).json({
        success:   false,
        error:     'LIMIT_REACHED',
        limitType: 'chat',
        used,
        limit:     limits.chatMsgsPerSession,
        message:   `You've reached the ${limits.chatMsgsPerSession} message limit for this session on the free plan.`,
      })
    }
  } catch (err) {
    console.error('[usageLimiter] chat check failed:', err)
  }

  next()
}
