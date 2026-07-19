import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import PageWrapper from '../components/layout/PageWrapper'
import api from '../services/api'

type PlanId = 'explorer' | 'navigator' | 'guide'

type FeatureItem = {
  text: string
  type: 'yes' | 'no' | 'upgrade'
}

type Plan = {
  id: PlanId
  name: string
  availability: string
  availabilityType: 'now' | 'soon'
  price: string
  period?: string
  priceNote: string
  description: string
  features: FeatureItem[]
  cta: { label: string; action: 'start' | 'waitlist' }
  featured?: boolean
  buttonStyle: 'free' | 'filled' | 'outline'
}

const FAQ_ITEMS = [
  {
    q: 'Do I need a credit card to start?',
    a: 'No, never. The Explorer plan is completely free forever and requires no payment details whatsoever. Just sign up with your email or Google and start immediately.',
  },
  {
    q: 'What does "coming soon" mean for Navigator and Guide?',
    a: 'We are actively building these features now based on real user feedback from our early access phase. Join the waiting list and you will be first to know when they launch — and receive a discounted early-adopter price.',
  },
  {
    q: 'Will the prices change after launch?',
    a: 'The prices shown (~$3 and ~$5) are estimates. Waiting list members will be offered a lower launch price as a thank-you for their early support. We will always honour that price for as long as you stay subscribed.',
  },
  {
    q: 'Is my data private and secure?',
    a: "Absolutely. Your situation descriptions are never shared, sold, or used for advertising. Privacy is central to this product's purpose — you deserve a safe space to think through your life decisions.",
  },
  {
    q: 'Can I try it before creating an account?',
    a: 'Yes. You can use WhatNext AI as a guest without signing up at all. Your paths will not be saved between sessions, but it is a great way to see if the product is right for you before committing.',
  },
]

const COMPARE_ROWS: Array<{
  feature: string
  explorer: string | boolean
  navigator: string | boolean
  guide: string | boolean
}> = [
  { feature: 'Analyses per month', explorer: '3', navigator: 'Unlimited', guide: 'Unlimited' },
  { feature: 'Follow-up chat messages', explorer: '5', navigator: 'Unlimited', guide: 'Unlimited' },
  { feature: 'Path detail depth', explorer: 'Basic', navigator: 'Deep', guide: 'Deep' },
  { feature: 'Path history', explorer: false, navigator: true, guide: true },
  { feature: 'PDF + checklist downloads', explorer: false, navigator: true, guide: true },
  { feature: 'Team members', explorer: false, navigator: false, guide: 'Up to 5' },
  { feature: 'PowerPoint export', explorer: false, navigator: false, guide: true },
  { feature: 'Priority AI responses', explorer: false, navigator: false, guide: true },
  { feature: 'White-label option', explorer: false, navigator: false, guide: true },
]

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())

function FeatureRow({ item }: { item: FeatureItem }) {
  if (item.type === 'yes') {
    return (
      <li className="flex items-start gap-2.5 border-b border-white/[0.06] py-2.5 text-[13px] font-light text-on-surface last:border-b-0">
        <span className="mt-0.5 shrink-0 text-emerald-400">✓</span>
        {item.text}
      </li>
    )
  }
  if (item.type === 'upgrade') {
    return (
      <li className="flex items-start gap-2.5 border-b border-white/[0.06] py-2.5 text-[13px] font-light italic text-outline-variant last:border-b-0">
        <span className="mt-0.5 shrink-0 text-primary-container/60">↑</span>
        {item.text}
      </li>
    )
  }
  return (
    <li className="flex items-start gap-2.5 border-b border-white/[0.06] py-2.5 text-[13px] font-light text-outline-variant last:border-b-0">
      <span className="mt-0.5 shrink-0 opacity-50">—</span>
      {item.text}
    </li>
  )
}

function CompareCell({ value }: { value: string | boolean }) {
  if (typeof value === 'string') {
    return <span className="text-on-surface-variant">{value}</span>
  }
  return value ? (
    <span className="text-emerald-400">✓</span>
  ) : (
    <span className="text-outline-variant">—</span>
  )
}

