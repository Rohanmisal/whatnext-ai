import type { Request, Response, NextFunction } from 'express'
import { captureServerException } from '../services/sentry.js'

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.error('[ERROR]', err)
  captureServerException(err, { area: 'express_error_handler', status: 500 })
  const isProd = process.env.NODE_ENV === 'production'
  const message = isProd
    ? 'Internal server error'
    : (err instanceof Error ? err.message : 'Internal server error')
  res.status(500).json({ success: false, error: message })
}
