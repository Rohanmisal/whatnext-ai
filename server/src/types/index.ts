// ============================================================
// Server-side shared types
// ============================================================

export type SubscriptionTier = 'explorer' | 'navigator' | 'guide'
export type SessionStatus    = 'in-progress' | 'completed' | 'abandoned'
export type Difficulty       = 'Easy' | 'Medium' | 'Advanced'
export type ChatRole         = 'user' | 'assistant'

// ---- Database row shapes ----

export interface DbUser {
  id:           string
  email:        string
  display_name: string | null
  location:     string | null
  life_stage:   string | null
  created_at:   string
  updated_at:   string
}

export interface DbUserUsage {
  user_id:               string
  subscription_tier:     SubscriptionTier
  analyses_this_month:   number
  chat_msgs_this_month:  number
  period_start:          string
}

export interface DbSession {
  id:         string
  user_id:    string
  category:   string
  situation:  string
  blockage:   string
  summary:    string
  status:     SessionStatus
  created_at: string
  updated_at: string
}

export interface DbPath {
  id:             string
  session_id:     string
  path_order:     number
  title:          string
  description:    string
  difficulty:     Difficulty
  time_estimate:  string
  steps:          string[]
  why_it_works:   string
  common_mistake: string
  tools:          string[]
  has_download:   boolean
  recommended:    boolean
}

export interface DbPathStepProgress {
  id:           string
  path_id:      string
  user_id:      string
  step_index:   number
  completed:    boolean
  completed_at: string | null
}

export interface DbChatMessage {
  id:         string
  session_id: string
  path_id:    string | null
  role:       ChatRole
  content:    string
  created_at: string
}

// ---- Request / response shapes ----

export interface AuthenticatedUser {
  id:                string
  email:             string
  subscription_tier: SubscriptionTier
}

export interface LimitReachedError {
  success:   false
  error:     'LIMIT_REACHED'
  limitType: 'analyses' | 'chat'
  used:      number
  limit:     number
  resetAt?:  string
}

// ---- AI output shape (mirrors frontend types) ----

export interface AiPath {
  id:             number
  title:          string
  difficulty:     Difficulty
  timeEstimate:   string
  recommended:    boolean
  description:    string
  steps:          string[]
  whyItWorks:     string
  commonMistake:  string
  tools:          string[]
  hasDownload:    boolean
}

export interface AiAnalysisResult {
  summary: string
  paths:   AiPath[]
}

// ---- Augment Express Request ----

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser
    }
  }
}
