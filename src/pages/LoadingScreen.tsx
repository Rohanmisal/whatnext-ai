import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ProcessingScreen } from '../components/ProcessingScreen'
import useAppStore from '../store/useAppStore'

export default function LoadingScreen() {
  const navigate = useNavigate()
  const isLoading = useAppStore((state) => state.isLoading)
  const currentSession = useAppStore((state) => state.currentSession)

  useEffect(() => {
    if (!isLoading) {
      navigate(currentSession ? '/results' : '/input')
    }
  }, [isLoading, currentSession, navigate])

  return <ProcessingScreen onCancel={() => navigate('/input')} />
}
