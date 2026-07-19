import { Router }  from 'express'
import rateLimit    from 'express-rate-limit'
import type { Request, Response } from 'express'
import { optionalAuth }         from '../middleware/authMiddleware.js'
import { analyzeUsageLimiter }  from '../middleware/usageLimiter.js'
import { supabase }             from '../services/supabase.js'
import {
  listCandidateProviders,
  pickRuntimeProvider,
  allowMockFallback,
  createAnalyzeWithAnthropic,
  createAnalyzeWithGemini,
  buildMockAnalysis,
  getErrorMessage,
  parseErrorPayload,
  isFallbackError,
  isTransientAiError,
} from '../services/ai.js'
import { captureServerException } from '../services/sentry.js'
import type { AiAnalysisResult, AiPath } from '../types/index.js'

const router = Router()

// Stricter rate limit specifically for /analyze — calling the AI is expensive
const analyzeRateLimit = rateLimit({
  windowMs:        60 * 60 * 1000, // 1 hour
  max:             20,              // 20 AI calls / hour per IP
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, error: 'Analysis rate limit reached. Please wait before trying again.' },
})

// Input limits (characters)
const MAX_SITUATION_LEN = 2000
const MAX_BLOCKAGE_LEN  = 1000
const MAX_CATEGORY_LEN  = 100

router.post('/', analyzeRateLimit, optionalAuth, analyzeUsageLimiter, async (req: Request, res: Response) => {
  const { situation, blockage, category } = req.body as Record<string, unknown>

  // ---- Input validation ----
  if (typeof situation !== 'string' || situation.trim().length < 10) {
    return res.status(400).json({ success: false, error: 'Please describe your situation (at least 10 characters).' })
  }
  if (typeof blockage !== 'string' || blockage.trim().length < 5) {
    return res.status(400).json({ success: false, error: 'Please describe what is blocking you (at least 5 characters).' })
  }
  if (typeof category !== 'string' || !category.trim()) {
    return res.status(400).json({ success: false, error: 'Category is required.' })
  }
  if (situation.length > MAX_SITUATION_LEN) {
    return res.status(400).json({ success: false, error: `Situation must be under ${MAX_SITUATION_LEN} characters.` })
  }
  if (blockage.length > MAX_BLOCKAGE_LEN) {
    return res.status(400).json({ success: false, error: `Blockage must be under ${MAX_BLOCKAGE_LEN} characters.` })
  }
  if (category.length > MAX_CATEGORY_LEN) {
    return res.status(400).json({ success: false, error: 'Invalid category.' })
  }

  const cleanSituation = situation.trim()
  const cleanBlockage  = blockage.trim()
  const cleanCategory  = category.trim()

  const provider = pickRuntimeProvider()
  if (!provider) {
    return res.status(500).json({
      success: false,
      error: 'AI service is not configured. Contact support.',
    })
  }

  try {
    const candidates = listCandidateProviders()
    let analysisData: AiAnalysisResult | null = null
    let usedProvider = ''
    let lastError: unknown = null

    for (let i = 0; i < candidates.length; i++) {
      const current = candidates[i]
      try {
        analysisData = current === 'anthropic'
          ? await createAnalyzeWithAnthropic({ situation: cleanSituation, blockage: cleanBlockage, category: cleanCategory })
          : await createAnalyzeWithGemini({ situation: cleanSituation, blockage: cleanBlockage, category: cleanCategory })
        usedProvider = current
        break
      } catch (err) {
        lastError = err
        const message = getErrorMessage(err, 'Analysis failed')
        if (!isFallbackError(message) || i === candidates.length - 1) break
      }
    }

    if (!analysisData) throw lastError || new Error('Analysis failed')

    // -- Persist to DB when user is authenticated --
    let sessionId: string | undefined
    let pathIds: Record<string, string> | undefined

    if (req.user) {
      const userId = req.user.id

      const { data: session, error: sessionErr } = await supabase
        .from('sessions')
        .insert({
          user_id:  userId,
          category: cleanCategory,
          situation: cleanSituation,
          blockage:  cleanBlockage,
          summary:   analysisData.summary,
          status:    'in-progress',
        })
        .select('id')
        .single()

      if (sessionErr) {
        console.error('[DB] session insert failed:', sessionErr.message)
      } else {
        sessionId = session.id

        const pathRows = analysisData.paths.map((p: AiPath, idx: number) => ({
          session_id:     session.id,
          path_order:     idx + 1,
          title:          p.title          || '',
          description:    p.description    || '',
          difficulty:     p.difficulty     || 'Easy',
          time_estimate:  p.timeEstimate   || '',
          steps:          p.steps          || [],
          why_it_works:   p.whyItWorks     || '',
          common_mistake: p.commonMistake  || '',
          tools:          p.tools          || [],
          has_download:   Boolean(p.hasDownload),
          recommended:    Boolean(p.recommended),
        }))

        const { data: insertedPaths, error: pathErr } = await supabase
          .from('paths')
          .insert(pathRows)
          .select('id, path_order')
        if (pathErr) {
          console.error('[DB] paths insert failed:', pathErr.message)
        } else if (insertedPaths?.length) {
          pathIds = Object.fromEntries(
            insertedPaths.map((row) => [String(row.path_order), row.id as string])
          )
        }

        // Increment monthly usage counter
        const { data: currentUsage } = await supabase
          .from('user_usage')
          .select('analyses_this_month')
          .eq('user_id', userId)
          .single()

        await supabase
          .from('user_usage')
          .update({ analyses_this_month: (currentUsage?.analyses_this_month ?? 0) + 1 })
          .eq('user_id', userId)
      }
    }

    return res.json({ success: true, provider: usedProvider, sessionId, pathIds, data: analysisData })

  } catch (err) {
    console.error('[ANALYZE_ERROR]', err)
    captureServerException(err, { area: 'analyze_route', route: '/analyze', status: 500 })
    const rawMsg   = getErrorMessage(err, 'Analysis failed')
    const parsed   = parseErrorPayload(rawMsg)
    const cleanMsg = parsed?.message || rawMsg

    if (allowMockFallback()) {
      return res.json({
        success: true,
        provider: 'mock',
        data: buildMockAnalysis({ situation: cleanSituation, blockage: cleanBlockage, category: cleanCategory }),
      })
    }

    const isProd = process.env.NODE_ENV === 'production'
    const transient = isTransientAiError(err)
    return res.status(transient ? 503 : 500).json({
      success: false,
      error: isProd
        ? (transient ? 'AI service is busy. Please try again in a moment.' : 'Analysis failed. Please try again.')
        : cleanMsg,
    })
  }
})

export default router
