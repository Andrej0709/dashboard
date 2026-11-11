import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  House, ListChecks, Wallet, Settings as SettingsIcon, ListFilter, CalendarDays, SquarePen, Bell, Search,
  CornerDownLeft, CircleCheck, Clock, ArrowUpRight, Bookmark,
} from 'lucide-react';
import { IconButton, Modal } from './ui';
import { RAIL } from './Sidebar';
import { useStore } from '../store';
import { useSync } from '../lib/sync';
import { fmtTime, relDay, todayKey } from '../lib/date';
import { initials } from '../lib/format';

// dot on the profile button: green synced, amber working, red offline/failed, grey signed out
const SYNC_DOT = {
  off: 'bg-emerald-400',
  synced: 'bg-emerald-400',
  syncing: 'bg-amber-400',
  offline: 'bg-rose-400',
  error: 'bg-rose-400',
  'signed-out': 'bg-white/50',
};

const PILLS = [
  { id: 'home', label: 'Home', Icon: House },
  { id: 'tasks', label: 'Tasks', Icon: ListChecks },
  { id: 'finance', label: 'Finance', Icon: Wallet },
  { id: 'settings', label: 'Settings', Icon: SettingsIcon },
];

function Popover({ open, onClose, children, width = 300 }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <div className="no-drag fixed inset-0 z-40" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.12 } }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="glass no-drag absolute right-0 top-[46px] z-50 origin-top-right p-3.5"
            style={{ width, '--glass-tint': 0.62, '--glass-blur': '32px' }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function QuickAdd({ open, onClose }) {
  const addTask = useStore((s) => s.addTask);
  const [title, setTitle] = useState('');
  const [added, setAdded] = useState(0);
  useEffect(() => {
    if (open) {
      setTitle('');
      setAdded(0);
    }
  }, [open]);
  const submit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    addTask({ title, due: todayKey() });
    setTitle('');
    setAdded((n) => n + 1);
  };
  return (
    <Popover open={open} onClose={onClose}>
      <p className="text-[13px] font-semibold text-white">Quick task</p>
      <p className="mb-3 mt-0.5 text-[11px] text-white/50">Lands in today's list. Press Enter to add.</p>
      <form onSubmit={submit} className="flex items-center gap-2">
        <input autoFocus className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs doing?" />
        <button type="submit" aria-label="Add task" className="btn-primary grid size-9 shrink-0 place-items-center rounded-full text-white">
          <CornerDownLeft size={15} />
        </button>
      </form>
      {added > 0 && <p className="mt-2.5 text-[11px] text-emerald-300">Added {added} {added === 1 ? 'task' : 'tasks'} for today.</p>}
    </Popover>
  );
}

function Notifications({ open, onClose, due, upcoming, go }) {
  const toggleTask = useStore((s) => s.toggleTask);
  const today = todayKey();
  return (
    <Popover open={open} onClose={onClose} width={320}>
      <p className="text-[13px] font-semibold text-white">Needs attention</p>
      <p className="mb-3 mt-0.5 text-[11px] text-white/50">
        {due.length ? `${due.length} ${due.length === 1 ? 'task is' : 'tasks are'} due or overdue` : 'Nothing is due right now'}
      </p>
      <div className="thin-scrollbar -mr-1.5 grid max-h-[300px] gap-1.5 overflow-y-auto pr-1.5">
        {due.map((t) => (
          <div key={t.id} className="tile flex items-center gap-2.5 px-2.5 py-2">
            <button type="button" aria-label={`Complete ${t.title}`} onClick={() => toggleTask(t.id)} className="text-white/55 hover:text-emerald-300">
              <CircleCheck size={17} />
            </button>
            <button type="button" className="min-w-0 flex-1 text-left" onClick={() => { go('tasks'); onClose(); }}>
              <span className="block truncate text-[12px] font-medium text-white">{t.title}</span>
              <span className={`text-[10px] ${t.due < today ? 'text-rose-300' : 'text-white/50'}`}>
                {t.due < today ? `Overdue · ${relDay(t.due)}` : 'Due today'}
              </span>
            </button>
          </div>
        ))}
        {upcoming.map((e) => (
          <button key={e.id} type="button" className="tile tile-hover flex items-center gap-2.5 px-2.5 py-2 text-left" onClick={() => { go('calendar'); onClose(); }}>
            <Clock size={16} className="shrink-0 text-blue-300" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12px] font-medium text-white">{e.title}</span>
              <span className="text-[10px] text-white/50">Today · {e.start} – {e.end}</span>
            </span>
          </button>
        ))}
        {!due.length && !upcoming.length && <p className="py-5 text-center text-[12px] text-white/45">You're all caught up.</p>}
      </div>
    </Popover>
  );
}

