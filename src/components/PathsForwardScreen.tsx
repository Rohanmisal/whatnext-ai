import { Sparkles, MessageSquare, Compass, Shield, Clock, ArrowRight, Star } from 'lucide-react';
import { motion } from 'motion/react';

export function PathsForwardScreen({ onChoosePath }: { onChoosePath: (pathId: string) => void }) {
  const paths = [
    {
      id: 'p1',
      title: 'Digital Product Architecture & Scaling',
      type: 'Expert Path',
      description: 'Focus on high-level infrastructure design and performance optimization for rapid growth.',
      icon: Compass,
      color: 'primary-container',
      metrics: { time: '6-8 Months', risk: 'Moderate' }
    },
    {
      id: 'p2',
      title: 'Global Expansion Research & Data',
      type: 'Strategic Path',
      description: 'Leverage quantitative modeling to identify untapped international markets.',
      icon: Shield,
      color: 'secondary',
      metrics: { time: '12-18 Months', risk: 'High' }
    },
    {
      id: 'p3',
      title: 'Modular Design Systems Implementation',
      type: 'Efficient Path',
      description: 'Streamline creative output while maintaining strict brand consistency across all touchpoints.',
      icon: Star,
      color: 'tertiary',
      metrics: { time: '3-4 Months', risk: 'Low' }
    }
  ];

  return (
    <main className="min-h-screen pt-32 pb-32 px-6 flex flex-col items-center max-w-7xl mx-auto">
      <div className="w-full text-center mb-16 space-y-6">
        <header className="space-y-4">
          <div className="flex items-center justify-center gap-2 px-3 py-1 bg-primary-container/10 border border-primary-container/20 rounded-full w-fit mx-auto text-primary-container font-sans text-xs font-bold uppercase tracking-widest">
            <Sparkles size={14} fill="currentColor" />
            Navigation Results Generated
          </div>
          <h1 className="font-display text-4xl md:text-5xl text-on-surface tracking-tight">Here are your paths forward.</h1>
          <p className="font-sans text-on-surface-variant max-w-2xl mx-auto">Based on your input, we've modeled three distinct trajectories. Choose the one that best aligns with your energy and available resources.</p>
        </header>

        <div className="flex gap-4 justify-center">
          <button className="flex items-center gap-2 bg-surface-container-high px-4 py-2 rounded-lg text-sm font-sans font-semibold hover:bg-surface-container-highest transition-colors">
            <MessageSquare size={16} /> Chat for Context
          </button>
          <button className="flex items-center gap-2 bg-surface-container-high px-4 py-2 rounded-lg text-sm font-sans font-semibold hover:bg-surface-container-highest transition-colors">
            <Clock size={16} /> History
          </button>
        </div>
      </div>

      {/* Vertical Timeline/List of Paths */}
      <div className="w-full max-w-4xl space-y-8">
        {paths.map((path, index) => (
          <motion.div 
            key={path.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2 }}
            onClick={() => onChoosePath(path.id)}
            className="group glass-card hover:bg-[#1A2C40]/60 p-8 rounded-2xl cursor-pointer transition-all duration-300 ring-1 ring-white/5 hover:ring-primary-container/30 relative overflow-hidden"
          >
            {/* Background number accent */}
            <span className="absolute -top-4 -right-4 font-display text-9xl font-extrabold text-white/5 pointer-events-none">{index + 1}</span>
            
            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
              <div className={`p-4 bg-${path.color}/10 rounded-2xl text-${path.color} flex-shrink-0 group-hover:scale-110 transition-transform`}>
                <path.icon size={32} />
              </div>
              
              <div className="flex-grow space-y-4">
                <div>
                  <span className={`font-sans text-xs font-bold text-${path.color} uppercase tracking-widest block mb-1`}>{path.type}</span>
                  <h3 className="font-display text-2xl md:text-3xl text-on-surface">{path.title}</h3>
                </div>
                
                <p className="font-sans text-on-surface-variant leading-relaxed md:pr-8">
                  {path.description}
                </p>
                
                <div className="flex flex-wrap gap-6 pt-4 border-t border-white/5">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Estimated Timeline</p>
                    <p className="font-sans text-sm font-bold text-on-surface">{path.metrics.time}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Risk Factor</p>
                    <p className="font-sans text-sm font-bold text-on-surface">{path.metrics.risk}</p>
                  </div>
                </div>
              </div>
              
              <div className="md:self-center">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-primary-container group-hover:text-[#050B14] transition-all">
                  <ArrowRight />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-20 py-8 px-6 bg-primary-container/10 border border-primary-container/20 rounded-2xl w-full max-w-4xl flex items-center justify-between gap-6 overflow-hidden relative">
        <div className="absolute right-0 top-0 opacity-10">
          <Sparkles size={120} fill="currentColor" />
        </div>
        <div className="flex-grow relative z-10">
          <h4 className="font-display text-xl text-primary-container mb-1">Not quite satisfied?</h4>
          <p className="font-sans text-sm text-on-surface-variant">We can re-model your paths based on updated context.</p>
        </div>
        <button className="relative z-10 px-6 py-3 bg-primary-container text-on-primary-container font-display font-bold rounded-lg hover:scale-105 active:scale-95 transition-all text-sm whitespace-nowrap">
          Adjust Input
        </button>
      </div>

      {/* Atmospheric Atmosphere Layer */}
      <div className="fixed top-0 inset-x-0 h-64 bg-gradient-to-b from-primary-container/5 to-transparent pointer-events-none"></div>
    </main>
  );
}
