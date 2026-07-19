import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageWrapper from '../components/layout/PageWrapper'
import { fetchSession } from '../services/api'
import useAppStore from '../store/useAppStore'
import type { Session, Path, ChatMessage } from '../types'
import { normalizeStepStatus } from '../lib/sessionProgress'

interface ServerPath {
  id: string
  path_order: number
  title: string
  description: string
  difficulty: 'Easy' | 'Medium' | 'Advanced'
  time_estimate: string
  steps: string[]
  why_it_works: string
  common_mistake: string
  tools: string[]
  has_download: boolean
  recommended: boolean
}

interface ServerMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

interface ServerSessionPayload {
  id: string
  category: string
  situation: string
  blockage: string
  summary: string
  status: 'in-progress' | 'completed' | 'abandoned'
  created_at: string
  paths: ServerPath[]
  stepProgress: Record<string, boolean[]>
  messages: ServerMessage[]
}

export default function SessionDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const authUser = useAppStore((state) => state.user)
  const isAuthLoading = useAppStore((state) => state.isAuthLoading)
  const setCurrentSession = useAppStore((state) => state.setCurrentSession)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthLoading) return
    if (!authUser) {
      navigate('/sign-in', { replace: true })
      return
    }
    if (!id) {
      setError('Session id is missing.')
      return
    }

    let cancelled = false

    const loadSession = async () => {
      try {
        const raw = await fetchSession(id)
        if (cancelled) return

        const payload = raw as ServerSessionPayload
        const pathIdToOrder = new Map<string, number>()
        const pathDbIds: Record<number, string> = {}

        const paths: Path[] = (payload.paths || []).map((path, index) => {
          const mappedId = Number(path.path_order || index + 1)
          pathIdToOrder.set(path.id, mappedId)
          pathDbIds[mappedId] = path.id
          return {
            id: mappedId,
            title: path.title || '',
            difficulty: path.difficulty || 'Easy',
            timeEstimate: path.time_estimate || '',
            description: path.description || '',
            steps: Array.isArray(path.steps) ? path.steps : [],
            whyItWorks: path.why_it_works || '',
            commonMistake: path.common_mistake || '',
            tools: Array.isArray(path.tools) ? path.tools : [],
            hasDownload: Boolean(path.has_download),
            recommended: Boolean(path.recommended),
          }
        })

        const pathStepStatus: Record<string, boolean[]> = {}
        for (const path of payload.paths || []) {
          const mappedId = pathIdToOrder.get(path.id)
          if (!mappedId) continue
          pathStepStatus[String(mappedId)] = normalizeStepStatus(
            payload.stepProgress?.[path.id],
            Array.isArray(path.steps) ? path.steps.length : 0
          )
        }

        const messages: ChatMessage[] = (payload.messages || [])
          .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
          .map((msg) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.created_at),
          }))

        const chosenPath =
          paths.find((path) => {
            const status = pathStepStatus[String(path.id)]
            return status?.some(Boolean)
          }) ||
          paths.find((path) => path.recommended) ||
          paths[0]

        const session: Session = {
          id: payload.id,
          createdAt: new Date(payload.created_at),
          category: payload.category || 'Other',
          situation: payload.situation || '',
          blockage: payload.blockage || '',
          result: {
            summary: payload.summary || '',
            paths,
          },
          chosenPathId: chosenPath?.id,
          pathDbIds,
          pathStepStatus,
          status: payload.status || 'in-progress',
          messages,
        }

        setCurrentSession(session)
        navigate('/results', { replace: true })
      } catch {
        if (!cancelled) {
          setError('Could not open this session. Please try again.')
        }
      }
    }

    loadSession()
    return () => {
      cancelled = true
    }
  }, [authUser, isAuthLoading, id, navigate, setCurrentSession])

  return (
    <PageWrapper>
      <main className="mx-auto min-h-[70vh] max-w-3xl px-6 pb-24 pt-28">
        {error ? (
          <>
            <p className="text-on-surface-variant">{error}</p>
            <button
              type="button"
              onClick={() => navigate('/history')}
              className="mt-4 rounded-lg bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface-variant"
            >
              Back to history
            </button>
          </>
        ) : (
          <p className="text-on-surface-variant">Loading your session…</p>
        )}
      </main>
    </PageWrapper>
  )
}
