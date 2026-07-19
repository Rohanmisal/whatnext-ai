import { useNavigate } from 'react-router-dom'
import { LandingScreen } from '../components/LandingScreen'
import PageWrapper from '../components/layout/PageWrapper'
import useAppStore from '../store/useAppStore'
import OnboardingPage from './OnboardingPage'

export default function HomePage() {
  const navigate = useNavigate()
  const hasSeenWelcome = useAppStore((state) => state.hasSeenWelcome)
  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding)
  const setHasCompletedOnboarding = useAppStore((state) => state.setHasCompletedOnboarding)
  const setHasSeenWelcome = useAppStore((state) => state.setHasSeenWelcome)

  const showOnboarding = !hasCompletedOnboarding && !hasSeenWelcome

  const handleBeginJourney = () => {
    setHasCompletedOnboarding(true)
    setHasSeenWelcome(true)
  }

  if (showOnboarding) {
    return <OnboardingPage onBegin={handleBeginJourney} />
  }

  return (
    <PageWrapper>
      <LandingScreen onGetUnstuck={() => navigate(hasSeenWelcome ? '/input' : '/welcome')} />
    </PageWrapper>
  )
}
