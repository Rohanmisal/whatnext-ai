// load-env.ts MUST be the first import — it runs dotenv.config() so that
// all subsequent modules see the populated process.env values.
import './load-env.js'

import express   from 'express'
import cors      from 'cors'
import helmet    from 'helmet'
import compression  from 'compression'
import rateLimit    from 'express-rate-limit'

import analyzeRouter  from './src/routes/analyze.js'
import chatRouter     from './src/routes/chat.js'
import sessionsRouter from './src/routes/sessions.js'
import usersRouter    from './src/routes/users.js'
import waitlistRouter from './src/routes/waitlist.js'
import { errorHandler } from './src/middleware/errorHandler.js'
import {
  getProvider,
  listCandidateProviders,
  allowMockFallback,
  hasValidAnthropicKey,
  hasValidGeminiKey,
  getGeminiModels,
} from './src/services/ai.js'
import { initSentry, setupSentryExpressErrorHandler } from './src/services/sentry.js'

const app  = express()
const port = Number(process.env.PORT) || 3001

// Railway (and most PaaS hosts) terminate TLS at a reverse proxy and set
// X-Forwarded-For. express-rate-limit requires trust proxy to be enabled.
app.set('trust proxy', 1)

initSentry()

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

// ---- Security & utility middleware ----
app.use(helmet())
app.use(compression())
app.use(cors({ origin: allowedOrigins, credentials: true }))
app.use(express.json({ limit: '3mb' }))

// Global rate limiter — 120 req / 15 min per IP
app.use(
  rateLimit({
    windowMs:        15 * 60 * 1000,
    max:             120,
    standardHeaders: true,
    legacyHeaders:   false,
    message: { success: false, error: 'Too many requests. Please slow down.' },
  })
)

// ---- Routes ----
app.get('/health', (_req, res) => {
  res.json({
    success:            true,
    providerPreference: getProvider(),
    candidates:         listCandidateProviders(),
    allowMockFallback:  allowMockFallback(),
    hasAnthropicKey:    hasValidAnthropicKey(),
    hasGeminiKey:       hasValidGeminiKey(),
    geminiModels:       getGeminiModels(),
  })
})

app.use('/analyze',  analyzeRouter)
app.use('/chat',     chatRouter)
app.use('/sessions', sessionsRouter)
app.use('/users',    usersRouter)
app.use('/waitlist', waitlistRouter)

// ---- Centralized error handler (must be last) ----
setupSentryExpressErrorHandler(app)
app.use(errorHandler)

app.listen(port, () => console.log(`WhatNext server running on :${port}`))
