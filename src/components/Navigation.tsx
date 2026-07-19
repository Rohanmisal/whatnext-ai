import { Bell, Compass, Route, Bookmark, MessageSquare, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';

export function Header({
  activeTab,
  onTabChange,
  onProfileClick,
  profileInitial = 'R',
}: {
  activeTab: string
  onTabChange: (tab: string) => void
  onProfileClick?: () => void
  profileInitial?: string
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const tabs = ['Home', 'Pricing', 'My Paths', 'Explore', 'History'];

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    setMobileOpen(false);
  };

  return (
    <header className="bg-background/80 backdrop-blur-md border-b border-white/10 fixed top-0 w-full z-50">
      <div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => handleTabChange('Home')}
        >
          <span className="text-xl font-bold text-primary-container tracking-tighter font-display">
            whatnextai
          </span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8 font-display tracking-tight">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`transition-colors relative pb-1 ${
                activeTab === tab
                  ? 'text-primary-container'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-container"
                />
              )}
            </button>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Bell — desktop only */}
          <button
            title="Notifications"
            aria-label="Notifications"
            className="hidden md:flex text-slate-400 hover:bg-white/5 transition-all duration-300 p-2 rounded-full active:scale-95"
          >
            <Bell size={20} />
          </button>

          {/* Profile avatar — desktop only */}
          <button
            type="button"
            title="Profile"
            aria-label="Open profile"
            onClick={onProfileClick}
            className="hidden md:flex w-[34px] h-[34px] rounded-full bg-gradient-to-br from-primary-container to-primary items-center justify-center text-[13px] font-semibold text-on-primary border-2 border-primary/30 hover:opacity-90 transition-all active:scale-95 font-display"
          >
            {profileInitial}
          </button>

          {/* Hamburger — mobile only */}
          <button
            type="button"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-on-surface hover:bg-white/5 transition-all active:scale-95"
          >
            <AnimatePresence mode="wait" initial={false}>
              {mobileOpen ? (
                <motion.span
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <X size={22} />
                </motion.span>
              ) : (
                <motion.span
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <Menu size={22} />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden border-t border-white/[0.08] bg-background/95 backdrop-blur-xl"
          >
            <nav className="flex flex-col px-4 py-3 gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={[
                    'text-left px-4 py-3 rounded-xl text-sm font-medium font-display tracking-tight transition-colors',
                    activeTab === tab
                      ? 'text-primary-container bg-primary-container/10'
                      : 'text-slate-400 hover:text-on-surface hover:bg-white/5',
                  ].join(' ')}
                >
                  {tab}
                </button>
              ))}
            </nav>

            {/* Divider + profile row */}
            <div className="border-t border-white/[0.06] px-4 py-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  onProfileClick?.();
                  setMobileOpen(false);
                }}
                className="flex items-center gap-3 text-sm text-slate-400 hover:text-on-surface transition-colors"
              >
                <span className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-container to-primary flex items-center justify-center text-[13px] font-semibold text-on-primary border-2 border-primary/30 font-display">
                  {profileInitial}
                </span>
                My Profile
              </button>
              <button
                title="Notifications"
                aria-label="Notifications"
                className="p-2 rounded-full text-slate-400 hover:bg-white/5 transition-all"
              >
                <Bell size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export function Footer() {
  const links = ['Privacy', 'Terms', 'Support', 'Twitter'];

  return (
    <footer className="bg-background border-t border-white/[0.06] py-7">
      <div className="flex flex-col md:flex-row justify-between items-center px-8 max-w-7xl mx-auto gap-4 font-display text-sm">
        <div className="flex flex-col md:flex-row items-center gap-3 md:gap-6 text-center md:text-left">
          <span className="text-primary-container font-bold text-base tracking-tight">
            whatnextai
          </span>
          <p className="text-slate-500 text-[13px]">© 2026 whatnextai. Calmly navigating your future.</p>
        </div>
        <div className="flex gap-6">
          {links.map((link) => (
            <a
              key={link}
              className="text-slate-500 hover:text-slate-300 transition-colors text-[13px]"
              href="#"
            >
              {link}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

export function MobileNav({
  activeTab,
  onTabChange,
}: {
  activeTab: string
  onTabChange: (tab: string) => void
}) {
  const items = [
    { id: 'Explore', icon: Compass, label: 'Guide' },
    { id: 'Paths', icon: Route, label: 'Paths' },
    { id: 'Saved', icon: Bookmark, label: 'Saved' },
    { id: 'Chat', icon: MessageSquare, label: 'Chat' },
  ];

  return (
    <nav className="md:hidden bg-[#1A2C40]/90 backdrop-blur-lg fixed bottom-0 w-full z-50 rounded-t-2xl border-t border-white/5 shadow-[0_-10px_30px_rgba(5,11,20,0.8)] flex justify-around items-center px-4 py-3 pb-safe-area">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onTabChange(item.id)}
          className={`flex flex-col items-center justify-center transition-all active:scale-90 px-4 py-1 rounded-xl ${
            activeTab === item.id
              ? 'text-primary-container bg-primary-container/10'
              : 'text-slate-500'
          }`}
        >
          <item.icon size={20} />
          <span className="font-display text-[10px] font-medium mt-1">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
