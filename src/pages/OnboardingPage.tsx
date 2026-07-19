import {
  ArrowRight,
  Compass,
  ListTodo,
  LogIn,
  UserCog,
  Waypoints,
} from 'lucide-react'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'

type OnboardingPageProps = {
  onBegin: () => void
}

const steps = [
  {
    icon: ListTodo,
    label: 'Describe Situation',
  },
  {
    icon: UserCog,
    label: 'AI Analyzes',
  },
  {
    icon: Waypoints,
    label: 'Get Your Paths',
  },
] as const

export default function OnboardingPage({ onBegin }: OnboardingPageProps) {
  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16 text-center"
      style={{
        background:
          'radial-gradient(ellipse 120% 80% at 50% 40%, #1a1c2c 0%, #0a0a0b 55%, #050508 100%)',
      }}
    >
      <div className="relative z-10 flex w-full max-w-lg flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex flex-col items-center gap-3"
        >
          <div
            className="flex size-14 items-center justify-center rounded-2xl shadow-[0_0_32px_rgba(245,166,99,0.35)]"
            style={{ backgroundColor: '#f5a663' }}
          >
            <Compass className="size-7 text-white" strokeWidth={2} />
          </div>
          <p
            className="font-display text-xl font-bold tracking-tight"
            style={{ color: '#f5a663' }}
          >
            WhatNext
          </p>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="font-display mt-12 text-3xl font-bold leading-tight text-white sm:text-4xl"
        >
          Your AI Navigator is Ready.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="font-sans mt-5 max-w-md text-base leading-relaxed sm:text-lg"
          style={{ color: '#a0aec0' }}
        >
          Answer 2 quick questions. Get multiple clear paths forward. No jargon,
          no overwhelm.
        </motion.p>

        <motion.ul
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.15 }}
          className="mt-14 flex w-full max-w-md justify-between gap-4 sm:gap-8"
        >
          {steps.map(({ icon: Icon, label }) => (
            <li key={label} className="flex flex-1 flex-col items-center gap-3">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-[#3d4f64]/90 text-white shadow-inner ring-1 ring-white/10 sm:size-16">
                <Icon className="size-7 opacity-95 sm:size-8" strokeWidth={1.75} />
              </div>
              <span className="font-sans text-xs text-white sm:text-sm">{label}</span>
            </li>
          ))}
        </motion.ul>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2 }}
          className="mt-14 flex w-full max-w-sm flex-col items-center"
        >
          <button
            type="button"
            onClick={onBegin}
            className="group relative w-full rounded-full px-8 py-4 font-display text-base font-semibold shadow-[0_12px_40px_rgba(245,166,99,0.45)] transition hover:brightness-105 active:scale-[0.98] sm:text-lg"
            style={{
              background: 'linear-gradient(180deg, #f5c896 0%, #f5a663 55%, #e8944a 100%)',
              color: '#2d3748',
            }}
          >
            <span className="inline-flex items-center justify-center gap-2">
              Begin My Journey
              <ArrowRight className="size-5 transition group-hover:translate-x-0.5" />
            </span>
          </button>
          <p className="font-sans mt-3 text-xs" style={{ color: 'rgba(160, 174, 192, 0.55)' }}>
            Takes less than 2 minutes
          </p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="font-sans mt-14 flex flex-wrap items-center justify-center gap-x-1 gap-y-1 text-sm"
          style={{ color: '#a0aec0' }}
        >
          <span>Already used WhatNext?</span>
          <Link
            to="/sign-in"
            className="inline-flex items-center gap-1 font-semibold transition hover:underline"
            style={{ color: '#f5a663' }}
          >
            Sign in
            <LogIn className="size-3.5 opacity-90" aria-hidden />
          </Link>
          <span className="text-white/25">·</span>
          <Link
            to="/sign-up"
            className="font-semibold transition hover:underline"
            style={{ color: '#f5a663' }}
          >
            Sign up
          </Link>
        </motion.p>
      </div>
    </div>
  )
}
