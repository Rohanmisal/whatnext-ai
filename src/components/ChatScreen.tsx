import { Send, User, MessageSquare, Info, Sparkles, Plus, Image as ImageIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

export function ChatScreen() {
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      role: 'assistant', 
      text: "I've analyzed your financial situation. Considering your mortgage and current investment portfolio, we should discuss the 'Stability First' path.", 
      time: '11:24 AM' 
    },
    { 
      id: 2, 
      role: 'user', 
      text: "How much of an emergency fund should I keep before moving to that path?", 
      time: '11:25 AM' 
    }
  ]);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (!input) return;
    setMessages([...messages, { id: Date.now(), role: 'user', text: input, time: '11:26 AM' }]);
    setInput('');
  };

  return (
    <main className="min-h-screen pt-24 pb-20 px-4 flex flex-col md:flex-row max-w-7xl mx-auto gap-8 overflow-hidden">
      {/* Sidebar - Context Panel */}
      <aside className="hidden lg:flex w-80 flex-col gap-6 flex-shrink-0">
        <div className="glass-card p-6 rounded-2xl border-l-4 border-l-primary-container">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display font-bold text-lg">Financial Navigator</h3>
            <Info size={16} className="text-slate-500" />
          </div>
          <p className="text-sm font-sans text-on-surface-variant leading-relaxed">
            Active session focused on personal wealth and debt optimization. Current context is high-priority.
          </p>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <h4 className="font-display text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">Referenced Goals</h4>
          <ul className="space-y-4">
            <li className="flex gap-3 items-center text-sm font-sans text-on-surface">
              <div className="w-2 h-2 rounded-full bg-primary-container"></div>
              Purchase home in 24 months
            </li>
            <li className="flex gap-3 items-center text-sm font-sans text-on-surface">
              <div className="w-2 h-2 rounded-full bg-secondary"></div>
              Reduce high-interest debt
            </li>
            <li className="flex gap-3 items-center text-sm font-sans text-slate-400">
              <div className="w-2 h-2 rounded-full bg-white/10"></div>
              Annual retirement cap
            </li>
          </ul>
        </div>
      </aside>

      {/* Main Chat Interface */}
      <div className="flex-grow flex flex-col h-[calc(100vh-160px)] md:h-[calc(100vh-140px)] glass-card rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/5 relative">
        {/* Chat Header */}
        <header className="p-4 md:p-6 border-b border-white/5 flex items-center justify-between bg-[#1A2C40]/50 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-container/10 border border-primary-container/20 rounded-xl text-primary-container">
              <Sparkles size={20} fill="currentColor" />
            </div>
            <div>
              <h2 className="font-display font-bold md:text-lg">Financial AI Navigator</h2>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse"></span>
                <span className="text-[10px] text-slate-500 font-sans tracking-widest uppercase font-bold text-secondary">Active Logic Engine</span>
              </div>
            </div>
          </div>
          <button className="text-slate-500 hover:text-white transition-colors bg-white/5 p-2 rounded-lg">
            <Plus size={20} />
          </button>
        </header>

        {/* Messages Feed */}
        <div className="flex-grow overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth custom-scrollbar">
          {messages.map((msg) => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${msg.role === 'user' ? 'bg-secondary/10 border border-secondary/20 text-secondary' : 'bg-primary-container/10 border border-primary-container/20 text-primary-container'}`}>
                {msg.role === 'user' ? <User size={20} /> : <MessageSquare size={20} />}
              </div>
              <div className={`max-w-[85%] md:max-w-[70%] space-y-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                <div className={`p-4 rounded-2xl font-sans text-sm md:text-base leading-relaxed ${msg.role === 'user' ? 'bg-[#1A2C40] border border-white/5 text-on-surface rounded-tr-none' : 'bg-surface-container-high text-on-surface-variant rounded-tl-none'}`}>
                  {msg.text}
                </div>
                <span className="text-[10px] text-slate-600 font-semibold font-sans">{msg.time}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-[#050B14]/50 backdrop-blur-sm border-t border-white/5">
          <div className="max-w-4xl mx-auto flex gap-4 items-center">
            <button className="text-slate-500 hover:text-white transition-colors p-2 hidden sm:block">
              <Plus size={24} />
            </button>
            <div className="relative flex-grow flex items-center">
               <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask your navigator something..." 
                className="w-full bg-[#1A2C40] border border-white/10 rounded-2xl py-4 pl-6 pr-24 font-sans text-on-surface focus:ring-1 focus:ring-primary-container focus:outline-none transition-all"
              />
              <div className="absolute right-2 flex gap-1">
                <button className="text-slate-500 hover:text-slate-300 transition-colors p-3">
                  <ImageIcon size={20} />
                </button>
                <button 
                  onClick={sendMessage}
                  className="bg-primary-container text-[#050B14] p-3 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
          <p className="text-center text-[10px] text-slate-600 mt-4 font-sans uppercase tracking-[0.2em]">Contextual Navigation Active</p>
        </div>
      </div>
    </main>
  );
}
