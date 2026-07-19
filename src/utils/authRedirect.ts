const AUTH_PARAM_KEYS = ['code', 'error', 'error_code', 'error_description'] as const

function readParams(source: URLSearchParams) {
  return {
    error: source.get('error'),
    description: source.get('error_description'),
  }
}

/** Parse Supabase/Google OAuth errors from query string or hash fragment. */
export function parseAuthRedirectError(): string | null {
  if (typeof window === 'undefined') return null

  const url = new URL(window.location.href)
  let { error, description } = readParams(url.searchParams)

  if (!error && url.hash) {
    const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''))
    ;({ error, description } = readParams(hashParams))
  }

  if (!error) return null

  if (error === 'access_denied') {
    return 'Sign-in was cancelled.'
  }

  if (description) {
    const decoded = decodeURIComponent(description.replace(/\+/g, ' '))
    if (decoded.toLowerCase().includes('pkce code verifier not found')) {
      return 'Sign-in session expired. Please try Google sign-in again.'
    }
    if (decoded.toLowerCase().includes('unable to exchange external code')) {
      return 'Google sign-in could not be completed. Check that Google OAuth is configured in Supabase (Client ID, Client Secret, and redirect URI).'
    }
    return decoded
  }

  return error
}

/** Strip auth callback params from the URL after handling them. */
export function clearAuthRedirectParams(): void {
  if (typeof window === 'undefined') return

  const url = new URL(window.location.href)
  AUTH_PARAM_KEYS.forEach((key) => url.searchParams.delete(key))

  if (url.hash) {
    const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''))
    AUTH_PARAM_KEYS.forEach((key) => hashParams.delete(key))
    const remaining = hashParams.toString()
    url.hash = remaining ? `#${remaining}` : ''
  }

  const cleaned = `${url.pathname}${url.search}${url.hash}`
  window.history.replaceState({}, document.title, cleaned || '/')
}