function SearchPalette({ open, onClose, go }) {
  const tasks = useStore((s) => s.tasks);
  const events = useStore((s) => s.events);
  const links = useStore((s) => s.links);
  const [q, setQ] = useState('');
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (open) {
      setQ('');
      setIndex(0);
    }
  }, [open]);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    const hit = (text) => !s || text.toLowerCase().includes(s);
    const pages = [...RAIL, { id: 'settings', label: 'Settings', Icon: SettingsIcon }]
      .filter((p) => hit(p.label))
      .map((p) => ({ key: `p-${p.id}`, Icon: p.Icon, title: p.label, sub: 'Go to page', run: () => go(p.id) }));
    if (!s) return pages;
    const t = tasks.filter((x) => hit(x.title)).slice(0, 5)
      .map((x) => ({ key: `t-${x.id}`, Icon: CircleCheck, title: x.title, sub: x.done ? 'Task · done' : `Task${x.due ? ` · ${relDay(x.due)}` : ''}`, run: () => go('tasks') }));
    const e = events.filter((x) => hit(x.title)).slice(0, 4)
      .map((x) => ({ key: `e-${x.id}`, Icon: CalendarDays, title: x.title, sub: `Event · ${relDay(x.date)} ${x.start}`, run: () => go('calendar') }));
    const l = links.filter((x) => hit(x.title) || hit(x.url)).slice(0, 4)
      .map((x) => ({ key: `l-${x.id}`, Icon: Bookmark, title: x.title, sub: 'Saved link · opens in browser', run: () => window.open(x.url, '_blank', 'noopener') }));
    return [...pages, ...t, ...e, ...l].slice(0, 9);
  }, [q, tasks, events, links, go]);

  const pick = (r) => {
    if (!r) return;
    r.run();
    onClose();
  };
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIndex((i) => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setIndex((i) => Math.max(i - 1, 0)); }
    if (e.key === 'Enter') { e.preventDefault(); pick(results[index]); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Search" subtitle="Pages, tasks, events and saved links" width={480}>
      <div className="relative">
        <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/45" />
        <input
          autoFocus className="field" style={{ paddingLeft: 36 }} value={q} placeholder="Type to search…"
          onChange={(e) => { setQ(e.target.value); setIndex(0); }} onKeyDown={onKey}
        />
      </div>
      <div className="thin-scrollbar mt-3 grid max-h-[320px] gap-1 overflow-y-auto">
        {results.map((r, i) => (
          <button
            key={r.key} type="button" onClick={() => pick(r)} onPointerEnter={() => setIndex(i)}
            className={`flex items-center gap-3 rounded-[14px] px-3 py-2 text-left transition-colors ${i === index ? 'bg-white/[0.12]' : ''}`}
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/[0.08] text-white/80"><r.Icon size={15} /></span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-white">{r.title}</span>
              <span className="block truncate text-[11px] text-white/45">{r.sub}</span>
            </span>
            {i === index && <ArrowUpRight size={14} className="text-white/50" />}
          </button>
        ))}
        {!results.length && <p className="py-6 text-center text-[12px] text-white/45">No matches for “{q}”.</p>}
      </div>
    </Modal>
  );
}

