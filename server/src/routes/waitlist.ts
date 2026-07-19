import { Router } from 'express'
import type { Request, Response } from 'express'
import { supabase } from '../services/supabase.js'

const router = Router()

// POST /waitlist — join waitlist (public, no auth required)
router.post('/', async (req: Request, res: Response) => {
  const { email, plan } = req.body as { email?: string; plan?: string }

  if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ success: false, error: 'A valid email address is required.' })
  }

  const validPlans = ['navigator', 'guide']
  const cleanPlan  = validPlans.includes(plan || '') ? plan! : 'navigator'

  const { error } = await supabase
    .from('waitlist')
    .insert({ email: email.trim().toLowerCase(), plan: cleanPlan })

  if (error) {
    // Unique constraint = already joined
    if (error.code === '23505') {
      return res.json({ success: true, alreadyJoined: true })
    }
    console.error('[DB] waitlist insert failed:', error.message)
    return res.status(500).json({ success: false, error: 'Failed to join waitlist. Please try again.' })
  }

  // Get current counts for social proof display
  const [{ count: total }, { count: navigator }, { count: guide }] = await Promise.all([
    supabase.from('waitlist').select('id', { count: 'exact', head: true }),
    supabase.from('waitlist').select('id', { count: 'exact', head: true }).eq('plan', 'navigator'),
    supabase.from('waitlist').select('id', { count: 'exact', head: true }).eq('plan', 'guide'),
  ])

  return res.json({
    success: true,
    counts: {
      total:    total    ?? 0,
      byPlan: { navigator: navigator ?? 0, guide: guide ?? 0 },
    },
  })
})

export default router
