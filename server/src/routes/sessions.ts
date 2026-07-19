import { Router } from 'express'
import type { Request, Response } from 'express'
import { requireAuth } from '../middleware/authMiddleware.js'
import { supabase }    from '../services/supabase.js'

const router = Router()

function computePathProgress(
  stepCount: number,
  completedByIndex: boolean[] | undefined
): { completedSteps: number; progressPercent: number } {
  if (stepCount <= 0) return { completedSteps: 0, progressPercent: 0 }
  const completedSteps = Array.from({ length: stepCount }, (_, idx) => Boolean(completedByIndex?.[idx])).filter(Boolean).length
  return {
    completedSteps,
    progressPercent: Math.round((completedSteps / stepCount) * 100),
  }
}

// GET /sessions — list all sessions for the authenticated user
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id

  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('id, category, situation, summary, status, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('[DB] sessions list failed:', error.message)
    return res.status(500).json({ success: false, error: 'Failed to fetch sessions.' })
  }

  const sessionList = sessions || []
  if (sessionList.length === 0) {
    return res.json({ success: true, data: [] })
  }

  const sessionIds = sessionList.map((s) => s.id)
  const { data: paths } = await supabase
    .from('paths')
    .select('id, session_id, steps')
    .in('session_id', sessionIds)

  const pathRows = paths || []
  const pathIds = pathRows.map((p) => p.id)
  const progressByPathId: Record<string, boolean[]> = {}

  if (pathIds.length > 0) {
    const { data: progress } = await supabase
      .from('path_step_progress')
      .select('path_id, step_index, completed')
      .eq('user_id', userId)
      .in('path_id', pathIds)

    for (const row of progress || []) {
      if (!progressByPathId[row.path_id]) progressByPathId[row.path_id] = []
      progressByPathId[row.path_id][row.step_index] = row.completed
    }
  }

  const pathsBySession = new Map<string, typeof pathRows>()
  for (const path of pathRows) {
    const bucket = pathsBySession.get(path.session_id) ?? []
    bucket.push(path)
    pathsBySession.set(path.session_id, bucket)
  }

  const enriched = sessionList.map((session) => {
    if (session.status === 'completed') {
      return { ...session, progress_percent: 100, completed_steps: null, total_steps: null }
    }
    if (session.status === 'abandoned') {
      return { ...session, progress_percent: 0, completed_steps: null, total_steps: null }
    }

    const sessionPaths = pathsBySession.get(session.id) ?? []
    let bestProgress = 0
    let bestCompleted = 0
    let bestTotal = 0

    for (const path of sessionPaths) {
      const steps = Array.isArray(path.steps) ? path.steps : []
      const { completedSteps, progressPercent } = computePathProgress(
        steps.length,
        progressByPathId[path.id]
      )
      if (progressPercent > bestProgress) {
        bestProgress = progressPercent
        bestCompleted = completedSteps
        bestTotal = steps.length
      }
    }

    return {
      ...session,
      progress_percent: bestProgress,
      completed_steps: bestTotal > 0 ? bestCompleted : null,
      total_steps: bestTotal > 0 ? bestTotal : null,
    }
  })

  return res.json({ success: true, data: enriched })
})

// GET /sessions/:id — full session with paths and step progress
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  const userId    = req.user!.id
  const sessionId = req.params.id

  const { data: session, error: sessionErr } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single()

  if (sessionErr || !session) {
    return res.status(404).json({ success: false, error: 'Session not found.' })
  }

  const { data: paths, error: pathsErr } = await supabase
    .from('paths')
    .select('*')
    .eq('session_id', sessionId)
    .order('path_order', { ascending: true })

  if (pathsErr) {
    console.error('[DB] paths fetch failed:', pathsErr.message)
    return res.status(500).json({ success: false, error: 'Failed to fetch paths.' })
  }

  // Fetch step progress for each path
  const pathIds = (paths || []).map((p) => p.id)
  let stepProgress: Record<string, boolean[]> = {}

  if (pathIds.length > 0) {
    const { data: progress } = await supabase
      .from('path_step_progress')
      .select('path_id, step_index, completed')
      .eq('user_id', userId)
      .in('path_id', pathIds)

    if (progress) {
      for (const row of progress) {
        if (!stepProgress[row.path_id]) stepProgress[row.path_id] = []
        stepProgress[row.path_id][row.step_index] = row.completed
      }
    }
  }

  // Fetch chat messages
  const { data: messages } = await supabase
    .from('chat_messages')
    .select('id, path_id, role, content, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  return res.json({
    success: true,
    data: { ...session, paths: paths || [], stepProgress, messages: messages || [] },
  })
})

// PATCH /sessions/:id/status — mark session as completed or abandoned
router.patch('/:id/status', requireAuth, async (req: Request, res: Response) => {
  const userId    = req.user!.id
  const sessionId = req.params.id
  const { status } = req.body as { status: 'in-progress' | 'completed' | 'abandoned' }

  const validStatuses = ['in-progress', 'completed', 'abandoned']
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status value.' })
  }

  const { error } = await supabase
    .from('sessions')
    .update({ status })
    .eq('id', sessionId)
    .eq('user_id', userId)

  if (error) {
    return res.status(500).json({ success: false, error: 'Failed to update session status.' })
  }

  return res.json({ success: true })
})

// PATCH /sessions/:id/paths/:pathId/steps/:stepIndex — toggle step completion
router.patch('/:id/paths/:pathId/steps/:stepIndex', requireAuth, async (req: Request, res: Response) => {
  const userId     = req.user!.id
  const sessionId  = req.params.id as string
  const pathId    = req.params.pathId    as string
  const stepIndex = req.params.stepIndex as string
  const stepIdx   = parseInt(stepIndex, 10)
  const { completed } = req.body as { completed: boolean }

  if (isNaN(stepIdx)) {
    return res.status(400).json({ success: false, error: 'Invalid step index.' })
  }

  const { data: ownedSession, error: sessionErr } = await supabase
    .from('sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single()

  if (sessionErr || !ownedSession) {
    return res.status(404).json({ success: false, error: 'Session not found.' })
  }

  const { data: ownedPath, error: pathErr } = await supabase
    .from('paths')
    .select('id')
    .eq('id', pathId)
    .eq('session_id', sessionId)
    .single()

  if (pathErr || !ownedPath) {
    return res.status(404).json({ success: false, error: 'Path not found for this session.' })
  }

  const completedAt = completed ? new Date().toISOString() : null

  const { error } = await supabase
    .from('path_step_progress')
    .upsert(
      { path_id: pathId, user_id: userId, step_index: stepIdx, completed, completed_at: completedAt },
      { onConflict: 'path_id,user_id,step_index' }
    )

  if (error) {
    console.error('[DB] step progress upsert failed:', error.message)
    return res.status(500).json({ success: false, error: 'Failed to save step progress.' })
  }

  return res.json({ success: true, completed, completedAt })
})

export default router
