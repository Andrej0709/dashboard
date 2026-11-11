import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { House, ListChecks, CalendarDays, Repeat, Wallet, CloudSun, Bookmark } from 'lucide-react';

export const RAIL = [
  { id: 'home', label: 'Home', Icon: House },
  { id: 'tasks', label: 'Tasks', Icon: ListChecks },
  { id: 'calendar', label: 'Calendar', Icon: CalendarDays },
  { id: 'habits', label: 'Habits', Icon: Repeat },
  { id: 'finance', label: 'Finance', Icon: Wallet },
  { id: 'weather', label: 'Weather', Icon: CloudSun },
  { id: 'saved', label: 'Saved', Icon: Bookmark },
];

/** Phone navigation: the same sections as the side rail, docked to the bottom edge. */
export function BottomNav({ page, go }) {
  return (
    <nav
      aria-label="Sections"
      className="absolute inset-x-0 bottom-0 z-30 flex justify-center px-3"
      style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}
    >
      <div className="glass flex w-full max-w-[420px] justify-between rounded-full p-[6px]" style={{ '--glass-tint': 0.56 }}>
        {RAIL.map(({ id, label, Icon }) => {
          const active = page === id;
          return (
            <button
              key={id}
              type="button"
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              onClick={() => go(id)}
              className={`relative grid size-11 place-items-center rounded-full transition-colors ${active ? 'text-neutral-900' : 'text-white/75'}`}
            >
              {active && (
                <motion.span
                  layoutId="bottom-active"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  className="absolute inset-0 rounded-full bg-white shadow-[0_6px_18px_-4px_rgba(0,0,0,0.55)]"
                />
              )}
              <motion.span className="relative grid place-items-center" whileTap={{ scale: 0.82 }}>
                <Icon size={19} strokeWidth={active ? 2.2 : 1.9} />
              </motion.span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default function Sidebar({ page, go, hidden }) {
  const [hover, setHover] = useState(null);
  return (
    <div className="pointer-events-none fixed inset-y-0 z-30 flex items-center" style={{ left: 'var(--rail-left)' }}>
      <AnimatePresence>
        {!hidden && (
          <motion.nav
            aria-label="Sections"
            initial={{ opacity: 0, x: -28, filter: 'blur(8px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: -28, filter: 'blur(8px)' }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            className="glass pointer-events-auto flex flex-col gap-2.5 rounded-full p-[7px]"
            style={{ '--glass-tint': 0.52 }}
          >
            {RAIL.map(({ id, label, Icon }) => {
              const active = page === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-label={label}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => go(id)}
                  onPointerEnter={() => setHover(id)}
                  onPointerLeave={() => setHover((h) => (h === id ? null : h))}
                  className={`relative grid size-9 place-items-center rounded-full transition-colors ${
                    active ? 'text-neutral-900' : 'bg-white/[0.07] text-white/80 hover:bg-white/[0.15] hover:text-white'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="rail-active"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      className="absolute inset-0 rounded-full bg-white shadow-[0_6px_18px_-4px_rgba(0,0,0,0.55)]"
                    />
                  )}
                  <motion.span className="relative grid place-items-center" whileTap={{ scale: 0.82 }}>
                    <Icon size={16} strokeWidth={active ? 2.2 : 1.9} />
                  </motion.span>
                  <AnimatePresence>
                    {hover === id && (
                      <motion.span
                        initial={{ opacity: 0, x: -6, scale: 0.92 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -4, scale: 0.95, transition: { duration: 0.1 } }}
                        transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                        className="glass-dark pointer-events-none absolute left-[46px] whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium text-white"
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              );
            })}
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
}
