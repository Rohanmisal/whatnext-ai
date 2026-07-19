import { CheckCircle, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } },
};

const sectionStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-medium tracking-[0.08em] uppercase text-outline-variant mb-4">
      {children}
    </p>
  );
}

function SectionHeading({ title, sub }: { title: string; sub: string }) {
  return (
    <motion.div variants={fadeUp} className="mb-12">
      <SectionLabel>{title}</SectionLabel>
      <h2 className="font-display text-[clamp(26px,3vw,34px)] font-semibold tracking-tight text-on-surface mb-2.5">
        {title === 'How it works'
          ? 'Three steps from stuck to moving forward'
          : title === 'What makes it different'
          ? 'Built around how people actually get stuck'
          : title === 'Early users'
          ? 'Real people, navigating real situations'
          : title}
      </h2>
      <p className="text-on-surface-variant font-light text-base">{sub}</p>
    </motion.div>
  );
}

// ─── How It Works ────────────────────────────────────────────────────────────
const HOW_STEPS = [
  {
    num: '1',
    title: 'Describe your situation',
    desc: "Tell us what you're trying to do and what's blocking you — in plain, everyday language. No jargon or formal structure needed.",
  },
  {
    num: '2',
    title: 'Get three paths forward',
    desc: 'Our AI maps out an Easy, Medium, and Advanced route — each with numbered steps, estimated timelines, and the tools you\'ll need.',
  },
  {
    num: '3',
    title: 'Follow, track & ask',
    desc: 'Mark steps done, ask follow-up questions, and revisit your journey anytime. Your personal Navigator stays with you throughout.',
  },
];

// ─── Features ─────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: '⚖️',
    title: 'Asymmetric Guidance',
    desc: "Our AI doesn't just give one answer. It maps three distinct paths — Safe, Bold, and Balanced — giving you the agency to choose your own direction based on your risk tolerance.",
  },
  {
    icon: '💬',
    title: 'Plain Language Always',
    desc: 'Complexity stripped away. We turn messy life problems into clear, actionable bullet points. No MBA, no experience, no confusion required.',
  },
  {
    icon: '🕐',
    title: 'Path History & Progress',
    desc: "Every path you start is saved. Track which step you're on, see how far you've come, and pick up exactly where you left off — even weeks later.",
  },
  {
    icon: '🧭',
    title: 'Wise Navigation Philosophy',
    desc: 'Built on a foundation of calm-under-pressure intelligence. Modern, practical, and always focused on what matters — moving you forward.',
  },
];

// ─── Testimonials ─────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    quote:
      'I was completely lost after quitting my job. Within 5 minutes I had three actual options laid out. That clarity was exactly what I needed to stop overthinking.',
    name: 'Aditya S.',
    role: 'Career switch · Mumbai',
    initials: 'AS',
  },
  {
    quote:
      'The steps are so much better than vague AI advice. It told me which tools to use, in what order, and roughly how long each step takes. Game changer.',
    name: 'Priya R.',
    role: 'Starting a food business · Delhi',
    initials: 'PR',
  },
  {
    quote:
      "Used it when I felt overwhelmed about savings. The balanced path had 6 steps I could actually do with my salary. Currently on step 4 — feeling in control.",
    name: 'Rahul K.',
    role: 'Finance planning · Pune',
    initials: 'RK',
  },
];

// ─── Stats ────────────────────────────────────────────────────────────────────
const STATS = [
  { value: '1.2k+', label: 'Paths created' },
  { value: '6', label: 'Categories' },
  { value: '3', label: 'Paths per analysis' },
  { value: 'Free', label: 'To get started' },
];

