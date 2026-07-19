import axios from 'axios'
import type { AxiosError } from 'axios'
import { authService }   from './auth'
import { AnalysisResult, ChatMessage } from '../types'
import { captureFrontendException } from '../lib/sentry'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const api = axios.create({ baseURL: BASE_URL })
const inFlightRequests = new Map<string, Promise<unknown>>()

// -- Attach JWT on every request if the user is signed in --
api.interceptors.request.use(async (config) => {
  const token = await authService.getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: string; message?: string }>) => {
    const status = error.response?.status
    const endpoint = error.config?.url || 'unknown'
    const code = error.response?.data?.error || ''

    // Keep free-tier signal quality high: only unexpected/network/server failures.
    if (!status || status >= 500) {
      captureFrontendException(error, {
        area: 'api_response',
        endpoint,
        status,
      })
    } else if (status >= 400 && !['LIMIT_REACHED', 'FORBIDDEN_SESSION', 'FORBIDDEN_PATH'].includes(code)) {
      if (status >= 401 && status <= 403) {
        // Auth/session issues can be useful in production debugging.
        captureFrontendException(error, {
          area: 'api_auth',
          endpoint,
          status,
        })
      }
    }

    return Promise.reject(error)
  }
)

const withInFlightDedup = <T>(key: string, factory: () => Promise<T>): Promise<T> => {
  const active = inFlightRequests.get(key)
  if (active) return active as Promise<T>

  const request = factory().finally(() => {
    inFlightRequests.delete(key)
  })
  inFlightRequests.set(key, request)
  return request
}

// ---- Analysis ----

export const analyzeInput = async (
  situation:     string,
  blockage:      string,
  category:      string,
  wantsDownloads: boolean
): Promise<AnalysisResult & { sessionId?: string; pathIds?: Record<string, string> }> => {
  const response = await api.post('/analyze', { situation, blockage, category, wantsDownloads })
  return {
    ...response.data.data,
    sessionId: response.data.sessionId,
    pathIds: response.data.pathIds,
  }
}

// ---- Chat ----

export const sendChatMessage = async (
  sessionId:  string,
  message:    string,
  history:    ChatMessage[],
  chosenPath: string,
  pathId?:    string
): Promise<string> => {
  const response = await api.post('/chat', { sessionId, message, history, chosenPath, pathId })
  return response.data.reply
}

// ---- Sessions ----

export const fetchSessions = async () => {
  return withInFlightDedup('GET:/sessions', async () => {
    const response = await api.get('/sessions')
    return response.data.data as Array<{
      id: string; category: string; situation: string
      summary: string; status: string; created_at: string
      progress_percent?: number; completed_steps?: number | null; total_steps?: number | null
    }>
  })
}

export const fetchSession = async (id: string) => {
  return withInFlightDedup(`GET:/sessions/${id}`, async () => {
    const response = await api.get(`/sessions/${id}`)
    return response.data.data
  })
}

export const updateSessionStatus = async (id: string, status: 'in-progress' | 'completed' | 'abandoned') => {
  await api.patch(`/sessions/${id}/status`, { status })
}

export const updateStepProgress = async (
  sessionId:  string,
  pathId:     string,
  stepIndex:  number,
  completed:  boolean
) => {
  const response = await api.patch(
    `/sessions/${sessionId}/paths/${pathId}/steps/${stepIndex}`,
    { completed }
  )
  return response.data
}

// ---- User / Profile ----

export const fetchMe = async () => {
  return withInFlightDedup('GET:/users/me', async () => {
    const response = await api.get('/users/me')
    return response.data.data
  })
}

export interface AnalysisQuota {
  allowed: boolean
  used: number
  limit: number | null
  resetAt: string
  message: string | null
  tier: string
}

export const fetchAnalysisQuota = async (): Promise<AnalysisQuota> => {
  return withInFlightDedup('GET:/users/me/quota', async () => {
    const response = await api.get('/users/me/quota')
    return response.data.data as AnalysisQuota
  })
}

export const updateProfile = async (updates: {
  displayName?:       string
  location?:          string
  lifeStage?:         string
  preferredLanguage?: string
  avatarUrl?:         string | null
}) => {
  await api.patch('/users/me', updates)
}

export const uploadAvatar = async (file: File): Promise<string> => {
  const mimeType = file.type || 'image/jpeg'
  const imageBase64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read image file.'))
    reader.readAsDataURL(file)
  })

  const response = await api.post('/users/me/avatar', { imageBase64, mimeType })
  return response.data.data.avatarUrl as string
}

export const clearAllHistory = async () => {
  await api.delete('/users/me/sessions')
}

export const deleteAccount = async () => {
  await api.delete('/users/me')
}

// ---- Waitlist ----
// (kept on the default export so PricingPage's existing api.post('/waitlist', ...) still works)

export default api

// ---- Limit error helper ----

export interface LimitReachedPayload {
  limitType: 'analyses' | 'chat'
  used:      number
  limit:     number
  resetAt?:  string
  message:   string
}

export const isLimitReachedError = (err: unknown): LimitReachedPayload | null => {
  const axiosErr = err as AxiosError<{ error?: string; message?: string } & LimitReachedPayload>
  if (axiosErr?.response?.status === 429 && axiosErr.response.data?.error === 'LIMIT_REACHED') {
    const data = axiosErr.response.data
    return {
      limitType: data.limitType ?? 'analyses',
      used:      data.used ?? 0,
      limit:     data.limit ?? 0,
      resetAt:   data.resetAt,
      message:   data.message ?? 'You have reached your plan limit.',
    }
  }
  return null
}

export const quotaToLimitPayload = (quota: AnalysisQuota): LimitReachedPayload | null => {
  if (quota.allowed || quota.limit == null) return null
  return {
    limitType: 'analyses',
    used:      quota.used,
    limit:     quota.limit,
    resetAt:   quota.resetAt,
    message:   quota.message ?? `You've used all ${quota.limit} free analyses this month.`,
  }
}
