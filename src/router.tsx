import { createBrowserRouter } from 'react-router-dom'
import HomePage from './pages/HomePage'
import WelcomeSplash from './pages/WelcomeSplash'
import InputForm from './pages/InputForm'
import LoadingScreen from './pages/LoadingScreen'
import ResultsPage from './pages/ResultsPage'
import PathDetail from './pages/PathDetail'
import NavigatorChat from './pages/NavigatorChat'
import HistoryPage from './pages/HistoryPage'
import ErrorState from './pages/ErrorState'
import ExplorePage from './pages/ExplorePage'
import PricingPage from './pages/PricingPage'
import ProfilePage from './pages/ProfilePage'
import SignInPage from './pages/SignInPage'
import SignUpPage from './pages/SignUpPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import SessionDetailPage from './pages/SessionDetailPage'
import RouteErrorBoundary from './pages/RouteErrorBoundary'

const router = createBrowserRouter([
  {
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/welcome', element: <WelcomeSplash /> },
      { path: '/sign-in', element: <SignInPage /> },
      { path: '/sign-up', element: <SignUpPage /> },
      { path: '/auth/callback', element: <AuthCallbackPage /> },
      { path: '/input', element: <InputForm /> },
      { path: '/loading', element: <LoadingScreen /> },
      { path: '/results', element: <ResultsPage /> },
      { path: '/path/:id', element: <PathDetail /> },
      { path: '/chat/:id', element: <NavigatorChat /> },
      { path: '/history', element: <HistoryPage /> },
      { path: '/sessions/:id', element: <SessionDetailPage /> },
      { path: '/explore', element: <ExplorePage /> },
      { path: '/pricing', element: <PricingPage /> },
      { path: '/profile', element: <ProfilePage /> },
      { path: '/error', element: <ErrorState /> },
    ],
  },
])

export default router
