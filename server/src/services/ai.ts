import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenAI } from '@google/genai'
import type { AiAnalysisResult } from '../types/index.js'

// ============================================================
// Key / client helpers
// ============================================================

export const getGeminiApiKey   = () => (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim()
export const getAnthropicApiKey = () => (process.env.ANTHROPIC_API_KEY || '').trim()

export const hasValidAnthropicKey = () => {
  const k = getAnthropicApiKey()
  return !!k && k !== 'your_key_here'
}

export const hasValidGeminiKey = () => {
  const k = getGeminiApiKey()
  return !!k && k !== 'your_key_here'
}

const getAnthropicClient = () => {
  const key = getAnthropicApiKey()
  if (!key || key === 'your_key_here') return null
  return new Anthropic({ apiKey: key })
}

const getGeminiClient = () => {
  const key = getGeminiApiKey()
  if (!key || key === 'your_key_here') return null
  return new GoogleGenAI({ apiKey: key })
}

export const getGeminiModels = () => {
  const fromEnv = (process.env.GEMINI_MODEL || '')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean)
  return fromEnv.length > 0 ? fromEnv : ['gemini-1.5-flash', 'gemini-2.0-flash']
}

export const getProvider = () => {
  const p = (process.env.AI_PROVIDER || 'auto').toLowerCase()
  return p === 'anthropic' || p === 'gemini' || p === 'auto' ? p : 'auto'
}

export const allowMockFallback = () =>
  (process.env.ALLOW_MOCK_FALLBACK || 'false').toLowerCase() === 'true'

export const pickRuntimeProvider = (): 'anthropic' | 'gemini' | null => {
  const provider = getProvider()
  if (provider === 'anthropic') return hasValidAnthropicKey() ? 'anthropic' : null
  if (provider === 'gemini')    return hasValidGeminiKey()    ? 'gemini'    : null
  if (hasValidAnthropicKey()) return 'anthropic'
  if (hasValidGeminiKey())    return 'gemini'
  return null
}

export const listCandidateProviders = (): Array<'anthropic' | 'gemini'> => {
  const provider     = getProvider()
  const validAnthropic = hasValidAnthropicKey()
  const validGemini    = hasValidGeminiKey()
  if (provider === 'anthropic') return validAnthropic ? ['anthropic'] : []
  if (provider === 'gemini')    return validGemini    ? ['gemini']    : []
  const candidates: Array<'anthropic' | 'gemini'> = []
  if (validAnthropic) candidates.push('anthropic')
  if (validGemini)    candidates.push('gemini')
  return candidates
}

// ============================================================
// Error helpers
// ============================================================

export const getErrorMessage = (err: unknown, fallback: string): string => {
  if (err instanceof Error && err.message) return err.message
  if (typeof err === 'object' && err !== null) {
    const e = err as Record<string, unknown>
    if (typeof e.message === 'string' && e.message) return e.message
    const nested = (e.error as Record<string, unknown>)?.message
    if (typeof nested === 'string' && nested) return nested
  }
  return fallback
}

export const parseErrorPayload = (value: string) => {
  try {
    const parsed = JSON.parse(value) as { error?: { message?: string } }
    return parsed.error
  } catch {
    return null
  }
}

export const isFallbackError = (message: string): boolean => {
  const t = message.toLowerCase()
  return (
    t.includes('quota') ||
    t.includes('resource_exhausted') ||
    t.includes('rate limit') ||
    t.includes('not found') ||
    t.includes('unsupported') ||
    t.includes('permission') ||
    t.includes('invalid api key') ||
    t.includes('authentication') ||
    t.includes('401') ||
    t.includes('403') ||
    t.includes('429') ||
    t.includes('503') ||
    t.includes('unavailable') ||
    t.includes('high demand') ||
    t.includes('overloaded') ||
    t.includes('try again later')
  )
}

export const getErrorStatus = (err: unknown): number | undefined => {
  if (typeof err === 'object' && err !== null) {
    const status = (err as { status?: unknown }).status
    if (typeof status === 'number') return status
  }
  return undefined
}

