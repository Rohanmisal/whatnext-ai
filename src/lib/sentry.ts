import * as Sentry from '@sentry/react'

const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined

const NOISE_MESSAGES = [
  'Network Error',
  'Failed to fetch',
  'Request aborted',
  'LIMIT_REACHED',
  'FORBIDDEN_SESSION',
  'FORBIDDEN_PATH',
]

export const initSentry = () => {
  if (!dsn) return

  Sentry.init({
    dsn,
    enabled: Boolean(dsn),
    environment: import.meta.env.MODE,
    // Keep traces very low for free-tier budgets.
    tracesSampleRate: 0.03,
    // Capture a subset of non-fatal handled errors.
    sampleRate: 0.7,
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications.',
      'Script error.',
    ],
    beforeSend(event, hint) {
      const original = hint.originalException
      const message =
        (original instanceof Error && original.message) ||
        event.message ||
        ''

      if (NOISE_MESSAGES.some((fragment) => message.includes(fragment))) {
        return null
      }

      return event
    },
  })
}

export const captureFrontendException = (
  error: unknown,
  context?: { area?: string; endpoint?: string; status?: number }
) => {
  if (!dsn) return

  Sentry.withScope((scope) => {
    if (context?.area) scope.setTag('area', context.area)
    if (context?.endpoint) scope.setTag('endpoint', context.endpoint)
    if (typeof context?.status === 'number') scope.setTag('status_code', String(context.status))
    Sentry.captureException(error)
  })
}
