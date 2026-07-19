export interface Path {
  id: number
  title: string
  difficulty: 'Easy' | 'Medium' | 'Advanced'
  timeEstimate: string
  description: string
  steps: string[]
  whyItWorks: string
  commonMistake: string
  tools: string[]
  hasDownload: boolean
  recommended?: boolean
}

export interface AnalysisResult {
  summary: string
  paths: Path[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface Session {
  id: string
  createdAt: Date
  category: string
  situation: string
  blockage: string
  result: AnalysisResult
  chosenPathId?: number
  pathDbIds?: Record<number, string>
  pathStepStatus?: Record<string, boolean[]>
  status: 'in-progress' | 'completed' | 'abandoned'
  messages: ChatMessage[]
}

export interface AppState {
  currentSession: Session | null
  history: Session[]
  isLoading: boolean
  error: string | null
  hasSeenWelcome: boolean
  hasCompletedOnboarding: boolean
  guestAnalysesUsed: number
  setCurrentSession: (session: Session) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setHasSeenWelcome: (seen: boolean) => void
  setHasCompletedOnboarding: (completed: boolean) => void
  addToHistory: (session: Session) => void
  clearLocalHistory: () => void
  markGuestAnalysisUsed: () => void
}
