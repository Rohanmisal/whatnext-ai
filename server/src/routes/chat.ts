import { Router }  from 'express'
import rateLimit    from 'express-rate-limit'
import type { Request, Response } from 'express'
import { optionalAuth }     from '../middleware/authMiddleware.js'
import { chatUsageLimiter } from '../middleware/usageLimiter.js'
import { supabase }         from '../services/supabase.js'
import {
  listCandidateProviders,
  pickRuntimeProvider,
  allowMockFallback,
  createChatWithAnthropic,
  createChatWithGemini,
  buildMockChatReply,
  getErrorMessage,
  parseErrorPayload,
  isFallbackError,
  isTransientAiError,
} from '../services/ai.js'
import { captureServerException } from '../services/sentry.js'

const router = Router()

// Stricter per-route rate limit for AI chat calls
const chatRateLimit = rateLimit({
  windowMs:        60 * 60 * 1000, // 1 hour
  max:             60,              // 60 messages / hour per IP
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, error: 'Chat rate limit reached. Please wait before sending more messages.' },
})

const MAX_MESSAGE_LEN    = 500
const MAX_CHOSEN_PATH_LEN = 200
const MAX_HISTORY_ITEMS   = 20

router.post('/', chatRateLimit, optionalAuth, chatUsageLimiter, async (req: Request, res: Response) => {
  const { message, history, chosenPath, sessionId, pathId } = req.body as Record<string, unknown>

  // ---- Input validation ----
  if (typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ success: false, error: 'Message is required.' })
  }
  if (message.length > MAX_MESSAGE_LEN) {
    return res.status(400).json({ success: false, error: `Message must be under ${MAX_MESSAGE_LEN} characters.` })
  }
  if (typeof chosenPath !== 'string' || !chosenPath.trim()) {
    return res.status(400).json({ success: false, error: 'chosenPath is required.' })
  }
  if (chosenPath.length > MAX_CHOSEN_PATH_LEN) {
    return res.status(400).json({ success: false, error: 'Invalid chosenPath.' })
  }
  if (!Array.isArray(history)) {
    return res.status(400).json({ success: false, error: 'history must be an array.' })
  }

  const cleanMessage    = message.trim()
  const cleanChosenPath = (chosenPath as string).trim()
  const cleanSessionId  = typeof sessionId === 'string' ? sessionId.trim() : ''
  // Cap history to last N messages to avoid prompt injection / token overflow
  const safeHistory = (history as Array<{ role: string; content: string }>)
    .slice(-MAX_HISTORY_ITEMS)
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content.slice(0, 500) }))

  const provider = pickRuntimeProvider()
  if (!provider) {
    return res.status(500).json({ success: false, error: 'AI service is not configured. Contact support.' })
  }

  try {
    if (req.user && cleanSessionId) {
      const { data: ownedSession, error: sessionErr } = await supabase
        .from('sessions')
        .select('id')
        .eq('id', cleanSessionId)
        .eq('user_id', req.user.id)
        .single()

      if (sessionErr || !ownedSession) {
        return res.status(403).json({
          success: false,
          error: 'FORBIDDEN_SESSION',
          message: 'You do not have access to this session.',
        })
      }

      if (typeof pathId === 'string' && pathId.trim()) {
        const { data: ownedPath, error: pathErr } = await supabase
          .from('paths')
          .select('id')
          .eq('id', pathId.trim())
          .eq('session_id', cleanSessionId)
          .single()

        if (pathErr || !ownedPath) {
          return res.status(403).json({
            success: false,
            error: 'FORBIDDEN_PATH',
            message: 'You do not have access to this path.',
          })
        }
      }
    }

    const candidates = listCandidateProviders()
    let reply = ''
    let usedProvider = ''
    let lastError: unknown = null

    for (let i = 0; i < candidates.length; i++) {
      const current = candidates[i]
      try {
        reply = current === 'anthropic'
          ? await createChatWithAnthropic({ message: cleanMessage, history: safeHistory, chosenPath: cleanChosenPath })
          : await createChatWithGemini({ message: cleanMessage, history: safeHistory, chosenPath: cleanChosenPath })
        usedProvider = current
        break
      } catch (err) {
        lastError = err
        const text = getErrorMessage(err, 'Chat failed')
        if (!isFallbackError(text) || i === candidates.length - 1) break
      }
    }

    if (!reply) throw lastError || new Error('Chat failed')

    // -- Persist messages to DB if user is authenticated and sessionId is provided --
    if (req.user && cleanSessionId) {
      const msgRows = [
        { session_id: cleanSessionId, path_id: typeof pathId === 'string' ? pathId : null, role: 'user' as const,      content: cleanMessage },
        { session_id: cleanSessionId, path_id: typeof pathId === 'string' ? pathId : null, role: 'assistant' as const, content: reply        },
      ]
      const { error: msgErr } = await supabase.from('chat_messages').insert(msgRows)
      if (msgErr) console.error('[DB] chat_messages insert failed:', msgErr.message)
    }

    return res.json({ success: true, provider: usedProvider, reply })

  } catch (err) {
    console.error('[CHAT_ERROR]', err)
    captureServerException(err, { area: 'chat_route', route: '/chat', status: 500 })
    const rawMsg   = getErrorMessage(err, 'Chat failed')
    const parsed   = parseErrorPayload(rawMsg)
    const cleanMsg = parsed?.message || rawMsg

    if (allowMockFallback()) {
      return res.json({ success: true, provider: 'mock', reply: buildMockChatReply(cleanMessage, cleanChosenPath) })
    }

    const isProd = process.env.NODE_ENV === 'production'
    const transient = isTransientAiError(err)
    return res.status(transient ? 503 : 500).json({
      success: false,
      error: isProd
        ? (transient ? 'AI service is busy. Please try again in a moment.' : 'Chat failed. Please try again.')
        : cleanMsg,
    })
  }
})

export default router
