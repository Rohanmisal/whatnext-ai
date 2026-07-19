import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import PageWrapper from '../components/layout/PageWrapper'
import SignInRequiredModal from '../components/SignInRequiredModal'
import useAppStore from '../store/useAppStore'
import { updateSessionStatus, updateStepProgress } from '../services/api'
import { getPathProgress, isPathComplete, normalizeStepStatus } from '../lib/sessionProgress'

const isServerSessionId = (id: string) => /^[0-9a-f-]{36}$/i.test(id)

export default function PathDetail() {
  const navigate = useNavigate()
  const params = useParams()
  const authUser = useAppStore((state) => state.user)
  const currentSession = useAppStore((state) => state.currentSession)
  const setCurrentSession = useAppStore((state) => state.setCurrentSession)
  const [signInModalOpen, setSignInModalOpen] = useState(false)
  const pathId = Number(params.id)

  const path = useMemo(
    () => currentSession?.result.paths.find((item) => item.id === pathId),
    [currentSession, pathId]
  )

  const pathKey = String(pathId)
  const stepStatus = normalizeStepStatus(
    currentSession?.pathStepStatus?.[pathKey],
    path?.steps.length ?? 0
  )
  const { completedCount, totalSteps, progress } = getPathProgress(stepStatus, path?.steps.length ?? 0)
  const allStepsComplete = isPathComplete(stepStatus, totalSteps)
  const isMarkingRef = useRef(false)

  useEffect(() => {
    if (!path) return
    const session = useAppStore.getState().currentSession
    if (!session) return
    const existing = session.pathStepStatus?.[pathKey]
    if (existing?.length === path.steps.length) return

    setCurrentSession({
      ...session,
      chosenPathId: path.id,
      pathStepStatus: {
        ...(session.pathStepStatus || {}),
        [pathKey]: normalizeStepStatus(existing, path.steps.length),
      },
    })
  }, [path, pathKey, setCurrentSession])

  const persistStepChanges = async (nextSteps: boolean[], changedIndex?: number) => {
    if (!path || !currentSession) return

    const session = useAppStore.getState().currentSession
    if (!session) return

    const nextStatus = isPathComplete(nextSteps, totalSteps) ? 'completed' as const : session.status

    setCurrentSession({
      ...session,
      chosenPathId: path.id,
      pathStepStatus: { ...(session.pathStepStatus || {}), [pathKey]: nextSteps },
      status: nextStatus,
    })

    if (!authUser || !isServerSessionId(session.id)) return

    const dbPathId = session.pathDbIds?.[path.id]
    if (!dbPathId) return

    try {
      if (changedIndex != null) {
        await updateStepProgress(session.id, dbPathId, changedIndex, nextSteps[changedIndex])
      } else {
        const prev = normalizeStepStatus(session.pathStepStatus?.[pathKey], path.steps.length)
        const changedIdx = nextSteps.findIndex((done, idx) => done !== prev[idx])
        if (changedIdx !== -1) {
          await updateStepProgress(session.id, dbPathId, changedIdx, nextSteps[changedIdx])
        }
      }

      if (isPathComplete(nextSteps, totalSteps) && session.status !== 'completed') {
        await updateSessionStatus(session.id, 'completed')
      }
    } catch {
      // Local state stays updated; server sync can retry on next action.
    }
  }

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.92
    window.speechSynthesis.speak(utterance)
  }

  const markCurrentStepDone = () => {
    if (!path || isMarkingRef.current) return
    const session = useAppStore.getState().currentSession
    if (!session) return

    const nextSteps = normalizeStepStatus(session.pathStepStatus?.[pathKey], path.steps.length)
    const firstOpenIndex = nextSteps.findIndex((done) => !done)
    if (firstOpenIndex === -1) return

    isMarkingRef.current = true
    nextSteps[firstOpenIndex] = true
    void persistStepChanges(nextSteps, firstOpenIndex).finally(() => {
      requestAnimationFrame(() => {
        isMarkingRef.current = false
      })
    })
  }

  const toggleStepAt = (index: number) => {
    if (!path) return
    const session = useAppStore.getState().currentSession
    if (!session) return

    const next = normalizeStepStatus(session.pathStepStatus?.[pathKey], path.steps.length)
    next[index] = !next[index]
    void persistStepChanges(next, index)
  }

  const speakAllSteps = () => {
    if (!path) return
    speakText(path.steps.map((step, index) => `Step ${index + 1}. ${step}`).join(' '))
  }

  if (!currentSession || !path) {
    return (
      <PageWrapper>
        <main className="mx-auto min-h-[70vh] max-w-4xl px-6 pb-24 pt-28">
          <p className="text-on-surface-variant">Path not found.</p>
        </main>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <SignInRequiredModal open={signInModalOpen} onClose={() => setSignInModalOpen(false)} />
      <main className="mx-auto max-w-4xl px-6 pb-24 pt-24">
        <div className="flex items-center gap-3 text-sm text-on-surface-variant">
          <button
            type="button"
            onClick={() => navigate('/results')}
            aria-label="Back to paths"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-surface-container-high text-on-surface-variant transition-all hover:border-white/20 hover:bg-surface-container-highest hover:text-on-surface active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <ArrowLeft size={18} aria-hidden />
          </button>
          <span className="text-primary">{path.title}</span>
        </div>

        {allStepsComplete && (
          <section className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <p className="text-sm font-medium text-emerald-300">Path completed — great work!</p>
            <p className="mt-1 text-xs text-emerald-200/80">
              You finished all {totalSteps} steps on this path. Your session is marked complete.
            </p>
          </section>
        )}

        <section className="mt-4 rounded-2xl border border-white/10 bg-surface-container p-5">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-on-surface-variant">
              Your progress — {completedCount} of {totalSteps} steps done
            </span>
            <span className={allStepsComplete ? 'text-emerald-300' : 'text-green-300'}>
              {progress}% complete
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-surface-container-highest">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                allStepsComplete
                  ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                  : 'bg-gradient-to-r from-green-400 to-green-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </section>

        <section className="mt-3 rounded-2xl border border-white/10 bg-surface-container p-6">
          <h1 className="font-display text-3xl">{path.title}</h1>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-green-300">{path.difficulty}</span>
            <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-blue-300">{path.timeEstimate}</span>
            {path.recommended && <span className="rounded-full border border-primary-container/30 bg-primary-container/10 px-3 py-1 text-primary">Recommended</span>}
          </div>
          <p className="mt-4 text-on-surface-variant">{path.description}</p>
          <button
            type="button"
            onClick={() => speakText(path.description)}
            className="mt-4 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs text-blue-300 transition-all hover:border-blue-400/40 hover:bg-blue-500/20 hover:text-blue-200 active:scale-[0.98]"
          >
            Read aloud
          </button>
        </section>

        <section className="mt-3 rounded-2xl border border-white/10 bg-surface-container p-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text-dim">Your steps</p>
            <p className="text-[11px] text-outline-variant">
              Tap a step number to mark it complete or undo
            </p>
          </div>
          <div className="mt-4 space-y-4">
            {path.steps.map((step, index) => {
              const done = stepStatus[index]
              return (
                <div key={`${path.id}-${index}`} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => toggleStepAt(index)}
                      aria-label={done ? `Mark step ${index + 1} incomplete` : `Mark step ${index + 1} complete`}
                      className={`h-8 w-8 rounded-full border text-xs font-semibold transition-all active:scale-95 ${
                        done
                          ? 'border-green-400 bg-green-500/10 text-green-300 hover:border-green-300 hover:bg-green-500/20'
                          : 'border-white/20 bg-surface-container-low text-on-surface-variant hover:border-white/35 hover:bg-surface-container-high hover:text-on-surface'
                      }`}
                    >
                      {done ? '✓' : index + 1}
                    </button>
                    {index !== path.steps.length - 1 && <div className="mt-1 h-6 w-px bg-white/10" />}
                  </div>
                  <div className="flex-1 pb-2">
                    <p className={`${done ? 'text-green-300' : 'text-on-surface'} text-sm leading-relaxed`}>{step}</p>
                    <button
                      type="button"
                      onClick={() => speakText(step)}
                      className="mt-1 text-xs text-blue-300 transition-colors hover:text-blue-200 hover:underline"
                    >
                      Read step
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="mt-3 rounded-2xl border border-white/10 bg-surface-container p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text-dim">Why this works + what to avoid</p>
          <p className="mt-3 text-sm text-on-surface-variant">{path.whyItWorks}</p>
          <div className="my-4 h-px bg-white/10" />
          <p className="text-sm text-on-surface-variant">{path.commonMistake}</p>
        </section>

        <section className="mt-3 rounded-2xl border border-white/10 bg-surface-container p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text-dim">Tools for this path</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {path.tools.map((tool) => (
              <div key={tool} className="rounded-lg border border-white/10 bg-surface-container-high p-3 text-sm text-on-surface">
                {tool}
              </div>
            ))}
          </div>
        </section>

        <div className="mt-5 flex flex-wrap gap-3">
          {!allStepsComplete && (
            <button
              type="button"
              onClick={markCurrentStepDone}
              className="rounded-xl bg-primary-container px-5 py-3 font-semibold text-on-primary transition-all hover:opacity-90 hover:shadow-lg hover:shadow-primary-container/25 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Mark next step done
            </button>
          )}
          <button
            type="button"
            onClick={speakAllSteps}
            className="rounded-xl border border-white/15 bg-surface-container-high px-5 py-3 font-semibold text-on-surface-variant transition-all hover:border-white/25 hover:bg-surface-container-highest hover:text-on-surface active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Read all steps
          </button>
          <button
            type="button"
            onClick={() => {
              if (!authUser) {
                setSignInModalOpen(true)
                return
              }
              navigate(`/chat/${path.id}`)
            }}
            className="rounded-xl border border-primary-container/30 bg-primary-container/10 px-5 py-3 font-semibold text-primary transition-all hover:border-primary-container/50 hover:bg-primary-container/20 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Open Follow-up Chat
          </button>
        </div>
      </main>
    </PageWrapper>
  )
}
