/**
 * OAuth callback URL — always uses the current browser origin so localhost
 * and production never cross-redirect (VITE_APP_URL is build-time only).
 */
export function getAuthCallbackUrl(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/auth/callback`
  }
  const fromEnv = import.meta.env.VITE_APP_URL?.trim().replace(/\/$/, '')
  return fromEnv ? `${fromEnv}/auth/callback` : '/auth/callback'
}
