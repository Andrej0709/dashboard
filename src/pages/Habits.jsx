import { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Check, Trash2, Flame, Repeat, Trophy, CalendarCheck } from 'lucide-react';
import { Avatar, Button, CardTitle, Empty, Field, Glass, Modal, PageHeader, Ring, Swatches, stagger } from '../components/ui';
import { streakOf, useStore } from '../store';
import { addDays, DOW, fmtShort, keyOf, lastDays, startOfWeek, todayKey } from '../lib/date';
import { colorOf, pct } from '../lib/format';
import { HABIT_ICONS } from '../lib/icons';

const HABIT_COLORS = ['rose', 'amber', 'blue', 'violet', 'green', 'cyan'];

function HabitModal({ open, onClose }) {
  const addHabit = useStore((s) => s.addHabit);
  const [f, setF] = useState({ name: '', icon: 'dumbbell', color: 'rose' });
  const submit = (e) => {
    e.preventDefault();
    if (!f.name.trim()) return;
    addHabit({ ...f, name: f.name.trim() });
    setF({ name: '', icon: 'dumbbell', color: 'rose' });
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="New habit" subtitle="Something you want to do every day">
      <form onSubmit={submit} className="grid grid-cols-1 gap-3.5">
        <Field label="Name">
          <input autoFocus className="field" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Stretch for 10 minutes" />
        </Field>
        <div>
          <span className="mb-1.5 block text-[11px] font-medium text-white/55">Icon</span>
          <div className="flex flex-wrap gap-2">
            {Object.entries(HABIT_ICONS).map(([key, Icon]) => (
              <button
                key={key} type="button" aria-label={key} aria-pressed={f.icon === key} onClick={() => setF({ ...f, icon: key })}
                className={`grid size-9 place-items-center rounded-full border transition-colors ${f.icon === key ? 'border-white bg-white text-neutral-900' : 'border-white/10 bg-white/[0.07] text-white/75 hover:bg-white/[0.14]'}`}
              >
                <Icon size={16} />
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="mb-1.5 block text-[11px] font-medium text-white/55">Colour</span>
          <Swatches value={f.color} onChange={(color) => setF({ ...f, color })} options={HABIT_COLORS} />
        </div>
        <div className="mt-1 flex justify-end gap-2">
          <Button variant="soft" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" className={f.name.trim() ? '' : 'opacity-50'}>Create habit</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function Habits() {
  const habits = useStore((s) => s.habits);
  const toggleHabit = useStore((s) => s.toggleHabit);
  const deleteHabit = useStore((s) => s.deleteHabit);
  const [modal, setModal] = useState(false);

  const today = todayKey();
  const monday = startOfWeek(new Date());
  const week = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const doneToday = habits.filter((h) => h.log[today]).length;
  const best = habits.reduce((m, h) => Math.max(m, streakOf(h)), 0);
  const total = habits.reduce((a, h) => a + Object.keys(h.log).length, 0);
  const month = lastDays(30);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" exit="exit">
      <PageHeader title="Habits" subtitle={habits.length ? `${doneToday} of ${habits.length} done today` : 'Build a routine one day at a time'}>
        <Button variant="primary" icon={Plus} onClick={() => setModal(true)}>New habit</Button>
      </PageHeader>

      <div className="m-stack grid grid-cols-4 gap-[18px]">
        <Glass className="col-span-3 p-5 max-md:p-4">
          <CardTitle title="This week" subtitle={`${fmtShort(week[0])} – ${fmtShort(week[6])}`} />
          {!habits.length && <Empty icon={Repeat} title="No habits yet" hint="Create your first habit and tick it off every day to build a streak." />}
          {habits.length > 0 && (
            <div className="-mx-2 mt-4">
              <div className="mb-1 grid grid-cols-[minmax(0,1fr)_repeat(7,44px)_64px] items-center gap-2 px-2 max-md:grid-cols-[repeat(7,minmax(0,1fr))_30px] max-md:gap-1">
                <span className="max-md:hidden" />
                {week.map((d, i) => (
                  <span key={i} className={`text-center text-[10px] font-medium uppercase tracking-[0.06em] ${keyOf(d) === today ? 'text-white' : 'text-white/40'}`}>
                    {DOW[i]}
                    <span className="block text-[10px] font-normal normal-case tracking-normal opacity-70">{d.getDate()}</span>
                  </span>
                ))}
                <span className="text-right text-[10px] font-medium uppercase tracking-[0.06em] text-white/40 max-md:invisible">Week</span>
              </div>
              {habits.map((h) => {
                const c = colorOf(h.color);
                const hits = week.filter((d) => h.log[keyOf(d)]).length;
                const elapsed = week.filter((d) => keyOf(d) <= today).length;
                return (
                  <div key={h.id} className="group grid grid-cols-[minmax(0,1fr)_repeat(7,44px)_64px] items-center gap-2 rounded-[16px] px-2 py-2 max-md:grid-cols-[repeat(7,minmax(0,1fr))_30px] max-md:gap-x-1 max-md:gap-y-2 transition-colors hover:bg-white/[0.06]">
                    <div className="flex min-w-0 items-center gap-3 max-md:col-span-full">
                      <Avatar size={36} color={h.color} icon={HABIT_ICONS[h.icon]} name={h.name} status={h.log[today] ? 'on' : 'off'} />
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium text-white">{h.name}</p>
                        <p className="flex items-center gap-1 text-[10px] text-white/45"><Flame size={10} /> {streakOf(h)} day streak</p>
                      </div>
                    </div>
                    {week.map((d) => {
                      const k = keyOf(d);
                      const on = !!h.log[k];
                      const future = k > today;
                      return (
                        <span key={k} className="grid place-items-center">
                          <motion.button
                            type="button" disabled={future} aria-pressed={on}
                            aria-label={`${h.name}, ${fmtShort(d)}${on ? ', done' : ''}`}
                            whileTap={future ? undefined : { scale: 0.82 }}
                            onClick={() => toggleHabit(h.id, k)}
                            className={`grid size-8 place-items-center rounded-full border transition-colors ${
                              on ? 'border-transparent text-white' : future ? 'border-white/[0.06] text-transparent' : 'border-white/20 text-transparent hover:border-white/50 hover:text-white/60'
                            }`}
                            style={on ? { background: `linear-gradient(145deg, ${c.hex}, ${c.solid})`, boxShadow: `0 4px 14px -4px ${c.solid}, inset 0 1px 0 rgba(255,255,255,0.4)` } : undefined}
                          >
                            <Check size={14} strokeWidth={2.8} />
                          </motion.button>
                        </span>
                      );
                    })}
                    <span className="relative flex h-7 items-center justify-end">
                      <span className="text-[12px] font-medium text-white/80 transition-opacity group-hover:opacity-0 group-focus-within:opacity-0 max-md:hidden">{pct(hits, elapsed)}%</span>
                      <button type="button" aria-label={`Delete ${h.name}`} onClick={() => deleteHabit(h.id)} className="absolute right-0 grid size-7 place-items-center rounded-full text-white/60 opacity-0 max-md:opacity-100 transition hover:bg-white/10 hover:text-rose-300 focus-visible:opacity-100 group-hover:opacity-100">
                        <Trash2 size={13} />
                      </button>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Glass>

        <Glass className="flex flex-col items-center p-5 text-center">
          <div className="w-full text-left"><CardTitle title="Today" subtitle={`${doneToday} of ${habits.length} checked in`} /></div>
          <div className="my-5"><Ring value={pct(doneToday, habits.length)} size={128} stroke={10} color="violet" /></div>
          <div className="grid w-full grid-cols-2 gap-2 text-left">
            <div className="tile px-3 py-2.5">
              <Trophy size={14} className="mb-1 text-amber-300" />
              <p className="text-[18px] font-semibold leading-6 text-white">{best}<span className="ml-1 text-[11px] font-normal text-white/50">days</span></p>
              <p className="text-[10px] text-white/45">Best live streak</p>
            </div>
            <div className="tile px-3 py-2.5">
              <CalendarCheck size={14} className="mb-1 text-emerald-300" />
              <p className="text-[18px] font-semibold leading-6 text-white">{total}</p>
              <p className="text-[10px] text-white/45">Total check-ins</p>
            </div>
          </div>
        </Glass>

        <Glass className="col-span-4 p-5">
          <CardTitle title="Last 30 days" subtitle="Each square is one day — brighter means you showed up" />
          <div className="mt-4 grid grid-cols-1 gap-2.5">
            {habits.map((h) => {
              const c = colorOf(h.color);
              const hits = month.filter((d) => h.log[keyOf(d)]).length;
              return (
                <div key={h.id} className="flex items-center gap-4 max-md:gap-2">
                  <span className="w-40 shrink-0 truncate text-[12px] max-md:w-16 font-medium text-white/85">{h.name}</span>
                  <div className="flex flex-1 gap-1 max-md:gap-[2px]">
                    {month.map((d) => {
                      const on = !!h.log[keyOf(d)];
                      return (
                        <span
                          key={keyOf(d)} title={`${fmtShort(d)}${on ? ' · done' : ''}`}
                          className="h-5 flex-1 rounded-[5px] max-md:h-4 max-md:rounded-[3px]"
                          style={{ background: on ? c.hex : 'rgba(255,255,255,0.08)', boxShadow: on ? `0 0 10px -2px ${c.solid}` : 'none', opacity: on ? 0.95 : 1 }}
                        />
                      );
                    })}
                  </div>
                  <span className="w-12 shrink-0 text-right max-md:w-9 text-[11px] text-white/55">{hits}/30</span>
                </div>
              );
            })}
            {!habits.length && <p className="py-3 text-[12px] text-white/45">Your history appears here once you add a habit.</p>}
          </div>
        </Glass>
      </div>

      <HabitModal open={modal} onClose={() => setModal(false)} />
    </motion.div>
  );
}