export const isTransientAiError = (err: unknown): boolean => {
  const status = getErrorStatus(err)
  if (status === 503 || status === 429) return true
  const message = getErrorMessage(err, '').toLowerCase()
  return isFallbackError(message)
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// ============================================================
// JSON parsing
// ============================================================

const parseMaybeJson = (raw: string): AiAnalysisResult => {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/, '')
    .trim()
  return JSON.parse(cleaned) as AiAnalysisResult
}

const getTextFromAnthropicResponse = (response: Anthropic.Messages.Message): string => {
  const first = response.content[0]
  return first && first.type === 'text' ? first.text : ''
}

const toGeminiText = (value: unknown): string => {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(toGeminiText).join('\n').trim()
  if (typeof value === 'object') {
    const maybe = value as { text?: string; parts?: unknown[] }
    if (typeof maybe.text === 'string') return maybe.text
    if (Array.isArray(maybe.parts)) {
      return maybe.parts
        .map((p) => (p && typeof p === 'object' && 'text' in (p as object) ? (p as { text?: string }).text || '' : ''))
        .join('\n')
        .trim()
    }
  }
  return ''
}

// ============================================================
// System prompt
// ============================================================

const SYSTEM_PROMPT = `You are WhatNext, an AI guidance navigator for people who feel stuck.
Your job is to understand someone's real situation and give them clear, 
specific, locally-relevant paths forward — like advice from a smart 
friend who knows their world, not a generic consultant.

When a user describes their situation and what is blocking them,
respond ONLY with a valid JSON object in this exact format with
no extra text, no markdown, no backticks:

{
  "summary": "One sentence restating their situation in simple words, 
               showing you understood their specific context",
  "paths": [
    {
      "id": 1,
      "title": "Short punchy path name — max 5 words",
      "difficulty": "Easy",
      "timeEstimate": "~2 weeks",
      "recommended": false,
      "description": "2-3 sentences in plain, warm, friendly language. 
                       Write like a helpful friend, not a consultant. 
                       No jargon. Acknowledge their specific situation.",
      "steps": [
        "Step 1 — free action they can do TODAY with what they already have",
        "Step 2 — specific next action with exact tool or platform named",
        "Step 3 — specific action",
        "Step 4 — specific action",
        "Step 5 — specific action"
      ],
      "whyItWorks": "One sentence — specific reason, not generic motivation",
      "commonMistake": "One sentence — the most common real mistake for this path",
      "tools": ["Specific Tool 1", "Specific Tool 2", "Specific Tool 3"],
      "hasDownload": true
    },
    { "id": 2, "difficulty": "Medium", "recommended": true },
    { "id": 3, "difficulty": "Advanced", "recommended": false }
  ]
}

STRICT RULES — follow every single one:

STRUCTURE:
- Always return exactly 3 paths
- Path 1 must be Easy, Path 2 Medium, Path 3 Advanced
- Mark exactly one path as recommended: true
- JSON only — no extra text, no markdown, no backticks

LANGUAGE:
- Plain language only — write like a smart helpful friend
- Zero corporate jargon — never use: leverage, synergy, scalable, 
  pivot, ecosystem, utilize, optimize, streamline
- Keep sentences short — under 20 words each
- If user writes in Hindi or mixes Hindi-English, respond with 
  descriptions and steps in simple Hindi. Keep JSON keys in English.
  Keep tool names and platform names in English.

STEPS — this is the most important part:
- Always give exactly 5 steps per path
- Step 1 MUST be free and doable TODAY with zero money and 
  zero new accounts — using only what the user already has
- Step 2 onwards can introduce free tools and signups
- Each step must name a specific action — never say 
  "research options" or "consider your choices"
- Bad step: "Research and choose a platform"
  Good step: "Go to Instagram right now and create a Business account 
              using your existing personal account — it takes 3 minutes"

TOOLS — recommend locally relevant tools:
- Detect the user's country and context from their description
- For India: prefer WhatsApp Business, Razorpay, UPI, Google Pay, 
  Meesho, Flipkart Seller Hub, IndiaMART, Canva, YouTube, 
  Instagram Shopping, Dunzo, Swiggy Genie, Notion (free)
- For India: avoid recommending Stripe, Etsy, Squarespace, Shopify 
  (paid), Slack, or other Western-first tools unless specifically asked
- For students: prefer free tools only — Canva free, Google Docs, 
  YouTube tutorials, Coursera free audit, LinkedIn free
- For small/local businesses: prefer tools that work on basic 
  Android phones with slow internet

BUDGET AWARENESS:
- If no budget is mentioned, assume the user has very limited money
- Never suggest buying equipment or paid tools in Step 1 or Step 2
- Always offer the free version of any tool first
- Only suggest paid tools in Step 4 or 5, and only if genuinely necessary

CONTEXT AWARENESS:
- Read the user's description carefully for clues about their location, 
  budget, experience level, and available time
- Adjust all recommendations to match their real world, not an ideal world
- If they mention a city or region, recommend things available there
- If they sound like a beginner, skip advanced tools entirely
- If they sound time-poor, make steps shorter and quicker

OUTPUT QUALITY CHECK — before finalizing, ask yourself:
- Is Step 1 free and doable today? If not, change it.
- Did I name specific tools for their location? If not, fix it.
- Would a person with no money and basic phone be able to follow this? 
  If not, simplify it.
- Does the summary show I understood their specific situation? 
  If it sounds generic, rewrite it.`

