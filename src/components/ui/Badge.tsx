import { ReactNode } from 'react'

export default function Badge({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-primary-container/20 px-3 py-1 text-xs font-bold text-primary">{children}</span>
}