// ─── Component ────────────────────────────────────────────────────────────────
export function LandingScreen({ onGetUnstuck }: { onGetUnstuck: () => void }) {
  const navigate = useNavigate();
  const [howOpen, setHowOpen] = useState(false);

  return (
    <div className="relative overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[600px] rounded-full bg-[radial-gradient(ellipse,rgba(244,162,97,0.07)_0%,transparent_65%)]" />
      <div className="pointer-events-none absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] bg-primary-container/[0.06]" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-[150px] bg-secondary-container/[0.05]" />

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative z-10 pt-28 pb-20 px-6 max-w-[860px] mx-auto text-center">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center"
        >
          {/* Badge */}
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-container/10 border border-primary-container/25 text-primary-container text-[11px] font-medium tracking-[0.08em] uppercase mb-7"
          >
            <span className="text-[9px] leading-none">✦</span>
            Your Personal Navigation Intelligence
          </motion.div>

          {/* Headline — text-pretty balances lines; accent phrase stays on one line */}
          <motion.h1
            variants={fadeUp}
            className="mx-auto mb-5 max-w-[16em] font-display text-[clamp(32px,5.5vw,64px)] font-bold leading-[1.12] tracking-tight text-pretty text-on-surface sm:max-w-[20em]"
          >
            Stuck? Tell us what&apos;s going on — we&apos;ll show you{' '}
            <span className="whitespace-nowrap text-primary-container">what to do next.</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            variants={fadeUp}
            className="text-lg md:text-[19px] font-light text-on-surface-variant max-w-[520px] mb-11 leading-[1.65]"
          >
            Describe your situation in plain words. Get three clear paths forward — Safe, Bold,
            and Balanced — explained simply.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeUp}
            className="flex flex-wrap items-center justify-center gap-3 mb-7"
          >
            <button
              onClick={onGetUnstuck}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-primary-container text-[#1a0d06] text-base font-semibold shadow-[0_8px_32px_rgba(244,162,97,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(244,162,97,0.36)] active:scale-95"
            >
              Get Unstuck →
            </button>
            <button
              onClick={() => setHowOpen((v) => !v)}
              className="inline-flex items-center gap-2 px-7 py-4 rounded-full border border-white/[0.11] bg-transparent text-on-surface-variant text-[15px] font-light transition-all duration-200 hover:border-primary-container/25 hover:text-on-surface"
            >
              ▶ See how it works
            </button>
          </motion.div>

          {/* "See how it works" inline reveal */}
          <AnimatePresence>
            {howOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden w-full max-w-[620px] mb-6"
              >
                <div className="bg-surface-container-low border border-white/[0.06] rounded-2xl p-5 text-left">
                  <ol className="space-y-3">
                    {['Describe your situation in plain words.', 'Receive three tailored paths: Safe, Bold, and Balanced.', 'Follow step-by-step, track progress, and ask follow-up questions anytime.'].map(
                      (step, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-on-surface-variant font-light">
                          <span className="mt-0.5 w-5 h-5 rounded-full bg-primary-container/10 border border-primary-container/25 flex items-center justify-center text-[11px] font-bold text-primary-container shrink-0 font-display">
                            {i + 1}
                          </span>
                          {step}
                        </li>
                      )
                    )}
                  </ol>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Trust row */}
          <motion.div
            variants={fadeUp}
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-outline-variant"
          >
            <span className="flex items-center gap-1.5">
              <CheckCircle size={14} className="text-primary-container/60" /> No account needed
            </span>
            <span className="w-px h-3.5 bg-white/10" />
            <span className="flex items-center gap-1.5">
              <Lock size={14} className="text-primary-container/60" /> Private & Secure
            </span>
            <span className="w-px h-3.5 bg-white/10" />
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container/40" />
              1,200+ paths created
            </span>
            <span className="w-px h-3.5 bg-white/10" />
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container/40" />
              Free to start
            </span>
          </motion.div>
        </motion.div>
      </section>

      <div className="border-t border-white/[0.06]" />

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <motion.section
        className="relative z-10 max-w-[1060px] mx-auto px-6 py-20"
        variants={sectionStagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
      >
        <SectionHeading
          title="How it works"
          sub="No jargon. No overwhelm. Just a clear path tailored to your situation."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 rounded-[20px] overflow-hidden border border-white/[0.06]">
          {HOW_STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              variants={fadeUp}
              className={[
                'bg-surface-container-low p-9 relative',
                i < HOW_STEPS.length - 1
                  ? 'border-b md:border-b-0 md:border-r border-white/[0.06]'
                  : '',
              ].join(' ')}
            >
              <div className="w-12 h-12 rounded-xl bg-primary-container/10 border border-primary-container/25 flex items-center justify-center font-display text-lg font-bold text-primary-container mb-5">
                {step.num}
              </div>
              <h3 className="font-display text-[17px] font-semibold tracking-tight text-on-surface mb-2.5">
                {step.title}
              </h3>
              <p className="text-on-surface-variant text-sm font-light leading-relaxed">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <div className="border-t border-white/[0.06]" />

      {/* ═══════════ FEATURES ═══════════ */}
      <motion.section
        className="relative z-10 max-w-[1060px] mx-auto px-6 py-20"
        variants={sectionStagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
      >
        <SectionHeading
          title="What makes it different"
          sub="Not generic AI advice — real, structured guidance matched to your specific situation."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {FEATURES.map((feat) => (
            <motion.div
              key={feat.title}
              variants={fadeUp}
              className="bg-surface-container-low border border-white/[0.06] rounded-[20px] p-8 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.11]"
            >
              <span className="text-[26px] block mb-4">{feat.icon}</span>
              <h3 className="font-display text-[17px] font-semibold tracking-tight text-on-surface mb-2.5">
                {feat.title}
              </h3>
              <p className="text-on-surface-variant text-sm font-light leading-relaxed">
                {feat.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <div className="border-t border-white/[0.06]" />

      {/* ═══════════ TESTIMONIALS ═══════════ */}
      <motion.section
        className="relative z-10 max-w-[1060px] mx-auto px-6 py-20"
        variants={sectionStagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
      >
        <SectionHeading
          title="Early users"
          sub="A few words from people who used WhatNext AI during our early access phase."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {TESTIMONIALS.map((t) => (
            <motion.div
              key={t.name}
              variants={fadeUp}
              className="bg-surface-container-low border border-white/[0.06] rounded-[20px] p-6 transition-all duration-200 hover:border-primary-container/25"
            >
              <div className="relative pt-5 mb-5">
                <span className="absolute top-0 left-0 font-serif text-4xl leading-none text-primary-container select-none">
                  "
                </span>
                <p className="text-on-surface-variant text-[14px] font-light italic leading-[1.7]">
                  {t.quote}
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-primary-container/10 border border-primary-container/25 flex items-center justify-center text-[11px] font-bold text-primary-container font-display shrink-0">
                  {t.initials}
                </div>
                <div>
                  <p className="text-[13px] font-medium text-on-surface">{t.name}</p>
                  <p className="text-xs text-outline-variant">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ═══════════ CTA BANNER ═══════════ */}
      <motion.div
        className="relative z-10 mx-6 mb-20 md:mx-12 bg-surface-container-low border border-primary-container/25 rounded-[20px] py-16 px-6 md:px-12 text-center overflow-hidden"
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Background glow */}
        <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(244,162,97,0.08)_0%,transparent_70%)]" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-container/10 border border-primary-container/25 text-primary-container text-[11px] font-medium tracking-[0.08em] uppercase mb-5">
            <span className="text-[9px]">✦</span>
            Free to start · No card needed
          </div>

          <h2 className="font-display text-[clamp(28px,3vw,36px)] font-bold tracking-tight text-on-surface mb-3">
            Ready to find your next move?
          </h2>
          <p className="text-on-surface-variant font-light text-base mb-9 max-w-[480px] mx-auto leading-relaxed">
            Describe your situation and get your first three paths in under 60 seconds. No account
            needed to try.
          </p>

          <div className="flex flex-wrap gap-3 justify-center mb-12">
            <button
              onClick={onGetUnstuck}
              className="inline-flex items-center gap-2 px-10 py-4 rounded-full bg-primary-container text-[#1a0d06] text-base font-semibold shadow-[0_8px_32px_rgba(244,162,97,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(244,162,97,0.36)] active:scale-95"
            >
              Get Unstuck Now →
            </button>
            <button
              onClick={() => navigate('/explore')}
              className="inline-flex items-center gap-2 px-7 py-4 rounded-full border border-white/[0.11] bg-transparent text-on-surface-variant text-[15px] font-light transition-all duration-200 hover:border-primary-container/25 hover:text-on-surface"
            >
              Explore situations
            </button>
          </div>

          {/* Stats */}
          <div className="border-t border-white/[0.06] pt-10 flex flex-wrap justify-center gap-x-12 gap-y-6">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <strong className="block font-display text-[30px] font-bold text-primary-container tracking-tight leading-none mb-1">
                  {s.value}
                </strong>
                <span className="text-[13px] text-outline-variant">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