// ============================================================
// Anthropic API calls
// ============================================================

export const createAnalyzeWithAnthropic = async (payload: {
  situation: string
  blockage:  string
  category:  string
}): Promise<AiAnalysisResult> => {
  const client = getAnthropicClient()
  if (!client) throw new Error('ANTHROPIC_API_KEY is not configured.')

  const response = await client.messages.create({
    model:      process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-latest',
    max_tokens: 2000,
    system:     SYSTEM_PROMPT,
    messages: [{
      role:    'user',
      content: `Category: ${payload.category}\nWhat I am doing: ${payload.situation}\nWhat is blocking me: ${payload.blockage}\nGive me my 3 paths forward.`,
    }],
  })

  return parseMaybeJson(getTextFromAnthropicResponse(response))
}

export const createChatWithAnthropic = async (payload: {
  message:     string
  history:     Array<{ role: 'user' | 'assistant'; content: string }>
  chosenPath:  string
}): Promise<string> => {
  const client = getAnthropicClient()
  if (!client) throw new Error('ANTHROPIC_API_KEY is not configured.')

  const messages: Anthropic.Messages.MessageParam[] = [
    ...payload.history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: payload.message },
  ]

  const response = await client.messages.create({
    model:      process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-latest',
    max_tokens: 1000,
    system:     `You are WhatNext navigator helping someone follow the path: "${payload.chosenPath}". Answer follow-up questions helpfully and specifically. Plain language only. Keep responses under 150 words.`,
    messages,
  })

  return getTextFromAnthropicResponse(response)
}

// ============================================================
// Gemini API calls
// ============================================================

export const createAnalyzeWithGemini = async (payload: {
  situation: string
  blockage:  string
  category:  string
}): Promise<AiAnalysisResult> => {
  const client = getGeminiClient()
  if (!client) throw new Error('GEMINI_API_KEY is not configured.')

  const models = getGeminiModels()
  let lastError: unknown = null

  for (let i = 0; i < models.length; i++) {
    const model = models[i]
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await client.models.generateContent({
          model,
          contents: `Category: ${payload.category}\nWhat I am doing: ${payload.situation}\nWhat is blocking me: ${payload.blockage}\nGive me my 3 paths forward.`,
          config: { systemInstruction: SYSTEM_PROMPT, responseMimeType: 'application/json' },
        })
        return parseMaybeJson(toGeminiText(response.text || response.candidates?.[0]?.content))
      } catch (err) {
        lastError = err
        const msg = getErrorMessage(err, 'Gemini analyze failed')
        const canRetry = isTransientAiError(err) && attempt === 0
        if (canRetry) {
          await sleep(800)
          continue
        }
        if (!isFallbackError(msg) || i === models.length - 1) break
        break
      }
    }
  }

  throw lastError || new Error('Gemini analyze failed')
}

