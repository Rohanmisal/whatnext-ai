import * as Sentry from '@sentry/node'

const dsn = (process.env.SENTRY_DSN || '').trim()

const NOISE_MESSAGES = [
  'LIMIT_REACHED',
  'FORBIDDEN_SESSION',
  'FORBIDDEN_PATH',
  'Too many requests',
]

export const initSentry = () => {
  if (!dsn) return

  Sentry.init({
    dsn,
    enabled: Boolean(dsn),
    environment: process.env.NODE_ENV || 'development',
    integrations: [Sentry.expressIntegration()],
    // Keep low to protect free-tier event budgets.
    tracesSampleRate: 0.02,
    sampleRate: 0.8,
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
export const setupSentryExpressErrorHandler = (app: { use: (middleware: unknown) => unknown }) => {
  if (!dsn) return
  Sentry.setupExpressErrorHandler(app)
}

export const captureServerException = (
  err: unknown,
  context?: { area?: string; route?: string; status?: number }
) => {
  if (!dsn) return

  Sentry.withScope((scope) => {
    if (context?.area) scope.setTag('area', context.area)
    if (context?.route) scope.setTag('route', context.route)
    if (typeof context?.status === 'number') scope.setTag('status_code', String(context.status))
    Sentry.captureException(err)
  })
}
