import { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
}

export default function Button({ children, className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`rounded-xl bg-primary-container px-5 py-3 font-display font-semibold text-on-primary transition-opacity hover:opacity-90 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