export const createChatWithGemini = async (payload: {
  message:    string
  history:    Array<{ role: 'user' | 'assistant'; content: string }>
  chosenPath: string
}): Promise<string> => {
  const client = getGeminiClient()
  if (!client) throw new Error('GEMINI_API_KEY is not configured.')

  const conversation = payload.history
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n')

  const models = getGeminiModels()
  let lastError: unknown = null

  for (let i = 0; i < models.length; i++) {
    const model = models[i]
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await client.models.generateContent({
          model,
          contents: `${conversation}\nUSER: ${payload.message}`,
          config: {
            systemInstruction: `You are WhatNext navigator helping someone follow the path: "${payload.chosenPath}". Answer follow-up questions helpfully and specifically. Plain language only. Keep responses under 150 words.`,
          },
        })
        return toGeminiText(response.text || response.candidates?.[0]?.content)
      } catch (err) {
        lastError = err
        const msg = getErrorMessage(err, 'Gemini chat failed')
        const canRetry = isTransientAiError(err) && attempt === 0
        if (canRetry) {
          await sleep(800)
          continue
        }
        if (!isFallbackError(msg) || i === models.length - 1) break
        break
      }
    }
  }

  throw lastError || new Error('Gemini chat failed')
}

// ============================================================
// Mock fallbacks (dev / demo mode)
// ============================================================

export const buildMockAnalysis = (payload: {
  situation: string
  blockage:  string
  category:  string
}): AiAnalysisResult => ({
  summary: `You are exploring ${payload.category} options and need non-coding alternatives to move forward confidently.`,
  paths: [
    {
      id: 1, title: 'Career Discovery Sprint', difficulty: 'Easy',
      timeEstimate: '~2 weeks', recommended: true,
      description: 'Explore non-coding CS roles and map where your strengths fit best.',
      steps: [
        'List 5 job roles that use CS thinking but minimal coding (Product, QA, Analyst, UX, Support Engineering).',
        'Watch 2 day-in-the-life videos and write what energises or drains you.',
        'Pick top 2 roles and connect with 3 people each on LinkedIn for informational chats.',
        'Read 10 job descriptions for each chosen role and note recurring required skills.',
        'Create a one-page skill-gap list and mark which gaps you can close in under 4 weeks.',
      ],
      whyItWorks: 'You avoid random guessing and quickly narrow to realistic options.',
      commonMistake: 'Choosing a role only by salary without checking daily work style.',
      tools: ['LinkedIn', 'YouTube', 'Google Sheets'],
      hasDownload: true,
    },
    {
      id: 2, title: 'Skill Bridge Plan', difficulty: 'Medium',
      timeEstimate: '~6 weeks', recommended: false,
      description: 'Build practical portfolio pieces for your chosen non-coding path.',
      steps: [
        'Select one target role and read 15 job descriptions to identify repeated skills.',
        'Create 2 small portfolio projects (product case brief, QA test plan, or analytics dashboard).',
        'Publish your work on LinkedIn and request feedback from at least 2 people.',
        'Apply to 5 entry-level roles or internships to test market response.',
        'Refine your portfolio based on any feedback or rejection patterns you notice.',
      ],
      whyItWorks: 'Employers value role-specific proof of work more than generic certificates.',
      commonMistake: 'Collecting too many courses without producing visible projects.',
      tools: ['Notion', 'Canva', 'Google Docs'],
      hasDownload: true,
    },
    {
      id: 3, title: 'Apprenticeship Path', difficulty: 'Advanced',
      timeEstimate: '~3 months', recommended: false,
      description: 'Gain real-world experience through internships, volunteer projects, or campus leadership.',
      steps: [
        'Apply to 20 internships or part-time roles aligned to your chosen track.',
        'Offer to help 2 startups or college clubs with clear deliverables.',
        'Turn every project into a one-page case study with outcomes and lessons.',
        'Build a simple portfolio website using Notion or Carrd (free).',
        'Share your work publicly on LinkedIn once a week to build visibility.',
      ],
      whyItWorks: 'Hands-on experience improves confidence and hiring chances rapidly.',
      commonMistake: 'Waiting for perfect opportunities instead of starting with small real tasks.',
      tools: ['Internshala', 'LinkedIn Jobs', 'Notion'],
      hasDownload: true,
    },
  ],
})

export const buildMockChatReply = (message: string, chosenPath: string): string =>
  `Great question. For "${chosenPath}", break it into this week, next 30 days, and next 90 days. Start with one small action today related to: ${message.slice(0, 80)}. If you want, I can give you a day-by-day plan.`
