import { Router } from 'express'
import type { Request, Response } from 'express'
import { requireAuth } from '../middleware/authMiddleware.js'
import { supabase }    from '../services/supabase.js'
import { getAnalysisQuota } from '../services/usageQuota.js'
import { captureServerException } from '../services/sentry.js'
import type { SubscriptionTier } from '../types/index.js'

const router = Router()

const PLAN_LIMITS: Record<SubscriptionTier, { analyses: number | null; chat: number | null }> = {
  explorer:  { analyses: 3,    chat: 5    },
  navigator: { analyses: null, chat: null },
  guide:     { analyses: null, chat: null },
}

// GET /users/me/quota — analysis allowance (check before starting an analysis)
router.get('/me/quota', requireAuth, async (req: Request, res: Response) => {
  try {
    const quota = await getAnalysisQuota(req.user!.id, req.user!.subscription_tier)
    return res.json({ success: true, data: quota })
  } catch (err) {
    console.error('[users] quota check failed:', err)
    captureServerException(err, { area: 'users_quota_route', route: '/users/me/quota', status: 500 })
    return res.status(500).json({ success: false, error: 'Could not check usage quota.' })
  }
})

// GET /users/me — full profile + live usage + stats
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id

  const [
    { data: profile },
    { data: usage },
    { data: recentSessions },
    { count: totalSessions },
    { count: completedSessions },
  ] = await Promise.all([
    supabase.from('users').select('*').eq('id', userId).single(),
    supabase.from('user_usage').select('*').eq('user_id', userId).single(),
    supabase
      .from('sessions')
      .select('id, category, situation, summary, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed'),
  ])

  if (!profile || !usage) {
    return res.status(404).json({ success: false, error: 'User profile not found.' })
  }

  const tier   = usage.subscription_tier as SubscriptionTier
  const limits = PLAN_LIMITS[tier]

  const now             = new Date()
  const resetAt         = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()
  const analysesUsed    = usage.analyses_this_month ?? 0
  const analysesLimit   = limits.analyses
  const analysesPercent = analysesLimit
    ? Math.min(Math.round((analysesUsed / analysesLimit) * 100), 100)
    : 0

  return res.json({
    success: true,
    data: {
      user: {
        id:                profile.id,
        email:             profile.email,
        displayName:       profile.display_name    ?? null,
        avatarUrl:         profile.avatar_url      ?? null,
        location:          profile.location        ?? null,
        lifeStage:         profile.life_stage      ?? null,
        preferredLanguage: profile.preferred_language ?? 'English',
        createdAt:         profile.created_at,
      },
      plan: {
        tier,
        name: tier === 'explorer' ? 'Explorer — Free'
            : tier === 'navigator' ? 'Navigator'
            : 'Guide',
        desc: tier === 'explorer'
            ? '3 analyses/month · 5 messages per session'
            : 'Unlimited analyses & chat',
      },
      usage: {
        analyses: {
          used:    analysesUsed,
          limit:   analysesLimit,
          percent: analysesPercent,
          resetAt,
          label:   analysesLimit ? `${analysesUsed} / ${analysesLimit} used` : 'Unlimited',
        },
        chat: {
          limit: limits.chat,
          label: limits.chat ? `${limits.chat} messages per session` : 'Unlimited',
        },
      },
      stats: {
        totalSessions:     totalSessions     ?? 0,
        completedSessions: completedSessions ?? 0,
      },
      recentSessions: (recentSessions ?? []).map((s) => ({
        id:        s.id,
        situation: s.situation,
        summary:   s.summary,
        status:    s.status,
        createdAt: s.created_at,
      })),
    },
  })
})

const AVATAR_BUCKET = 'avatars'
const ALLOWED_AVATAR_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const MAX_AVATAR_BYTES = 2 * 1024 * 1024

const extForMime = (mime: string): string => {
  switch (mime) {
    case 'image/png':  return 'png'
    case 'image/webp': return 'webp'
    case 'image/gif':  return 'gif'
    default:           return 'jpg'
  }
}

