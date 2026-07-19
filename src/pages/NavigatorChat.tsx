import { FormEvent, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowUp,
  Compass,
  History,
  Home,
  Loader2,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Route,
  X,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import GuestAuthBanner from '../components/GuestAuthBanner'
import ChatMessageContent from '../components/ChatMessageContent'
import { sendChatMessage } from '../services/api'
import useAppStore from '../store/useAppStore'
import { ChatMessage } from '../types'

const SUGGESTION_CHIPS = [
  'How long should my first output be?',
  'I have slow internet, what should I do?',
  'What should I write in the description?',
  'Best free tools for beginners?',
]

const NAV_ITEMS = [
  { id: 'Home', to: '/', icon: Home },
  { id: 'My Paths', to: '/results', icon: Route },
  { id: 'Explore', to: '/explore', icon: Compass },
  { id: 'History', to: '/history', icon: History },
]

export default function NavigatorChat() {
  const params = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const authUser = useAppStore((state) => state.user)
  const currentSession = useAppStore((state) => state.currentSession)
  const setCurrentSession = useAppStore((state) => state.setCurrentSession)
  const setError = useAppStore((state) => state.setError)
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isNavCollapsed, setIsNavCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const messagesScrollRef = useRef<HTMLDivElement>(null)
  const chatFormRef = useRef<HTMLFormElement>(null)
  const chatInputRef = useRef<HTMLTextAreaElement>(null)

  const adjustChatInputHeight = () => {
    const el = chatInputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  useLayoutEffect(() => {
    const el = messagesScrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [currentSession?.messages.length, isSending])

  useLayoutEffect(() => {
    adjustChatInputHeight()
  }, [input])

  function waitForPaint(): Promise<void> {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve())
      })
    })
  }

  const pathId = Number(params.id)
  const selectedPath = useMemo(
    () => currentSession?.result.paths.find((path) => path.id === pathId),
    [currentSession, pathId]
  )

  const isNavActive = (id: string) => {
    if (id === 'Home') return location.pathname === '/'
    if (id === 'History') return location.pathname === '/history'
    if (id === 'Explore') return location.pathname === '/explore'
    if (id === 'My Paths') {
      return (
        location.pathname.startsWith('/results') ||
        location.pathname.startsWith('/path') ||
        location.pathname.startsWith('/chat')
      )
    }
    return false
  }

  const submitMessage = async (event: FormEvent) => {
    event.preventDefault()
    if (!authUser || !currentSession || !selectedPath) return
    const trimmed = input.trim()
    if (!trimmed || isSending) return

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    }

    const nextMessages = [...currentSession.messages, userMessage]
    setIsSending(true)
    setCurrentSession({ ...currentSession, messages: nextMessages, chosenPathId: pathId })
    setInput('')

    await waitForPaint()

    const started = Date.now()
    const minThinkingMs = 320

    try {
      const reply = await sendChatMessage(
        currentSession.id,
        trimmed,
        currentSession.messages,
        selectedPath.title
      )
      const assistantMessage: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      }
      const elapsed = Date.now() - started
      if (elapsed < minThinkingMs) {
        await new Promise((r) => setTimeout(r, minThinkingMs - elapsed))
      }
      setCurrentSession({
        ...currentSession,
        messages: [...nextMessages, assistantMessage],
        chosenPathId: pathId,
      })
    } catch (error: unknown) {
      const message =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { error?: string } } }).response?.data?.error ===
          'string'
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : 'Chat request failed.'

      const elapsed = Date.now() - started
      if (elapsed < minThinkingMs) {
        await new Promise((r) => setTimeout(r, minThinkingMs - elapsed))
      }
      setError(message || 'Chat request failed.')
      setCurrentSession({ ...currentSession, messages: nextMessages, chosenPathId: pathId })
    } finally {
      setIsSending(false)
    }
  }

  const renderSidebarNav = (collapsed: boolean, onNavigate?: () => void) => (
    <nav className="flex flex-1 flex-col gap-1 p-2">
      {NAV_ITEMS.map((item) => {
        const active = isNavActive(item.id)
        const Icon = item.icon
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              navigate(item.to)
              onNavigate?.()
            }}
            className={[
              'flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[13px] transition-colors',
              active
                ? 'bg-primary-container/10 text-primary-container'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface',
            ].join(' ')}
            title={collapsed ? item.id : undefined}
          >
            <Icon size={16} className="shrink-0" />
            {!collapsed && <span className="font-medium">{item.id}</span>}
          </button>
        )
      })}
    </nav>
  )

  if (!authUser) {
    return (
      <div className="min-h-screen bg-surface-container-lowest">
        <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-5 py-16">
          <GuestAuthBanner analysesUsed={1} variant="exhausted" />
          <p className="mt-4 text-center text-sm text-outline-variant">
            Please sign in to use follow-up chat and continue your path.
          </p>
          <button
            type="button"
            onClick={() => navigate('/results')}
            className="mt-6 text-center text-sm font-medium text-primary-container hover:underline"
          >
            ← Back to your paths
          </button>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-surface-container-lowest text-on-surface">
      {/* Mobile top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.06] bg-surface-container-low px-4 md:hidden">
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className="rounded-lg p-2 text-on-surface-variant hover:bg-white/5"
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>
        <span className="font-display text-[17px] font-bold tracking-tight text-primary-container">
          whatnextai
        </span>
        <button
          type="button"
          onClick={() =>
            selectedPath ? navigate(`/path/${selectedPath.id}`) : navigate('/results')
          }
          className="rounded-lg p-2 text-on-surface-variant hover:bg-white/5"
          aria-label="Back to path"
        >
          <ArrowLeft size={20} />
        </button>
      </header>

      {/* Mobile nav drawer */}
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              onClick={() => setMobileNavOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 left-0 z-50 flex w-[230px] flex-col border-r border-white/[0.06] bg-surface-container-low md:hidden"
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-4">
                <span className="font-display text-sm font-semibold text-primary-container">
                  whatnextai
                </span>
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(false)}
                  className="rounded-lg p-1.5 text-on-surface-variant hover:bg-white/5"
                  aria-label="Close navigation"
                >
                  <X size={18} />
                </button>
              </div>
              {renderSidebarNav(false, () => setMobileNavOpen(false))}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-h-0 flex-1 gap-0 md:gap-4 md:p-4">
        {/* Desktop sidebar */}
        <aside
          className={`sticky top-4 hidden h-[calc(100dvh-32px)] shrink-0 overflow-hidden rounded-[18px] border border-white/[0.08] bg-surface-container-low md:flex md:flex-col ${
            isNavCollapsed ? 'w-[72px]' : 'w-[230px]'
          }`}
        >
          <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-4">
            {!isNavCollapsed ? (
              <button
                type="button"
                onClick={() => navigate('/')}
                className="font-display text-sm font-semibold text-primary-container"
              >
                whatnextai
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/')}
                className="font-display text-sm font-bold text-primary-container"
                aria-label="Home"
              >
                w
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsNavCollapsed((prev) => !prev)}
              className="rounded-lg border border-white/[0.1] bg-surface-container-high p-1.5 text-on-surface-variant hover:text-on-surface"
              aria-label={isNavCollapsed ? 'Expand navigation' : 'Collapse navigation'}
            >
              {isNavCollapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
            </button>
          </div>
          {renderSidebarNav(isNavCollapsed)}
        </aside>

        {/* Chat panel */}
        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-white/[0.08] bg-surface-container md:rounded-[18px] md:border">
            {/* Chat header */}
            <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] bg-surface-container-low px-4 py-3.5 sm:px-5">
              <div className="min-w-0">
                <h1 className="font-display text-[15px] font-semibold text-on-surface">
                  whatnextai Navigator
                </h1>
                <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-outline-variant">
                  <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                  Online · helping with your path
                </p>
              </div>

              {currentSession && selectedPath ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="hidden max-w-[200px] truncate rounded-full border border-white/[0.1] bg-surface-container-high px-3 py-1 text-[12px] text-on-surface-variant sm:inline-flex">
                    Active path:{' '}
                    <strong className="ml-1 font-medium text-primary-container">
                      {selectedPath.title}
                    </strong>
                  </span>
                  <span className="rounded-full border border-primary-container/25 bg-primary-container/10 px-3 py-1 text-[12px] font-medium text-primary-container">
                    {selectedPath.difficulty} · {selectedPath.timeEstimate}
                  </span>
                </div>
              ) : null}
            </header>

            {/* Messages */}
            <div
              ref={messagesScrollRef}
              className="custom-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto scroll-smooth px-4 py-5 sm:px-5"
            >
              {!currentSession || !selectedPath ? (
                <div className="rounded-[18px] border border-white/[0.08] bg-surface-container-high p-6 text-on-surface-variant">
                  <p className="text-sm">No active session for chat.</p>
                  <button
                    type="button"
                    onClick={() => navigate('/input')}
                    className="mt-4 rounded-full bg-primary-container px-5 py-2.5 text-sm font-semibold text-[#1a0d06]"
                  >
                    Start again
                  </button>
                </div>
              ) : (
                <>
                  {currentSession.messages.length === 0 && (
                    <div className="rounded-[14px] border border-white/[0.08] bg-surface-container-high px-4 py-3.5 text-[13px] font-light text-on-surface-variant">
                      Ask anything about this path. I'll help you with your next action.
                    </div>
                  )}

                  {currentSession.messages.map((message) =>
                    message.role === 'user' ? (
                      <div key={message.id} className="flex justify-end">
                        <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-[18px_18px_4px_18px] bg-primary-container px-4 py-3 text-[14px] leading-relaxed text-[#1a0d06] sm:max-w-[72%]">
                          {message.content}
                        </div>
                      </div>
                    ) : (
                      <div key={message.id} className="flex items-start gap-2.5">
                        <div className="mt-0.5 flex size-[30px] shrink-0 items-center justify-center rounded-[9px] border border-primary-container/25 bg-primary-container/10 text-sm">
                          🧭
                        </div>
                        <div className="max-w-[88%] rounded-[4px_18px_18px_18px] border border-white/[0.08] bg-surface-container-high px-4 py-3.5 text-[14px] sm:max-w-[80%]">
                          <ChatMessageContent content={message.content} />
                        </div>
                      </div>
                    )
                  )}

                  {isSending ? (
                    <div className="flex items-start gap-2.5" aria-live="polite" aria-busy="true">
                      <div className="mt-0.5 flex size-[30px] shrink-0 items-center justify-center rounded-[9px] border border-primary-container/25 bg-primary-container/10 text-sm">
                        🧭
                      </div>
                      <div className="rounded-[4px_18px_18px_18px] border border-white/[0.08] bg-surface-container-high px-4 py-3 text-[13px] italic text-outline-variant">
                        <span className="sr-only">Assistant is thinking</span>
                        Navigating your question…
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </div>

            {/* Suggestions + input */}
            {currentSession && selectedPath ? (
              <div className="shrink-0 border-t border-white/[0.06] bg-surface-container-low">
                <div className="flex flex-wrap gap-2 px-4 py-2.5 sm:px-5">
                  {SUGGESTION_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setInput(chip)}
                      className="rounded-full border border-white/[0.1] bg-surface-container-high px-3 py-1.5 text-[12px] text-on-surface-variant transition hover:border-primary-container/25 hover:bg-primary-container/10 hover:text-primary-container"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                <form
                  ref={chatFormRef}
                  onSubmit={submitMessage}
                  className="flex items-end gap-2.5 border-t border-white/[0.06] px-4 py-3.5 sm:px-5"
                >
                  <textarea
                    ref={chatInputRef}
                    value={input}
                    rows={1}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault()
                        chatFormRef.current?.requestSubmit()
                      }
                    }}
                    className="min-h-[44px] max-h-[160px] min-w-0 flex-1 resize-none overflow-y-auto rounded-2xl border border-white/[0.1] bg-surface-container px-4 py-2.5 text-[14px] leading-relaxed text-on-surface outline-none transition placeholder:text-outline-variant focus:border-primary-container/30"
                    placeholder="Ask anything about this path..."
                  />
                  <button
                    type="submit"
                    disabled={isSending || !input.trim()}
                    aria-label={isSending ? 'Sending message' : 'Send message'}
                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-[#1a0d06] transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSending ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <ArrowUp className="size-[18px]" strokeWidth={2.25} aria-hidden />
                    )}
                  </button>
                </form>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  )
}
