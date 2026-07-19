import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import PageWrapper from '../components/layout/PageWrapper'

type ExploreItem = {
  id: string
  category: string
  title: string
  description: string
  users: string
  difficulties: Array<'Easy' | 'Medium' | 'Advanced'>
  featured?: boolean
  emoji?: string
}

const categories = ['All', 'Business', 'Tech', 'Learning', 'Career', 'Creative', 'Finance']

const items: ExploreItem[] = [
  {
    id: 'business-food',
    category: 'Business',
    title: "Want to start a food business but don't know where to begin",
    description: 'Registration, first customers, and payment setup covered step by step.',
    users: '847 people',
    difficulties: ['Easy', 'Medium', 'Advanced'],
  },
  {
    id: 'creative-youtube',
    category: 'Creative',
    title: 'Want to start YouTube but have no camera or editing skills',
    description: 'Phone-first approach, free tools, and a zero-budget start plan.',
    users: '1.2k people',
    difficulties: ['Easy', 'Medium', 'Advanced'],
  },
  {
    id: 'career-switch',
    category: 'Career',
    title: 'Stuck in one career path but want to switch to startup work',
    description: 'Risk map, skill transfer roadmap, and transition timeline included.',
    users: '563 people',
    difficulties: ['Easy', 'Medium', 'Advanced'],
  },
  {
    id: 'finance-saving',
    category: 'Finance',
    title: 'Want to start saving but nothing is left after expenses',
    description: 'Micro-saving system and starter plan examples, even on a tight salary.',
    users: '2.1k people',
    difficulties: ['Easy', 'Medium', 'Advanced'],
  },
  {
    id: 'tech-coding',
    category: 'Tech',
    title: "Want to learn coding but don't know which language to start with",
    description: 'Beginner path based on your goal — web, mobile, or data science.',
    users: '934 people',
    difficulties: ['Easy', 'Medium'],
  },
  {
    id: 'learning-study',
    category: 'Learning',
    title: 'Want to build a study habit but keep losing motivation after a week',
    description: 'Habit-stacking methods, accountability systems, and quick daily wins.',
    users: '1.5k people',
    difficulties: ['Easy', 'Medium'],
  },
  {
    id: 'career-growth',
    category: 'Career',
    title: 'Feeling stuck in a job with no growth — want clarity on what to do next',
    description:
      'The most common stuck moment we see. Get a clear look at your options: stay and grow, pivot internally, or leave with a plan.',
    users: '3.4k people',
    difficulties: ['Easy', 'Medium', 'Advanced'],
    featured: true,
    emoji: '💼',
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } },
}