export default function TopBar({ page, go, top, mobile, railHidden, toggleRail }) {
  const name = useStore((s) => s.settings.name);
  const syncStatus = useSync((s) => s.status);
  const tasks = useStore((s) => s.tasks);
  const events = useStore((s) => s.events);
  const [panel, setPanel] = useState(null); // 'quick' | 'bell' | 'search'
  const close = useRef(() => setPanel(null)).current;

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPanel((p) => (p === 'search' ? null : 'search'));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const today = todayKey();
  const nowTime = fmtTime(new Date());
  const due = useMemo(
    () => tasks.filter((t) => !t.done && t.due && t.due <= today).sort((a, b) => a.due.localeCompare(b.due)),
    [tasks, today],
  );
  const upcoming = events.filter((e) => e.date === today && e.start > nowTime).sort((a, b) => a.start.localeCompare(b.start));

  return (
    <header
      className="drag fixed inset-x-0 top-0 z-40 flex items-start justify-between"
      style={{
        paddingTop: `calc(var(--safe-top) + ${top}px)`,
        paddingLeft: 'var(--rail-left)',
        paddingRight: 'var(--edge-right)',
        height: `calc(var(--safe-top) + ${top + 52}px)`,
      }}
    >
      {mobile ? (
        <motion.button
          type="button" onClick={() => go('calendar')} initial={{ y: -80 }} animate={{ y: 0 }}
          transition={{ delay: 0.05, type: 'spring', stiffness: 260, damping: 26 }}
          className="flex h-10 items-center gap-2 text-[13px] font-medium text-white/90 drop-shadow-[0_1px_8px_rgba(0,0,0,0.45)]"
        >
          <CalendarDays size={16} />
          {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
        </motion.button>
      ) : (
        <motion.div className="flex gap-2.5" initial={{ y: -80 }} animate={{ y: 0 }} transition={{ delay: 0.05, type: 'spring', stiffness: 260, damping: 26 }}>
          <IconButton icon={ListFilter} label={railHidden ? 'Show side rail' : 'Hide side rail'} onClick={toggleRail} />
          <IconButton icon={CalendarDays} label="Calendar" onClick={() => go('calendar')} />
        </motion.div>
      )}

      <nav aria-label="Main" className="absolute left-1/2 flex -translate-x-1/2 gap-2 max-md:hidden">
        {PILLS.map(({ id, label, Icon }, i) => {
          const active = page === id;
          return (
            <motion.button
              key={id}
              type="button"
              aria-current={active ? 'page' : undefined}
              onClick={() => go(id)}
              initial={{ opacity: 0, y: -14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + i * 0.04, type: 'spring', stiffness: 300, damping: 26 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="glass no-drag flex h-[38px] items-center gap-2 rounded-full px-4 text-[13px] font-medium text-white/90 hover:text-white"
            >
              {active && (
                <motion.span
                  layoutId="pill-active"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  className="absolute inset-0 rounded-full bg-[rgba(16,13,11,0.82)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                  style={{ zIndex: 1 }}
                />
              )}
              <Icon size={15} strokeWidth={1.9} />
              <span>{label}</span>
            </motion.button>
          );
        })}
      </nav>

      <motion.div className="relative flex items-center gap-2.5 max-md:gap-2" initial={{ y: -80 }} animate={{ y: 0 }} transition={{ delay: 0.12, type: 'spring', stiffness: 260, damping: 26 }}>
        <IconButton icon={SquarePen} label="Quick task" onClick={() => setPanel(panel === 'quick' ? null : 'quick')} />
        <IconButton icon={Bell} label="Needs attention" badge={due.length} onClick={() => setPanel(panel === 'bell' ? null : 'bell')} />
        <IconButton icon={Search} label={mobile ? 'Search' : 'Search (Ctrl+K)'} onClick={() => setPanel('search')} />
        <motion.button
          type="button"
          aria-label="Profile and settings"
          title="Profile and settings"
          onClick={() => go('settings')}
          whileHover={{ scale: 1.07 }}
          whileTap={{ scale: 0.94 }}
          className="no-drag relative ml-1 grid size-10 place-items-center rounded-full text-[13px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_8px_20px_-6px_rgba(249,115,22,0.7)]"
          style={{ background: 'linear-gradient(145deg, #fbbf24 0%, #f97316 100%)' }}
        >
          {initials(name)}
          <span className={`absolute bottom-0 right-0 size-[11px] rounded-full shadow-[0_0_0_2px_rgba(40,33,28,0.95)] ${SYNC_DOT[syncStatus]}`} />
        </motion.button>
        <QuickAdd open={panel === 'quick'} onClose={close} />
        <Notifications open={panel === 'bell'} onClose={close} due={due} upcoming={upcoming} go={go} />
      </motion.div>

      <SearchPalette open={panel === 'search'} onClose={close} go={go} />
    </header>
  );
}
