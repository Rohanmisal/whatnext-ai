import { Edit3, Lock, BookOpen, ArrowRight, ChevronDown, Library } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

export function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState('');

  const categories = ['Learning', 'Career', 'Business', 'Tech', 'Creative', 'Personal', 'Other'];

  return (
    <main className="min-h-screen pt-32 pb-24 px-4 flex flex-col items-center">
      {/* Progress Indicator */}
      <div className="w-full max-w-2xl mb-12">
        <div className="flex justify-between items-end mb-4">
          <div>
            <span className="font-sans text-sm text-primary-container uppercase tracking-widest font-semibold">Onboarding</span>
            <h1 className="font-display text-4xl text-on-surface mt-1">Charting Your Path</h1>
          </div>
          <span className="font-sans text-sm text-on-surface-variant">Step {step} of 2</span>
        </div>
        <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: '0%' }}
            animate={{ width: step === 1 ? '50%' : '100%' }}
            className="h-full bg-gradient-to-r from-secondary-container to-primary-container rounded-full shadow-[0_0_15px_rgba(244,162,97,0.5)]"
          />
        </div>
      </div>

      {/* Onboarding Flow Form Container */}
      <div className="w-full max-w-2xl space-y-8">
        {/* Step 1 Section */}
        <motion.section 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-8 rounded-xl ring-1 ring-white/5"
        >
          <div className="flex gap-4 mb-6">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-container/10 border border-primary-container/20 flex items-center justify-center text-primary-container">
              <Edit3 size={20} />
            </div>
            <div>
              <label className="font-display text-xl block mb-1">Tell us what you're currently working on or trying to do</label>
              <p className="font-sans text-on-surface-variant text-sm">Help our AI navigator understand the scope of your vision.</p>
            </div>
          </div>
          <textarea 
            className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-4 font-sans text-on-surface placeholder:text-slate-600 focus:ring-1 focus:ring-primary-container focus:border-primary-container min-h-[160px] transition-all outline-none"
            placeholder="e.g. I'm trying to start a small clothing business but don't know where to begin..."
          ></textarea>
          
          <div className="mt-6">
            <label className="font-sans text-sm text-on-surface-variant block mb-2">Primary Category</label>
            <div className="relative">
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-4 font-sans text-on-surface appearance-none focus:ring-1 focus:ring-primary-container cursor-pointer outline-none"
              >
                <option disabled value="">Select a category...</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
                <ChevronDown size={20} />
              </div>
            </div>
          </div>
        </motion.section>

        {/* Step 2 Section */}
        <motion.section 
          initial={{ opacity: 0.6 }}
          whileHover={{ opacity: 1 }}
          className="glass-card p-8 rounded-xl opacity-60 transition-opacity duration-500"
        >
          <div className="flex gap-4 mb-6">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-surface-container-highest border border-white/5 flex items-center justify-center text-on-surface-variant">
              <Lock size={20} />
            </div>
            <div>
              <label className="font-display text-xl block mb-1">What specifically is blocking you right now?</label>
              <p className="font-sans text-on-surface-variant text-sm">Be as specific as possible to get higher quality guidance.</p>
            </div>
          </div>
          <textarea 
            className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-4 font-sans text-on-surface placeholder:text-slate-600 focus:ring-1 focus:ring-primary-container focus:border-primary-container min-h-[120px] outline-none"
            placeholder="Identify the main hurdle..."
          ></textarea>
          
          <div className="mt-6 flex items-center justify-between p-4 bg-surface-container-low rounded-lg border border-white/5">
            <div className="flex gap-3 items-center">
              <Library size={20} className="text-secondary" />
              <div>
                <p className="font-sans text-sm font-semibold">Downloadable Resources</p>
                <p className="text-xs text-on-surface-variant">Include relevant guides and checklists</p>
              </div>
            </div>
            <button className="w-12 h-6 bg-surface-container-highest rounded-full relative p-1 transition-colors">
              <div className="w-4 h-4 bg-slate-400 rounded-full shadow-sm"></div>
            </button>
          </div>
        </motion.section>

        {/* CTA Button */}
        <div className="pt-8 flex flex-col items-center">
          <button 
            onClick={onComplete}
            className="group w-full md:w-auto px-12 py-4 bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-display text-lg font-bold rounded-full shadow-[0_10px_25px_rgba(244,162,97,0.3)] transition-all transform active:scale-95 flex items-center justify-center gap-3"
          >
            Find My Next Step
            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="mt-4 text-xs text-slate-500 font-sans">Your privacy is prioritized. Data is used only to personalize your navigation.</p>
        </div>
      </div>

      {/* Decorative Atmosphere */}
      <div className="fixed top-1/4 -right-64 w-96 h-96 bg-primary-container/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-1/4 -left-64 w-96 h-96 bg-secondary-container/5 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="fixed inset-0 -z-10 opacity-20 grayscale pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#050B14] via-transparent to-[#050B14]"></div>
        <img 
          className="w-full h-full object-cover"
          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2070" 
          alt="Mountains"
        />
      </div>
    </main>
  );
}
