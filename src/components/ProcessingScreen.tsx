import { Sparkles, Circle, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';

export function ProcessingScreen({ onCancel }: { onCancel?: () => void }) {
  const [textIndex, setTextIndex] = useState(0);
  const loadingTexts = [
    'Reading your situation...',
    'Mapping your options...',
    'Preparing your paths...'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % loadingTexts.length);
    }, 3000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="bg-[#050B14] min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary-container opacity-[0.03] blur-[120px] rounded-full"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-primary-container opacity-[0.05] blur-[150px] rounded-full"></div>
      </div>

      <main className="relative z-10 w-full max-w-xl flex flex-col items-center">
        {/* Logo */}
        <div className="mb-16">
          <span className="font-display text-2xl text-primary-container tracking-tighter font-extrabold">whatnextai</span>
        </div>

        {/* Processing Visualizer */}
        <div className="relative w-full aspect-video mb-12 flex items-center justify-center">
          <motion.div 
            animate={{ scale: [1, 1.1, 1] }} 
            transition={{ repeat: Infinity, duration: 4 }}
            className="absolute w-64 h-64 bg-surface-container rounded-full opacity-20 blur-3xl"
          />
          
          <div className="relative z-20 w-32 h-32 flex items-center justify-center">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
              className="absolute inset-0 border-2 border-primary-container/20 border-t-primary-container rounded-full"
            />
            <div className="w-16 h-16 bg-[#1A2C40] rounded-full flex items-center justify-center border border-primary-container/30 shadow-[0_0_20px_5px_rgba(244,162,97,0.15)]">
              <Sparkles className="text-primary-container" size={32} fill="currentColor" />
            </div>
          </div>

          {/* Floating Data Nodes */}
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="absolute top-1/4 left-1/4 flex gap-2 items-center bg-[#1A2C40]/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5"
          >
            <Circle className="text-primary-container" size={12} fill="currentColor" />
            <span className="text-xs font-sans font-semibold text-slate-400">Contextual Data</span>
          </motion.div>
          
          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="absolute bottom-1/4 right-1/4 flex gap-2 items-center bg-[#1A2C40]/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5"
          >
            <TrendingUp className="text-primary-container" size={12} />
            <span className="text-xs font-sans font-semibold text-slate-400">Path Modeling</span>
          </motion.div>
        </div>

        {/* Status Messaging */}
        <div className="text-center space-y-6 w-full">
          <div className="h-8 overflow-hidden relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={textIndex}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="font-display text-2xl text-on-surface"
              >
                {loadingTexts[textIndex]}
              </motion.div>
            </AnimatePresence>
          </div>
          
          <p className="text-sans text-slate-400 max-w-xs mx-auto">
            Our AI is synthesizing multiple future scenarios based on your current inputs.
          </p>

          {/* Progress Track */}
          <div className="w-full max-w-sm mx-auto space-y-2">
            <div className="h-1 w-full bg-surface-container-highest rounded-full overflow-hidden relative">
              <motion.div 
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-container to-transparent w-full"
              />
            </div>
            <div className="flex justify-between px-1">
              <span className="text-[10px] font-sans font-semibold text-slate-500 uppercase tracking-widest">Processing Analysis</span>
              <span className="text-[10px] font-sans font-semibold text-primary-container uppercase tracking-widest">Step 2 of 3</span>
            </div>
          </div>
        </div>

        {/* Decorative Grid */}
        <div className="mt-24 w-full grid grid-cols-3 gap-4 opacity-40 grayscale group hover:grayscale-0 transition-all duration-700">
          <div className="aspect-square bg-surface-container rounded-xl overflow-hidden border border-white/5">
            <img className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=1974" alt="Neural" />
          </div>
          <div className="aspect-square bg-surface-container rounded-xl overflow-hidden border border-white/5 mt-4">
            <img className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=2070" alt="Prism" />
          </div>
          <div className="aspect-square bg-surface-container rounded-xl overflow-hidden border border-white/5">
            <img className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=2070" alt="Trails" />
          </div>
        </div>
      </main>

      {/* Cancel Button */}
      {onCancel ? (
        <div className="fixed bottom-12 z-20">
          <button
            onClick={onCancel}
            className="bg-[#1A2C40]/50 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 text-slate-500 text-sm hover:text-slate-300 transition-colors active:scale-95"
          >
            Cancel
          </button>
        </div>
      ) : null}
    </div>
  );
}
