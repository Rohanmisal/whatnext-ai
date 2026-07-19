import { ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageWrapper from '../components/layout/PageWrapper'
import useAppStore from '../store/useAppStore'

export default function WelcomeSplash() {
  const navigate = useNavigate()
  const setHasSeenWelcome = useAppStore((state) => state.setHasSeenWelcome)

  const continueToForm = () => {
    setHasSeenWelcome(true)
    navigate('/input')
  }

  return (
    <PageWrapper>
      <main className="mx-auto flex min-h-[80vh] max-w-3xl flex-col items-center justify-center px-6 text-center">
        <h1 className="font-display text-5xl text-on-surface">Welcome to whatnextai</h1>
        <p className="mt-5 text-lg text-on-surface-variant">
          You will share your situation and what is blocking you. We will return 3 practical paths forward.
        </p>
        <button
          onClick={continueToForm}
          className="mt-10 flex items-center gap-3 rounded-xl bg-primary-container px-8 py-4 font-display text-lg font-bold text-on-primary"
        >
          Start
          <ArrowRight size={18} />
        </button>
      </main>
    </PageWrapper>
  )
}
