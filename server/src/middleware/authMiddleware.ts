import type { Request, Response, NextFunction } from 'express'
import { supabase } from '../services/supabase.js'
import type { SubscriptionTier } from '../types/index.js'

// ----------------------------------------------------------------
// requireAuth — hard 401 if no valid JWT
// Use on routes that MUST have a logged-in user.
// ----------------------------------------------------------------
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractBearerToken(req)
  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required. Please sign in.' })
  }

  const user = await verifyAndLoadUser(token)
  if (!user) {
    return res.status(401).json({ success: false, error: 'Invalid or expired session. Please sign in again.' })
  }

  req.user = user
  next()
}

// ----------------------------------------------------------------
// optionalAuth — silently attaches user if token present, never 401
// Use on routes that work both authenticated and anonymous.
// ----------------------------------------------------------------
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractBearerToken(req)
  if (token) {
    const user = await verifyAndLoadUser(token)
    if (user) req.user = user
  }
  next()
}

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) return null
  const token = header.slice(7).trim()
  return token || null
}

async function verifyAndLoadUser(token: string) {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return null

    const { data: usage } = await supabase
      .from('user_usage')
      .select('subscription_tier')
      .eq('user_id', user.id)
      .single()

    return {
      id:                user.id,
      email:             user.email || '',
      subscription_tier: (usage?.subscription_tier ?? 'explorer') as SubscriptionTier,
    }
  } catch {
    return null
  }
}