// PATCH /users/me — update editable profile fields
router.patch('/me', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id
  const { displayName, location, lifeStage, preferredLanguage, avatarUrl } = req.body as {
    displayName?:       string
    location?:          string
    lifeStage?:         string
    preferredLanguage?: string
    avatarUrl?:         string | null
  }

  const updates: Record<string, string | null> = {}
  if (displayName       !== undefined) updates.display_name       = displayName.trim().slice(0, 100) || null
  if (location          !== undefined) updates.location           = location.trim().slice(0, 100) || null
  if (lifeStage         !== undefined) updates.life_stage         = lifeStage.trim().slice(0, 50) || null
  if (preferredLanguage !== undefined) updates.preferred_language = preferredLanguage.slice(0, 30)
  if (avatarUrl         !== undefined) updates.avatar_url         = avatarUrl

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ success: false, error: 'No fields to update.' })
  }

  const { error } = await supabase.from('users').update(updates).eq('id', userId)

  if (error) {
    return res.status(500).json({ success: false, error: 'Failed to update profile.' })
  }

  return res.json({ success: true })
})

// POST /users/me/avatar — upload profile photo (base64 JSON body)
router.post('/me/avatar', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id
  const { imageBase64, mimeType } = req.body as { imageBase64?: string; mimeType?: string }

  if (!imageBase64 || typeof imageBase64 !== 'string') {
    return res.status(400).json({ success: false, error: 'imageBase64 is required.' })
  }

  const mime = typeof mimeType === 'string' && ALLOWED_AVATAR_TYPES.has(mimeType)
    ? mimeType
    : 'image/jpeg'

  const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64
  let buffer: Buffer
  try {
    buffer = Buffer.from(base64Data, 'base64')
  } catch {
    return res.status(400).json({ success: false, error: 'Invalid image data.' })
  }

  if (buffer.length === 0 || buffer.length > MAX_AVATAR_BYTES) {
    return res.status(400).json({ success: false, error: 'Image must be between 1 byte and 2 MB.' })
  }

  const objectPath = `${userId}/avatar.${extForMime(mime)}`

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(objectPath, buffer, { contentType: mime, upsert: true })

  if (uploadError) {
    console.error('[Storage] avatar upload failed:', uploadError.message)
    return res.status(500).json({
      success: false,
      error: 'Failed to upload avatar. Ensure the avatars storage bucket exists in Supabase.',
    })
  }

  const { data: publicData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(objectPath)
  const avatarUrl = `${publicData.publicUrl}?t=${Date.now()}`

  const { error: dbError } = await supabase
    .from('users')
    .update({ avatar_url: avatarUrl })
    .eq('id', userId)

  if (dbError) {
    return res.status(500).json({ success: false, error: 'Failed to save avatar URL.' })
  }

  return res.json({ success: true, data: { avatarUrl } })
})

// DELETE /users/me/sessions — clear all session history
router.delete('/me/sessions', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id

  const { error } = await supabase.from('sessions').delete().eq('user_id', userId)

  if (error) {
    console.error('[DB] clear sessions failed:', error.message)
    return res.status(500).json({ success: false, error: 'Failed to clear history.' })
  }

  return res.json({ success: true })
})

// DELETE /users/me — permanently delete account
router.delete('/me', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id

  const { error: storageError } = await supabase.storage.from(AVATAR_BUCKET).remove([`${userId}/avatar.jpg`, `${userId}/avatar.png`, `${userId}/avatar.webp`, `${userId}/avatar.gif`])
  if (storageError) {
    console.warn('[Storage] avatar cleanup:', storageError.message)
  }

  const { error: authError } = await supabase.auth.admin.deleteUser(userId)

  if (authError) {
    console.error('[Auth] delete user failed:', authError.message)
    return res.status(500).json({ success: false, error: 'Failed to delete account.' })
  }

  return res.json({ success: true })
})

export default router