function DifficultyPill({ level }: { level: 'Easy' | 'Medium' | 'Advanced' }) {
  const styles = {
    Easy: 'bg-emerald-500/15 text-emerald-400',
    Medium: 'bg-primary-container/15 text-primary-container',
    Advanced: 'bg-red-500/15 text-red-400',
  }
  return (
    <span
      className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${styles[level]}`}
    >
      {level}
    </span>
  )
}

function SituationCard({
  item,
  onSelect,
}: {
  item: ExploreItem
  onSelect: () => void
}) {
  if (item.featured) {
    return (
      <motion.button
        type="button"
        variants={fadeUp}
        onClick={onSelect}
        className="col-span-1 flex w-full flex-col gap-5 rounded-[20px] border border-white/[0.1] bg-surface-container p-6 text-left transition-all hover:-translate-y-0.5 hover:border-primary-container/25 sm:col-span-2 sm:flex-row sm:items-center sm:gap-8"
      >
        <div className="flex size-20 shrink-0 items-center justify-center rounded-[14px] border border-primary-container/25 bg-primary-container/10 text-4xl">
          {item.emoji ?? '💼'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.09em] text-primary-container">
            {item.category} · Most explored
          </p>
          <h2 className="mb-2 font-display text-[15px] font-semibold leading-snug tracking-tight text-on-surface">
            {item.title}
          </h2>
          <p className="mb-4 text-[13px] font-light leading-relaxed text-on-surface-variant">
            {item.description}
          </p>
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {item.difficulties.map((d) => (
                <DifficultyPill key={d} level={d} />
              ))}
            </div>
            <span className="text-[12px] text-outline-variant">👥 {item.users}</span>
          </div>
        </div>
      </motion.button>
    )
  }

  return (
    <motion.button
      type="button"
      variants={fadeUp}
      onClick={onSelect}
      className="w-full rounded-[20px] border border-white/[0.08] bg-surface-container-low p-6 text-left transition-all hover:-translate-y-0.5 hover:border-primary-container/25"
    >
      <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.09em] text-primary-container">
        {item.category}
      </p>
      <h2 className="mb-2 font-display text-[15px] font-semibold leading-snug tracking-tight text-on-surface">
        {item.title}
      </h2>
      <p className="mb-4 text-[13px] font-light leading-relaxed text-on-surface-variant">
        {item.description}
      </p>
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {item.difficulties.map((d) => (
            <DifficultyPill key={d} level={d} />
          ))}
        </div>
        <span className="text-[12px] text-outline-variant">👥 {item.users}</span>
      </div>
    </motion.button>
  )
}

export default function ExplorePage() {
  const [activeCategory, setActiveCategory] = useState('All')
  const navigate = useNavigate()

  const filteredItems = useMemo(
    () =>
      activeCategory === 'All'
        ? items
        : items.filter((item) => item.category === activeCategory),
    [activeCategory]
  )

  const regularItems = filteredItems.filter((item) => !item.featured)
  const featuredItem = filteredItems.find((item) => item.featured)

  return (
    <PageWrapper>
      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mx-auto max-w-[1060px] px-5 pb-24 pt-28 sm:px-6"
      >
        <div className="mb-9">
          <h1 className="font-display text-[clamp(26px,3vw,32px)] font-bold tracking-tight text-on-surface">
            Explore Situations
          </h1>
          <p className="mt-2 text-[15px] font-light text-on-surface-variant">
            Browse common stuck moments and see example paths before trying your own.
          </p>
        </div>

        <div className="mb-10 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={[
                'rounded-full border px-4 py-2 text-[13px] font-medium transition-all',
                activeCategory === category
                  ? 'border-primary-container/30 bg-primary-container/10 text-primary-container'
                  : 'border-white/[0.08] bg-surface-container-low text-on-surface-variant hover:border-white/[0.12] hover:text-on-surface',
              ].join(' ')}
            >
              {category}
            </button>
          ))}
        </div>

        <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.08em] text-outline-variant">
          Popular situations
        </p>

        {filteredItems.length === 0 ? (
          <div className="rounded-[20px] border border-white/[0.08] bg-surface-container-low px-6 py-10 text-center">
            <p className="text-sm text-on-surface-variant">
              No situations in this category yet. Try another filter or describe your own.
            </p>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.06 } } }}
            className="grid grid-cols-1 gap-3.5 sm:grid-cols-2"
          >
            {regularItems.map((item) => (
              <SituationCard key={item.id} item={item} onSelect={() => navigate('/input')} />
            ))}
            {featuredItem && (
              <SituationCard
                key={featuredItem.id}
                item={featuredItem}
                onSelect={() => navigate('/input')}
              />
            )}
          </motion.div>
        )}

        <div className="mt-6 flex flex-col gap-4 rounded-[20px] border border-primary-container/25 bg-surface-container-low px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-[14px] font-light text-on-surface-variant">
            <span className="font-medium text-on-surface">None of these match your situation?</span>{' '}
            Describe yours and get completely personalised paths.
          </p>
          <button
            type="button"
            onClick={() => navigate('/input')}
            className="shrink-0 rounded-full border border-primary-container/30 bg-primary-container/10 px-5 py-2.5 text-[13px] font-medium text-primary-container transition hover:bg-primary-container/15"
          >
            Describe mine →
          </button>
        </div>

        <button
          type="button"
          onClick={() => navigate('/input')}
          className="mt-4 w-full rounded-full bg-primary-container px-6 py-4 text-base font-semibold text-[#1a0d06] shadow-[0_6px_28px_rgba(244,162,97,0.22)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(244,162,97,0.3)] active:scale-[0.98]"
        >
          Get My Personalised Paths
        </button>
      </motion.main>
    </PageWrapper>
  )
}
