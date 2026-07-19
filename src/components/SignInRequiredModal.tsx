import { Link } from 'react-router-dom'
import { LogIn, UserPlus, X } from 'lucide-react'

type SignInRequiredModalProps = {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
}

export default function SignInRequiredModal({
  open,
  onClose,
  title = 'Sign in required',
  description = 'Please sign in to use follow-up chat, save your paths, and continue your progress.',
}: SignInRequiredModalProps) {
  if (!open) return null

  const btnClass =
    'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all hover:opacity-95 active:scale-[0.98]'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sign-in-required-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-surface-container p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id="sign-in-required-title" className="font-display text-xl font-semibold text-on-surface">
            {title}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-outline transition-colors hover:bg-surface-container-high hover:text-on-surface"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm leading-relaxed text-on-surface-variant">{description}</p>

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          <Link
            to="/sign-in"
            onClick={onClose}
            className={`${btnClass} border border-white/15 bg-surface-container-high text-on-surface`}
          >
            <LogIn className="size-4" aria-hidden />
            Sign in
          </Link>
          <Link
            to="/sign-up"
            onClick={onClose}
            className={`${btnClass} bg-primary text-on-primary`}
          >
            <UserPlus className="size-4" aria-hidden />
            Sign up free
          </Link>
        </div>
      </div>
    </div>
  )
}
