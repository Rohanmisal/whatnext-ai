/** Basic email format validation for sign-up and sign-in forms. */
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function validateEmail(email: string): { valid: boolean; message?: string } {
  const normalized = normalizeEmail(email)

  if (!normalized) {
    return { valid: false, message: 'Email address is required.' }
  }

  if (normalized.length > 254) {
    return { valid: false, message: 'Email address is too long.' }
  }

  if (!EMAIL_REGEX.test(normalized)) {
    return { valid: false, message: 'Please enter a valid email address.' }
  }

  return { valid: true }
}