export default function PricingPage() {
  const navigate = useNavigate()
  const [waitlistOpen, setWaitlistOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('navigator')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')
  const [counts, setCounts] = useState<{ total: number; byPlan: Record<string, number> } | null>(
    null
  )
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const plans: Plan[] = useMemo(
    () => [
      {
        id: 'explorer',
        name: 'Explorer',
        availability: '● Available now',
        availabilityType: 'now',
        price: 'Free',
        priceNote: 'Forever. No credit card needed.',
        description:
          'Perfect for trying out the product and solving your first stuck moment at no cost.',
        features: [
          { text: '3 analyses per month', type: 'yes' },
          { text: 'Basic path output (3 paths)', type: 'yes' },
          { text: '5 follow-up chat messages', type: 'yes' },
          { text: 'History — unlock with Navigator', type: 'upgrade' },
          { text: 'Downloads — unlock with Navigator', type: 'upgrade' },
        ],
        cta: { label: 'Get started free →', action: 'start' },
        buttonStyle: 'free',
      },
      {
        id: 'navigator',
        name: 'Navigator',
        availability: 'Coming soon',
        availabilityType: 'soon',
        price: '~$3',
        period: '/ month',
        priceNote: 'Exact price confirmed at launch.',
        description:
          'For people serious about making progress who want unlimited access and full history.',
        features: [
          { text: 'Unlimited analyses', type: 'yes' },
          { text: 'Deeper path detail', type: 'yes' },
          { text: 'Unlimited follow-up chat', type: 'yes' },
          { text: 'PDF + checklist downloads', type: 'yes' },
          { text: 'Full history + progress tracking', type: 'yes' },
        ],
        cta: { label: 'Join waiting list →', action: 'waitlist' },
        featured: true,
        buttonStyle: 'filled',
      },
      {
        id: 'guide',
        name: 'Guide',
        availability: 'Coming soon',
        availabilityType: 'soon',
        price: '~$5',
        period: '/ month',
        priceNote: 'Exact price confirmed at launch.',
        description: 'For teams, coaches, and power users who need the complete suite.',
        features: [
          { text: 'Everything in Navigator', type: 'yes' },
          { text: 'Up to 5 team members', type: 'yes' },
          { text: 'PowerPoint export', type: 'yes' },
          { text: 'Priority AI responses', type: 'yes' },
          { text: 'White-label option', type: 'yes' },
        ],
        cta: { label: 'Join waiting list →', action: 'waitlist' },
        buttonStyle: 'outline',
      },
    ],
    []
  )

  const openWaitlist = (planId: PlanId) => {
    setSelectedPlan(planId)
    setWaitlistOpen(true)
    setStatus('idle')
    setError('')
    setCounts(null)
  }

  const closeWaitlist = () => {
    setWaitlistOpen(false)
    setStatus('idle')
    setError('')
    setCounts(null)
  }

  const submitWaitlist = async () => {
    const trimmed = email.trim()
    if (!isValidEmail(trimmed)) {
      setStatus('error')
      setError('Please enter a valid email.')
      return
    }

    setStatus('submitting')
    setError('')

    try {
      const response = await api.post('/waitlist', { email: trimmed, plan: selectedPlan })
      const data = response.data as {
        success: boolean
        counts?: { total: number; byPlan: Record<string, number> }
        error?: string
      }
      if (!data.success) throw new Error(data.error || 'Failed to join waitlist')
      setCounts(data.counts || null)
      setStatus('success')
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to join waitlist'
      setStatus('error')
      setError(message)
    }
  }

  const selectedPlanLabel = plans.find((p) => p.id === selectedPlan)?.name || 'Navigator'

  const buttonClass = (style: Plan['buttonStyle']) => {
    if (style === 'free') {
      return 'border border-emerald-500/25 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15'
    }
    if (style === 'filled') {
      return 'bg-primary-container text-[#1a0d06] shadow-[0_4px_20px_rgba(244,162,97,0.24)] hover:-translate-y-0.5'
    }
    return 'border border-white/[0.1] bg-transparent text-on-surface-variant hover:border-primary-container/25 hover:bg-primary-container/10 hover:text-primary-container'
  }

  return (
    <PageWrapper>
      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mx-auto max-w-[1060px] px-5 pb-24 pt-28 sm:px-6"
      >
        <div className="mb-14 inline-flex items-center gap-2 rounded-full border border-primary-container/25 bg-primary-container/10 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-primary-container">
          <span className="text-[9px]">✦</span>
          Simple, transparent pricing
        </div>

        <h1 className="font-display text-[clamp(32px,4vw,44px)] font-bold tracking-tight text-on-surface">
          Pricing
        </h1>
        <p className="mt-3.5 max-w-[560px] text-base font-light leading-relaxed text-on-surface-variant">
          Free to try. Pay only when it proves value. Paid plans are in early access — join the
          waiting list and get a discounted launch price when we go live.
        </p>

        {/* Plan cards */}
        <div className="mt-14 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-[20px] border p-7 transition hover:-translate-y-0.5 ${
                plan.featured
                  ? 'border-primary-container/25 bg-surface-container-low'
                  : 'border-white/[0.08] bg-surface-container-low'
              }`}
            >
              {plan.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary-container px-4 py-1 text-[11px] font-semibold text-[#1a0d06]">
                  Most popular
                </span>
              )}

              <p className="font-display text-xl font-bold tracking-tight text-on-surface">
                {plan.name}
              </p>
              <p
                className={`mt-1 text-xs ${
                  plan.availabilityType === 'now' ? 'text-emerald-400' : 'text-outline-variant'
                }`}
              >
                {plan.availability}
              </p>

              <div className="mt-6 flex items-baseline gap-1.5">
                <span
                  className={`font-display text-[34px] font-bold leading-none tracking-tight ${
                    plan.id === 'explorer' ? 'text-emerald-400' : 'text-primary-container'
                  }`}
                >
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="text-sm font-light text-outline-variant">{plan.period}</span>
                )}
              </div>
              <p className="mt-2 text-xs font-light italic text-outline-variant">{plan.priceNote}</p>
              <p className="mt-6 text-[13px] font-light leading-relaxed text-on-surface-variant">
                {plan.description}
              </p>

              <ul className="my-6 flex-1">
                {plan.features.map((feat) => (
                  <FeatureRow key={feat.text} item={feat} />
                ))}
              </ul>

              <button
                type="button"
                onClick={() => {
                  if (plan.cta.action === 'start') navigate('/input')
                  else openWaitlist(plan.id)
                }}
                className={`flex w-full items-center justify-center rounded-full px-4 py-3 text-sm font-semibold transition active:scale-[0.98] ${buttonClass(plan.buttonStyle)}`}
              >
                {plan.cta.label}
              </button>
            </div>
          ))}
        </div>

        {/* Compare table */}
        <section className="mt-16">
          <h2 className="mb-6 font-display text-[22px] font-semibold tracking-tight text-on-surface">
            Compare plans
          </h2>
          <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[560px] border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-on-surface-variant">
                    Feature
                  </th>
                  {plans.map((plan) => (
                    <th
                      key={plan.id}
                      className="px-4 py-2.5 text-center font-display text-[13px] font-semibold text-primary-container"
                    >
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row) => (
                  <tr
                    key={row.feature}
                    className="border-b border-white/[0.06] transition hover:bg-surface-container-low/50"
                  >
                    <td className="px-4 py-3 text-[13px] font-light text-on-surface-variant">
                      {row.feature}
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                      <CompareCell value={row.explorer} />
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                      <CompareCell value={row.navigator} />
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                      <CompareCell value={row.guide} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-16">
          <h2 className="mb-6 font-display text-[22px] font-semibold tracking-tight text-on-surface">
            Common questions
          </h2>
          <div className="space-y-2.5">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openFaq === index
              return (
                <div
                  key={item.q}
                  className={`overflow-hidden rounded-[14px] border bg-surface-container-low transition ${
                    isOpen ? 'border-primary-container/25' : 'border-white/[0.08]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-sm font-medium text-on-surface"
                  >
                    {item.q}
                    <ChevronDown
                      className={`size-4 shrink-0 text-outline-variant transition ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 pb-4 text-[13px] font-light leading-relaxed text-on-surface-variant">
                          {item.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </section>
      </motion.main>

      {/* Waitlist modal */}
      {waitlistOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-[20px] border border-white/[0.1] bg-surface-container-low p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-display text-lg font-semibold text-on-surface">
                  Join the waiting list
                </p>
                <p className="mt-1 text-sm text-outline-variant">
                  Plan: <span className="text-on-surface">{selectedPlanLabel}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={closeWaitlist}
                className="rounded-lg px-2 py-1 text-outline-variant hover:bg-white/5 hover:text-on-surface"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm text-on-surface-variant">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/[0.08] bg-surface-container px-4 py-3 text-on-surface outline-none focus:border-primary-container/40"
              />
              <p className="mt-2 text-xs text-outline-variant">
                We'll only use this to contact you when early access opens.
              </p>
            </div>

            {status === 'error' && <div className="mt-4 text-sm text-red-300">{error}</div>}
            {status === 'success' && (
              <div className="mt-4 text-sm text-emerald-300">
                You're on the list. Thanks!
                {counts && (
                  <div className="mt-2 text-xs text-outline-variant">
                    Current interest: {counts.total} total
                    {typeof counts.byPlan?.navigator === 'number'
                      ? ` • Navigator: ${counts.byPlan.navigator}`
                      : ''}
                    {typeof counts.byPlan?.guide === 'number'
                      ? ` • Guide: ${counts.byPlan.guide}`
                      : ''}
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={closeWaitlist}
                className="flex-1 rounded-full border border-white/[0.1] bg-transparent px-5 py-3 text-sm font-semibold text-on-surface-variant transition hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitWaitlist}
                disabled={status === 'submitting'}
                className="flex-1 rounded-full bg-primary-container px-5 py-3 text-sm font-semibold text-[#1a0d06] transition hover:opacity-90 disabled:opacity-50"
              >
                {status === 'submitting' ? 'Joining…' : 'Join waiting list'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}
