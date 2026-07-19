export const createSessionId = () => `session-${Date.now()}`

export const formatDate = (value: Date | string) => new Date(value).toLocaleString()

/** Initials for avatar fallbacks — "Bob" → "B", "Bob Smith" → "BS", else email first letter. */
export function getInitials(
  name?: string | null,
  email?: string | null
): string {
  const trimmed = name?.trim()
  if (trimmed) {
    const parts = trimmed.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return parts[0][0].toUpperCase()
  }
  const mail = email?.trim()
  if (mail) return mail[0].toUpperCase()
  return '?'
}
