import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Search, Check, Star, Trash2, Eye, EyeOff, ArrowUp, Plus, ListChecks, CalendarDays, Flag, RotateCcw, Inbox } from 'lucide-react';
import { Avatar, Button, Chip, Empty, Field, Glass, IconButton, PageHeader, Ring, Segmented, stagger } from '../components/ui';
import { useStore } from '../store';
import { addDays, keyOf, relDay, todayKey } from '../lib/date';
import { pct } from '../lib/format';

const PRIORITY = { high: { label: 'High', color: 'rose' }, med: { label: 'Medium', color: 'amber' }, low: { label: 'Low', color: 'blue' } };

function CheckCircle({ done, onClick, label }) {
  return (
    <button
      type="button" aria-label={label} aria-pressed={done} onClick={onClick}
      className={`grid size-[22px] shrink-0 place-items-center rounded-full border transition-colors ${
        done ? 'border-emerald-400 bg-emerald-400 text-emerald-950' : 'border-white/35 text-transparent hover:border-emerald-300 hover:text-emerald-300'
      }`}
    >
      <Check size={13} strokeWidth={3} />
    </button>
  );
}

export default function Tasks() {
  const tasks = useStore((s) => s.tasks);
  const lists = useStore((s) => s.lists);
  const { addTask, toggleTask, updateTask, deleteTask, clearCompleted, addList } = useStore.getState();

  const [listId, setListId] = useState('all');
  const [scope, setScope] = useState('all'); // all | today
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);
  const detailsRef = useRef(null);
  // on a phone the details card sits below the list, so bring it into view
  const select = (id) => {
    setSelected(id);
    if (window.matchMedia('(max-width: 767px)').matches) {
      setTimeout(() => detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    }
  };
  const [showDone, setShowDone] = useState(false);
  const [draft, setDraft] = useState('');
  const [quick, setQuick] = useState({ due: null, high: false });
  const [newList, setNewList] = useState(null);

  const today = todayKey();
  const tomorrow = keyOf(addDays(new Date(), 1));
  const rows = [{ id: 'all', name: 'All tasks', color: 'green', icon: Inbox }, ...lists];
  const current = rows.find((r) => r.id === listId) ?? rows[0];
  const inList = (t, id) => id === 'all' || t.list === id;

  const visible = useMemo(() => {
    const s = q.trim().toLowerCase();
    const rank = { high: 0, med: 1, low: 2 };
    return tasks
      .filter((t) => inList(t, current.id))
      .filter((t) => scope === 'all' || (t.due && t.due <= today))
      .filter((t) => !s || t.title.toLowerCase().includes(s))
      .sort((a, b) => (a.due ?? '9999').localeCompare(b.due ?? '9999') || rank[a.priority] - rank[b.priority]);
  }, [tasks, current.id, scope, q, today]);

  const open = visible.filter((t) => !t.done);
  const done = visible.filter((t) => t.done).sort((a, b) => (b.doneAt ?? '').localeCompare(a.doneAt ?? ''));
  const task = tasks.find((t) => t.id === selected) ?? null;
  const listOf = (id) => lists.find((l) => l.id === id);

  const submit = (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    addTask({ title: draft, due: quick.due, priority: quick.high ? 'high' : 'med', list: current.id === 'all' ? lists[0].id : current.id });
    setDraft('');
  };

  const submitList = (e) => {
    e.preventDefault();
    if (newList?.trim()) addList(newList);
    setNewList(null);
  };

  const all = tasks.filter((t) => inList(t, current.id));
  const allDone = all.filter((t) => t.done).length;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" exit="exit">
      <PageHeader title="Tasks" subtitle="Everything on your plate, list by list">
        <Button icon={Plus} onClick={() => setNewList('')}>New list</Button>
      </PageHeader>

      <div className="m-stack grid grid-cols-[272px_minmax(0,1fr)_272px] gap-[18px] md:h-[max(520px,calc(100vh-210px))]">
        {/* ---- lists ---- */}
        <Glass className="flex min-h-0 flex-col p-4 max-md:max-h-[300px]">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/45" />
            <input className="field" style={{ paddingLeft: 34 }} placeholder="Search tasks…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Segmented className="mt-3 w-full" glass={false} options={[{ value: 'all', label: 'All' }, { value: 'today', label: 'Today' }]} value={scope} onChange={setScope} />
          <div className="no-scrollbar -mx-1.5 mt-3 min-h-0 flex-1 overflow-y-auto px-1.5">
            {rows.map((l) => {
              const mine = tasks.filter((t) => inList(t, l.id) && !t.done);
              const next = mine.slice().sort((a, b) => (a.due ?? '9999').localeCompare(b.due ?? '9999'))[0];
              const active = l.id === current.id;
              return (
                <button
                  key={l.id} type="button" onClick={() => { setListId(l.id); setSelected(null); }}
                  className={`mb-1 flex w-full items-center gap-3 rounded-[16px] px-2.5 py-2.5 text-left transition-colors ${active ? 'bg-white/[0.12] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]' : 'hover:bg-white/[0.06]'}`}
                >
                  <Avatar name={l.name} color={l.color} icon={l.icon} size={36} status={mine.length ? 'on' : 'off'} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-white">{l.name}</span>
                    <span className="block truncate text-[11px] text-white/45">{next ? next.title : 'Nothing open'}</span>
                  </span>
                  {mine.length > 0 && (
                    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-blue-500 px-1.5 text-[10px] font-semibold text-white">{mine.length}</span>
                  )}
                </button>
              );
            })}
            {newList !== null && (
              <form onSubmit={submitList} className="mt-1 flex gap-2">
                <input autoFocus className="field" placeholder="List name" value={newList} onChange={(e) => setNewList(e.target.value)} onBlur={submitList} />
              </form>
            )}
          </div>
        </Glass>

        {/* ---- tasks ---- */}
        <Glass className="flex min-h-0 flex-col p-4 max-md:h-[70dvh]">
          <div className="flex items-center gap-3 border-b border-white/10 pb-3.5">
            <Avatar name={current.name} color={current.color} icon={current.icon} size={38} status="on" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold text-white">{current.name}</p>
              <p className="text-[11px] text-white/45">{open.length} open · {done.length} done</p>
            </div>
            <IconButton icon={showDone ? EyeOff : Eye} label={showDone ? 'Hide completed' : 'Show completed'} size={32} plain onClick={() => setShowDone((v) => !v)} />
            <IconButton icon={Trash2} label="Delete completed tasks" size={32} plain onClick={() => clearCompleted(current.id)} />
          </div>

          <div className="no-scrollbar -mx-1 min-h-0 flex-1 overflow-y-auto px-1 py-3">
            {!open.length && !done.length && (
              <Empty icon={ListChecks} title={q ? 'No matching tasks' : 'No tasks here yet'} hint="Type below and press Enter to add your first one." />
            )}
            {!open.length && done.length > 0 && <Empty icon={Check} title="All done" hint="Everything in this list is finished." />}
            <AnimatePresence initial={false}>
              {[...open, ...(showDone ? done : [])].map((t) => {
                const l = listOf(t.list);
                const late = !t.done && t.due && t.due < today;
                return (
                  <motion.div
                    key={t.id} layout
                    initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: 24, transition: { duration: 0.15 } }}
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    onClick={() => select(t.id)}
                    className={`tile tile-hover mb-2 flex cursor-pointer items-center gap-3 px-3 py-2.5 ${selected === t.id ? '!border-blue-400/50 !bg-blue-500/[0.14]' : ''}`}
                  >
                    <CheckCircle done={t.done} label={`${t.done ? 'Reopen' : 'Complete'} ${t.title}`} onClick={(e) => { e.stopPropagation(); toggleTask(t.id); }} />
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-[13px] ${t.done ? 'text-white/40 line-through' : 'font-medium text-white'}`}>{t.title}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        {t.due && <Chip color={late ? 'rose' : t.due === today ? 'green' : 'blue'}><CalendarDays size={9} /> {relDay(t.due)}</Chip>}
                        {t.priority !== 'med' && <Chip color={PRIORITY[t.priority].color}><Flag size={9} /> {PRIORITY[t.priority].label}</Chip>}
                        {current.id === 'all' && l && <span className="text-[10px] text-white/40">{l.name}</span>}
                      </div>
                    </div>
                    <button
                      type="button" aria-label={t.starred ? 'Remove star' : 'Star task'} aria-pressed={t.starred}
                      onClick={(e) => { e.stopPropagation(); updateTask(t.id, { starred: !t.starred }); }}
                      className={`grid size-7 place-items-center rounded-full transition-colors hover:bg-white/10 ${t.starred ? 'text-amber-300' : 'text-white/30 hover:text-white/70'}`}
                    >
                      <Star size={15} fill={t.starred ? 'currentColor' : 'none'} />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {!showDone && done.length > 0 && (
              <button type="button" onClick={() => setShowDone(true)} className="mt-1 w-full rounded-full py-1.5 text-center text-[11px] text-white/45 hover:text-white">
                Show {done.length} completed
              </button>
            )}
          </div>

          <div className="border-t border-white/10 pt-3">
            <div className="mb-2.5 flex flex-wrap gap-2">
              {[
                { label: 'Today', on: quick.due === today, toggle: () => setQuick((v) => ({ ...v, due: v.due === today ? null : today })) },
                { label: 'Tomorrow', on: quick.due === tomorrow, toggle: () => setQuick((v) => ({ ...v, due: v.due === tomorrow ? null : tomorrow })) },
                { label: 'High priority', on: quick.high, toggle: () => setQuick((v) => ({ ...v, high: !v.high })) },
              ].map((c) => (
                <button
                  key={c.label} type="button" aria-pressed={c.on} onClick={c.toggle}
                  className={`h-7 rounded-full border px-3 text-[11px] font-medium transition-colors ${c.on ? 'border-blue-400/60 bg-blue-500/30 text-white' : 'border-white/10 bg-white/[0.06] text-white/60 hover:text-white'}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <form onSubmit={submit} className="flex items-center gap-2.5">
              <input className="field !rounded-full !px-4" placeholder={`Add a task to ${current.id === 'all' ? lists[0].name : current.name}…`} value={draft} onChange={(e) => setDraft(e.target.value)} />
              <motion.button type="submit" aria-label="Add task" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} className="btn-primary grid size-10 shrink-0 place-items-center rounded-full text-white">
                <ArrowUp size={17} strokeWidth={2.4} />
              </motion.button>
            </form>
          </div>
        </Glass>

        {/* ---- details ---- */}
        <Glass ref={detailsRef} className="flex min-h-0 flex-col p-4 max-md:scroll-mt-3">
          {/* the scroller is an inner element so the glass rim stays put */}
          <div className="no-scrollbar -m-1 flex min-h-0 flex-1 flex-col overflow-y-auto p-1">
          <p className="text-[13px] font-semibold text-white">{task ? 'Details' : 'Overview'}</p>
          {task ? (
            <div className="mt-4 flex flex-1 flex-col">
              <div className="grid place-items-center gap-2 text-center">
                <Avatar name={task.title} color={listOf(task.list)?.color ?? 'blue'} size={64} status={task.done ? 'off' : 'on'} />
                <Chip color={task.done ? 'green' : 'blue'}>{task.done ? 'Completed' : 'Open'}</Chip>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3">
                <Field label="Title">
                  <input className="field" value={task.title} onChange={(e) => updateTask(task.id, { title: e.target.value })} />
                </Field>
                <Field label="Due date">
                  <input type="date" className="field" value={task.due ?? ''} onChange={(e) => updateTask(task.id, { due: e.target.value || null })} />
                </Field>
                <div>
                  <span className="mb-1.5 block text-[11px] font-medium text-white/55">Priority</span>
                  <Segmented className="w-full" glass={false} size="sm" options={[{ value: 'low', label: 'Low' }, { value: 'med', label: 'Medium' }, { value: 'high', label: 'High' }]} value={task.priority} onChange={(priority) => updateTask(task.id, { priority })} />
                </div>
                <Field label="List">
                  <select className="field" value={task.list} onChange={(e) => updateTask(task.id, { list: e.target.value })}>
                    {lists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </Field>
                <Field label="Notes">
                  <textarea rows={3} className="field resize-none" placeholder="Anything worth remembering…" value={task.notes} onChange={(e) => updateTask(task.id, { notes: e.target.value })} />
                </Field>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button variant="soft" icon={task.done ? RotateCcw : Check} className="justify-center !px-2" onClick={() => toggleTask(task.id)}>{task.done ? 'Reopen' : 'Complete'}</Button>
                <Button variant="danger" icon={Trash2} className="justify-center !px-2" onClick={() => { deleteTask(task.id); setSelected(null); }}>Delete</Button>
              </div>
            </div>
          ) : (
            <div className="mt-6 grid place-items-center gap-3 text-center">
              <Ring value={pct(allDone, all.length)} size={112} stroke={9} color="blue" />
              <div>
                <p className="text-[14px] font-semibold text-white">{current.name}</p>
                <p className="mt-0.5 text-[11px] text-white/50">{allDone} of {all.length} tasks completed</p>
              </div>
              <div className="mt-2 grid w-full grid-cols-2 gap-2">
                {[
                  ['Due today', all.filter((t) => !t.done && t.due === today).length],
                  ['Overdue', all.filter((t) => !t.done && t.due && t.due < today).length],
                  ['Starred', all.filter((t) => t.starred && !t.done).length],
                  ['No date', all.filter((t) => !t.done && !t.due).length],
                ].map(([label, n]) => (
                  <div key={label} className="tile px-3 py-2.5 text-left">
                    <p className="text-[18px] font-semibold leading-6 text-white">{n}</p>
                    <p className="text-[10px] text-white/45">{label}</p>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] leading-4 text-white/40">Select a task to edit its date, priority, list and notes.</p>
            </div>
          )}
          </div>
        </Glass>
      </div>
    </motion.div>
  );
}
