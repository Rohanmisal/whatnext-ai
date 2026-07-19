import { Compass, Clock, Shield, ArrowLeft, MoreHorizontal, Download, Share2, Play, Circle, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export function RecommendedPathScreen({ onBack }: { onBack: () => void }) {
  const actions = [
    { id: 1, text: 'Establish core infrastructure blueprints', duration: 'Week 1-2', completed: true },
    { id: 2, text: 'Define performance benchmarks for 1M users', duration: 'Week 3', completed: false },
    { id: 3, text: 'Select modular tech stack (Node/Rust focus)', duration: 'Week 4', completed: false },
    { id: 4, text: 'Implement CI/CD pipeline automation', duration: 'Week 5-6', completed: false },
  ];

  return (
    <main className="min-h-screen pt-32 pb-32 px-6 flex flex-col items-center max-w-4xl mx-auto">
      <div className="w-full flex justify-between items-center mb-12">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} /> <span className="font-sans font-semibold">Back to Paths</span>
        </button>
        <div className="flex gap-2">
          <button className="p-2 h-10 w-10 bg-white/5 rounded-full text-slate-400 hover:text-white transition-all"><Share2 size={18} /></button>
          <button className="p-2 h-10 w-10 bg-white/5 rounded-full text-slate-400 hover:text-white transition-all"><MoreHorizontal size={18} /></button>
        </div>
      </div>

      <header className="w-full mb-12 flex flex-col md:flex-row gap-8 items-start md:items-center">
        <div className="p-6 bg-primary-container/10 border border-primary-container/20 rounded-2xl text-primary-container">
          <Compass size={48} />
        </div>
        <div className="space-y-3 flex-grow">
          <div className="flex gap-3">
             <span className="px-3 py-1 bg-primary-container/20 text-primary-container text-[10px] font-bold uppercase tracking-widest rounded-full">Expert Recommended</span>
             <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1"><Clock size={10} /> 8 Months</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl text-on-surface tracking-tight">Digital Product Architecture & Scaling</h1>
          <p className="font-sans text-on-surface-variant text-lg">Detailed blueprint for technical leadership and system resilience.</p>
        </div>
      </header>

      {/* Main Content Sections */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Why this path? */}
        <section className="glass-card p-8 rounded-2xl md:col-span-2">
          <h2 className="font-display text-2xl mb-4">Why This Path for You?</h2>
          <p className="font-sans text-on-surface-variant leading-relaxed">
            Based on your career trajectory in tech architecture and your expressed desire for deep system work, this path optimizes for your strengths in logic-heavy design while addressing your growth area in team scaling. It balances technical excellence with sustainable business growth.
          </p>
        </section>

        {/* Actionable Steps */}
        <section className="space-y-6 md:col-span-1">
          <h2 className="font-display text-2xl mb-4">Milestones</h2>
          <div className="space-y-4">
            {actions.map((action) => (
              <div key={action.id} className="bg-surface-container/50 border border-white/5 p-5 rounded-xl flex gap-4 items-start group hover:border-primary-container/30 transition-all cursor-pointer">
                {action.completed ? (
                  <CheckCircle2 className="text-secondary flex-shrink-0 mt-1" size={20} />
                ) : (
                  <Circle className="text-slate-600 flex-shrink-0 mt-1" size={20} />
                )}
                <div>
                  <p className={`font-sans font-medium mb-1 ${action.completed ? 'text-slate-400 line-through' : 'text-on-surface'}`}>{action.text}</p>
                  <p className="text-[11px] font-sans font-bold text-slate-500 uppercase tracking-widest">{action.duration}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Resources & Tools */}
        <section className="space-y-6 md:col-span-1">
          <h2 className="font-display text-2xl mb-4">Recommended Resources</h2>
          <div className="glass-card p-6 rounded-2xl flex flex-col gap-4 border-l-4 border-l-secondary">
             <div className="flex justify-between items-center">
               <span className="text-xs font-bold text-secondary uppercase tracking-widest">Guide Book</span>
               <Download size={16} className="text-slate-500" />
             </div>
             <h4 className="font-display text-lg text-on-surface">The Scaling Handbook for Architects</h4>
             <p className="text-sm text-on-surface-variant">Essential principles for moving from 10k to 10M concurrent users.</p>
             <button className="mt-2 w-full py-3 bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/20 rounded-lg font-display font-bold transition-all text-sm">
               Open Digital Copy
             </button>
          </div>
          
          <div className="glass-card p-6 rounded-2xl flex flex-col gap-4 border-l-4 border-l-primary-container">
             <div className="flex justify-between items-center">
               <span className="text-xs font-bold text-primary-container uppercase tracking-widest">Video Deep-Dive</span>
               <Play size={16} className="text-slate-500" />
             </div>
             <h4 className="font-display text-lg text-on-surface">Rust for Infrastructure Control</h4>
             <p className="text-sm text-on-surface-variant">A 45-minute technical guide on implementing low-level safety.</p>
             <button className="mt-2 w-full py-3 bg-primary-container/10 hover:bg-primary-container/20 text-primary-container border border-primary-container/20 rounded-lg font-display font-bold transition-all text-sm">
               Watch Presentation
             </button>
          </div>
        </section>
      </div>

      {/* Floating CTA */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-4">
        <button className="w-full bg-primary-container shadow-[0_20px_50px_rgba(5,11,20,0.8),0_0_20px_rgba(244,162,97,0.4)] text-[#050B14] py-5 rounded-2xl font-display text-xl font-extrabold flex items-center justify-center gap-3 transition-transform hover:scale-105 active:scale-95">
          Commit to this Path
          <Play size={20} fill="currentColor" />
        </button>
      </div>
    </main>
  );
}
