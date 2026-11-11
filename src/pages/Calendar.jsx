import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Plus, Trash2, MapPin, CalendarDays, Circle } from 'lucide-react';
import { Button, CardTitle, Empty, Glass, IconButton, PageHeader, stagger } from '../components/ui';
import { useStore } from '../store';
import { addDays, DOW, fmtLong, keyOf, MONTHS_LONG, parseKey, startOfWeek, todayKey } from '../lib/date';
import { colorOf } from '../lib/format';

export default function Calendar({ openEvent }) {
  const events = useStore((s) => s.events);
  const tasks = useStore((s) => s.tasks);
  const deleteEvent = useStore((s) => s.deleteEvent);
  const toggleTask = useStore((s) => s.toggleTask);

  const today = todayKey();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState(today);

  // 6 weeks starting on the Monday on/before the 1st
  const cells = useMemo(() => {
    const start = startOfWeek(cursor);
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [cursor]);

  const byDay = useMemo(() => {
    const map = {};
    for (const e of events) (map[e.date] ??= []).push(e);
    for (const k in map) map[k].sort((a, b) => a.start.localeCompare(b.start));
    return map;
  }, [events]);

  const dueByDay = useMemo(() => {
    const map = {};
    for (const t of tasks) if (!t.done && t.due) map[t.due] = (map[t.due] ?? 0) + 1;
    return map;
  }, [tasks]);

  const shift = (n) => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + n, 1));
  const jumpToday = () => {
    const d = new Date();
    setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
    setSelected(today);
  };

  const dayEvents = byDay[selected] ?? [];
  const dayTasks = tasks.filter((t) => !t.done && t.due === selected);
  const monthCount = events.filter((e) => e.date.startsWith(keyOf(cursor).slice(0, 7))).length;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" exit="exit">
      <PageHeader title="Calendar" subtitle={`${monthCount} ${monthCount === 1 ? 'event' : 'events'} in ${MONTHS_LONG[cursor.getMonth()]}`}>
        <Button onClick={jumpToday}>Today</Button>
        <Button variant="primary" icon={Plus} onClick={() => openEvent(selected)}>New event</Button>
      </PageHeader>

      <div className="m-stack grid grid-cols-4 gap-[18px]">
        <Glass className="col-span-3 p-5 max-md:p-3.5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[17px] font-semibold text-white">
              {MONTHS_LONG[cursor.getMonth()]} <span className="font-normal text-white/50">{cursor.getFullYear()}</span>
            </h2>
            <div className="flex gap-2">
              <IconButton icon={ChevronLeft} label="Previous month" size={32} plain onClick={() => shift(-1)} />
              <IconButton icon={ChevronRight} label="Next month" size={32} plain onClick={() => shift(1)} />
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1.5 max-md:gap-1">
            {DOW.map((d) => (
              <div key={d} className="pb-1 text-center text-[10px] font-medium uppercase tracking-[0.08em] text-white/40">{d}</div>
            ))}
            {cells.map((d) => {
              const k = keyOf(d);
              const inMonth = d.getMonth() === cursor.getMonth();
              const isToday = k === today;
              const isSel = k === selected;
              const list = byDay[k] ?? [];
              return (
                <button
                  key={k} type="button" onClick={() => setSelected(k)} onDoubleClick={() => openEvent(k)}
                  aria-label={fmtLong(d)} aria-pressed={isSel}
                  className={`tile tile-hover flex h-[98px] flex-col items-stretch gap-[3px] overflow-hidden p-2 text-left max-md:h-[52px] max-md:items-center max-md:rounded-[12px] max-md:p-1 ${inMonth ? '' : 'opacity-40'} ${isSel ? '!border-white/45 !bg-white/[0.14]' : ''}`}
                >
                  <span className="flex items-center justify-between">
                    <span className={`grid size-6 place-items-center rounded-full text-[11px] font-medium ${isToday ? 'bg-blue-500 text-white shadow-[0_0_14px_rgba(59,130,246,0.8)]' : 'text-white/85'}`}>
                      {d.getDate()}
                    </span>
                    {dueByDay[k] > 0 && <span className="mr-0.5 text-[9px] text-white/45 max-md:hidden">{dueByDay[k]} due</span>}
                  </span>
                  {list.length > 0 && (
                    <span className="hidden gap-[3px] max-md:flex">
                      {list.slice(0, 3).map((e) => <span key={e.id} className="size-[5px] rounded-full" style={{ background: colorOf(e.color).hex }} />)}
                    </span>
                  )}
                  {list.slice(0, 2).map((e) => (
                    <span key={e.id} className="truncate rounded-[6px] px-1.5 text-[10px] font-medium leading-[17px] text-white/90 max-md:hidden" style={{ background: colorOf(e.color).soft, boxShadow: `inset 2px 0 0 ${colorOf(e.color).hex}` }}>
                      {e.title}
                    </span>
                  ))}
                  {list.length > 2 && <span className="px-1 text-[9px] text-white/45 max-md:hidden">+{list.length - 2} more</span>}
                </button>
              );
            })}
          </div>
        </Glass>

        <Glass className="flex flex-col p-5">
          <CardTitle title={selected === today ? 'Today' : parseKey(selected).toLocaleDateString('en-GB', { weekday: 'long' })} subtitle={fmtLong(parseKey(selected))}>
            <IconButton icon={Plus} label="Add event on this day" size={30} plain onClick={() => openEvent(selected)} />
          </CardTitle>
          <div className="mt-4 grid grid-cols-1 gap-2.5">
            {dayEvents.map((e) => {
              const c = colorOf(e.color);
              return (
                <div key={e.id} className="group flex gap-2.5">
                  <span className="w-9 shrink-0 pt-2.5 text-right text-[10px] text-white/45">{e.start}</span>
                  <div className="min-w-0 flex-1 rounded-[14px] py-2 pl-3 pr-2" style={{ background: `linear-gradient(90deg, ${c.soft}, rgba(255,255,255,0.05))`, boxShadow: `inset 2.5px 0 0 ${c.hex}, inset 0 0 0 1px rgba(255,255,255,0.07)` }}>
                    <div className="flex items-start gap-1">
                      <p className="min-w-0 flex-1 truncate text-[12px] font-semibold text-white">{e.title}</p>
                      <button type="button" aria-label={`Delete ${e.title}`} onClick={() => deleteEvent(e.id)} className="grid size-5 place-items-center rounded-full text-white/0 transition-colors hover:bg-white/10 hover:!text-rose-300 group-hover:text-white/50 focus-visible:text-white/70 touch-show">
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <p className="mt-0.5 text-[10px] text-white/50">{e.start} – {e.end}</p>
                    {e.location && <p className="mt-1.5 flex items-center gap-1 text-[10px] text-white/60"><MapPin size={10} /> {e.location}</p>}
                  </div>
                </div>
              );
            })}
            {!dayEvents.length && <Empty icon={CalendarDays} title="No events" hint="Use the plus button to add one." />}
          </div>
          {dayTasks.length > 0 && (
            <>
              <p className="mb-2 mt-5 text-[10px] font-medium uppercase tracking-[0.08em] text-white/40">Tasks due</p>
              <div className="grid grid-cols-1 gap-1.5">
                {dayTasks.map((t) => (
                  <button key={t.id} type="button" onClick={() => toggleTask(t.id)} className="tile tile-hover flex items-center gap-2.5 px-2.5 py-2 text-left">
                    <Circle size={15} className="shrink-0 text-white/50" />
                    <span className="min-w-0 flex-1 truncate text-[12px] text-white/90">{t.title}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </Glass>
      </div>
    </motion.div>
  );
}
