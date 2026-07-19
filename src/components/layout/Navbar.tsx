import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Header } from '../Navigation'
import useAppStore from '../../store/useAppStore'
import { fetchMe } from '../../services/api'
import { getInitials } from '../../utils/helpers'

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const {
    user,
    accessToken,
    profileDisplayName,
    profileAvatarUrl,
    setProfileIdentity,
  } = useAppStore()

  // Keep navbar identity in sync with the server profile (name + avatar).
  useEffect(() => {
    if (!user || !accessToken) {
      setProfileIdentity({ displayName: null, avatarUrl: null })
      return
    }

    let cancelled = false
    fetchMe()
      .then((data: { user?: { displayName?: string | null; avatarUrl?: string | null } }) => {
        if (cancelled) return
        setProfileIdentity({
          displayName: data?.user?.displayName ?? user.name,
          avatarUrl:   data?.user?.avatarUrl ?? null,
        })
      })
      .catch(() => {
        if (cancelled) return
        setProfileIdentity({
          displayName: user.name,
          avatarUrl:   null,
        })
      })

    return () => {
      cancelled = true
    }
  }, [user?.id, user?.name, accessToken, setProfileIdentity])

  const activeTab = (() => {
    if (location.pathname === '/') return 'Home'
    if (location.pathname === '/pricing') return 'Pricing'
    if (location.pathname === '/history') return 'History'
    if (location.pathname === '/explore') return 'Explore'
    if (location.pathname === '/profile') return ''
    if (location.pathname.startsWith('/results') || location.pathname.startsWith('/path') || location.pathname.startsWith('/chat')) return 'My Paths'
    return 'Home'
  })()

  const displayName = profileDisplayName ?? user?.name ?? null
  // Guests: show "G" instead of "?" so the avatar reads as Guest mode
  const profileInitial = user ? getInitials(displayName, user.email) : 'G'
  const avatarUrl = profileAvatarUrl ?? user?.avatarUrl ?? null

  return (
    <Header
      activeTab={activeTab}
      profileInitial={profileInitial}
      profileAvatarUrl={avatarUrl}
      onProfileClick={() => navigate(user ? '/profile' : '/sign-in')}
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
