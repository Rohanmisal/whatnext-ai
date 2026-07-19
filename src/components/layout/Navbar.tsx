import { useLocation, useNavigate } from 'react-router-dom'
import { Header } from '../Navigation'

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()

  const activeTab = (() => {
    if (location.pathname === '/') return 'Home'
    if (location.pathname === '/pricing') return 'Pricing'
    if (location.pathname === '/history') return 'History'
    if (location.pathname === '/explore') return 'Explore'
    if (location.pathname === '/profile') return ''
    if (location.pathname.startsWith('/results') || location.pathname.startsWith('/path') || location.pathname.startsWith('/chat')) return 'My Paths'
    return 'Home'
  })()

  return (
    <Header
      activeTab={activeTab}
      onProfileClick={() => navigate('/profile')}
      onTabChange={(tab) => {
        if (tab === 'Home') navigate('/')
        if (tab === 'Pricing') navigate('/pricing')
        if (tab === 'History') navigate('/history')
        if (tab === 'My Paths') navigate('/results')
        if (tab === 'Explore') navigate('/explore')
      }}
    />
  )
}
