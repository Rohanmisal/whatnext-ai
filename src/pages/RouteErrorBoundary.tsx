import { useEffect } from 'react'
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom'
import { captureFrontendException } from '../lib/sentry'

export default function RouteErrorBoundary() {
  const error = useRouteError()
  const navigate = useNavigate()

  let title = 'Something went wrong'
  let message = 'An unexpected error occurred. Please try again.'

  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText || 'Error'}`
    message = typeof error.data === 'string' ? error.data : message
  } else if (error instanceof Error) {
    message = error.message
  }

  useEffect(() => {
    if (isRouteErrorResponse(error)) {
      captureFrontendException(new Error(`Route error: ${error.status} ${error.statusText || 'Error'}`), {
        area: 'route_boundary',
        status: error.status,
      })
      return
    }
    if (error instanceof Error) {
      captureFrontendException(error, { area: 'route_boundary' })
    }
  }, [error])

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-surface-container-lowest">
      <div className="max-w-xl w-full rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
        <h1 className="font-display text-2xl text-on-surface">{title}</h1>
        <p className="mt-3 text-sm text-red-200">{message}</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg px-4 py-2 text-sm border border-white/20 text-on-surface hover:bg-white/5"
          >
            Go Back
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="rounded-lg px-4 py-2 text-sm bg-primary text-on-primary hover:opacity-90"
          >
            Go Home
          </button>
        </div>
      </div>
    </main>
  )
}
