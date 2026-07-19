import { useNavigate } from 'react-router-dom'
import PageWrapper from '../components/layout/PageWrapper'
import useAppStore from '../store/useAppStore'

export default function ErrorState() {
  const navigate = useNavigate()
  const error = useAppStore((state) => state.error)

  return (
    <PageWrapper>
      <main className="mx-auto flex min-h-[75vh] max-w-3xl flex-col items-center justify-center px-6 text-center">
        <h1 className="font-display text-4xl">Something went wrong</h1>
        <p className="mt-4 text-on-surface-variant">{error || 'Please try again.'}</p>
        <button onClick={() => navigate('/input')} className="mt-8 rounded-xl bg-primary-container px-6 py-3 font-semibold text-on-primary">
          Back to Input
        </button>
      </main>
    </PageWrapper>
  )
}
