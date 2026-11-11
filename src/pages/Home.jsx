import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowUpRight, ListChecks, Wallet, CloudSun, Repeat, Download, Plus, Check, ChevronRight, CalendarDays,
  TrendingUp, TrendingDown, Sparkles, MapPin, Circle, CircleCheck,
} from 'lucide-react';
import { Avatar, BarChart, Button, CardTitle, Chip, Empty, Glass, IconButton, PageHeader, Ring, Segmented, Sparkline, stagger } from '../components/ui';
import { doneOn, streakOf, sumTx, useStore } from '../store';
import { addDays, dowShort, fmtLong, fmtTime, greeting, keyOf, lastDays, MONTHS, startOfDay, timeAgo } from '../lib/date';
import { colorOf, money, pct } from '../lib/format';
import { ACTIVITY, HABIT_ICONS } from '../lib/icons';
import { describe } from '../lib/weather';

const RANGES = [
  { value: 'week', label: 'Week', days: 7, word: '7 days', prev: 'last week' },
  { value: 'month', label: 'Month', days: 30, word: '30 days', prev: 'last month' },
  { value: 'year', label: 'Year', days: 365, word: '12 months', prev: 'last year' },
];

function StatCard({ icon: Icon, color, label, value, chip, chipColor, spark, onClick }) {
  const c = colorOf(color);
  return (
    <Glass lift className="m-half flex h-[164px] cursor-pointer flex-col p-[18px] max-md:h-[132px] max-md:p-4" onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}>
      <div className="flex items-start justify-between">
        <span className="grid size-9 place-items-center rounded-[12px]" style={{ background: c.soft, color: c.hex, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.18), 0 6px 16px -8px ${c.solid}` }}>
          <Icon size={17} strokeWidth={2} />
        </span>
        <ArrowUpRight size={15} className="text-white/45" />
      </div>
      <p className="mt-auto truncate pt-3 text-[11px] text-white/55">{label}</p>
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-[23px] font-semibold leading-8 tracking-[-0.01em] text-white">{value}</p>
          <div className="mt-1.5 flex"><Chip color={chipColor}>{chip}</Chip></div>
        </div>
        <div className="shrink-0 pb-0.5 max-md:hidden"><Sparkline data={spark} color={c.hex} width={92} height={40} /></div>
      </div>
    </Glass>
  );
}

export default function Home({ go, now, openEvent, weatherError }) {
  const tasks = useStore((s) => s.tasks);
  const habits = useStore((s) => s.habits);
  const events = useStore((s) => s.events);
  const tx = useStore((s) => s.tx);
  const activity = useStore((s) => s.activity);
  const settings = useStore((s) => s.settings);
  const weather = useStore((s) => s.weather);
  const sample = useStore((s) => s.sample);
  const toggleTask = useStore((s) => s.toggleTask);
  const toggleHabit = useStore((s) => s.toggleHabit);
  const exportData = useStore((s) => s.exportData);

  const [range, setRange] = useState('week');
  const [allActivity, setAllActivity] = useState(false);
  const R = RANGES.find((r) => r.value === range);
  const today = keyOf(now);
  const cur = settings.currency;

  // ---- stat cards
  const stats = useMemo(() => {
    const d7 = lastDays(7).map(keyOf);
    const open = tasks.filter((t) => !t.done).length;
    const doneToday = tasks.filter((t) => t.done && t.doneAt && keyOf(new Date(t.doneAt)) === today).length;
    const taskSpark = d7.map((k) => tasks.filter((t) => t.done && t.doneAt && keyOf(new Date(t.doneAt)) === k).length);

    const t0 = startOfDay(new Date());
    const from = keyOf(addDays(t0, -(R.days - 1)));
    const prevFrom = keyOf(addDays(t0, -(2 * R.days - 1)));
    const prevTo = keyOf(addDays(t0, -R.days));
    const spent = sumTx(tx, 'expense', from, today);
    const spentPrev = sumTx(tx, 'expense', prevFrom, prevTo);
    const spendDelta = spentPrev > 0 ? Math.round(((spent - spentPrev) / spentPrev) * 100) : null;
    const spendSpark = lastDays(14).map((d) => sumTx(tx, 'expense', keyOf(d), keyOf(d)));

    const habitToday = pct(habits.filter((h) => h.log[today]).length, habits.length);
    const best = habits.reduce((m, h) => Math.max(m, streakOf(h)), 0);
    const habitSpark = d7.map((k) => pct(habits.filter((h) => h.log[k]).length, habits.length));
    return { open, doneToday, taskSpark, spent, spendDelta, spendSpark, habitToday, best, habitSpark };
  }, [tasks, habits, tx, today, R.days]);

  // ---- productivity chart
  const chart = useMemo(() => {
    const t0 = startOfDay(new Date());
    const total = (fromOffset, toOffset) => {
      let n = 0;
      for (let i = fromOffset; i <= toOffset; i++) n += doneOn(keyOf(addDays(t0, i)), tasks, habits);
      return n;
    };
    let data;
    if (range === 'week') {
      data = lastDays(7).map((d, i) => ({ key: keyOf(d), label: dowShort(d), value: doneOn(keyOf(d), tasks, habits), active: i === 6 }));
    } else if (range === 'month') {
      data = lastDays(30).map((d, i) => ({
        key: keyOf(d), label: i % 5 === 4 || i === 0 ? String(d.getDate()) : '', value: doneOn(keyOf(d), tasks, habits), active: i === 29,
      }));
    } else {
      const months = Array.from({ length: 12 }, (_, i) => new Date(t0.getFullYear(), t0.getMonth() - 11 + i, 1));
      data = months.map((m, i) => {
        const prefix = keyOf(m).slice(0, 7);
        let value = tasks.filter((t) => t.done && t.doneAt && keyOf(new Date(t.doneAt)).startsWith(prefix)).length;
        for (const h of habits) for (const k in h.log) if (k.startsWith(prefix)) value++;
        return { key: prefix, label: MONTHS[m.getMonth()], value, active: i === 11 };
      });
    }
    const sum = data.reduce((a, d) => a + d.value, 0);
    const prev = total(-(2 * R.days - 1), -R.days);
    const delta = prev > 0 ? Math.round(((sum - prev) / prev) * 100) : null;
    return { data, sum, delta };
  }, [tasks, habits, range, R.days]);

  // ---- today
  const todayEvents = events.filter((e) => e.date === today).sort((a, b) => a.start.localeCompare(b.start));
  const dueToday = tasks.filter((t) => !t.done && t.due && t.due <= today).slice(0, 4);
  const nowTime = fmtTime(now);

  // ---- goals
  const goals = useMemo(() => {
    const monthFrom = `${today.slice(0, 7)}-01`;
    const spentMonth = sumTx(tx, 'expense', monthFrom, today);
    const weekFrom = keyOf(addDays(startOfDay(new Date()), -6));
    const doneWeek = tasks.filter((t) => t.done && t.doneAt && keyOf(new Date(t.doneAt)) >= weekFrom).length;
    const leftWeek = tasks.filter((t) => !t.done && t.due && t.due <= keyOf(addDays(startOfDay(new Date()), 6))).length;
    const d7 = lastDays(7).map(keyOf);
    const checks = habits.reduce((a, h) => a + d7.filter((k) => h.log[k]).length, 0);
    return [
      {
        label: 'Monthly budget', color: spentMonth > settings.monthlyBudget ? 'rose' : 'amber',
        value: pct(spentMonth, settings.monthlyBudget), sub: `${money(spentMonth, cur)} of ${money(settings.monthlyBudget, cur)}`,
      },
      { label: 'Tasks this week', color: 'blue', value: pct(doneWeek, doneWeek + leftWeek), sub: `${doneWeek} done · ${leftWeek} left` },
      { label: 'Habit consistency', color: 'violet', value: pct(checks, habits.length * 7), sub: 'Last 7 days' },
    ];
  }, [tasks, habits, tx, settings.monthlyBudget, cur, today]);

  const W = weather?.current ? describe(weather.current.code, weather.current.isDay) : null;
  const tempSpark = weather?.hourly?.length ? weather.hourly.map((h) => h.temp) : [0, 0];

  const download = () => {
    const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `dashboard-backup-${today}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  const shown = allActivity ? activity.slice(0, 14) : activity.slice(0, 5);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" exit="exit">
      <PageHeader
        title={`${greeting(now.getHours())}, ${settings.name}`}
        subtitle={
          <>
            {fmtLong(now)} · {nowTime}
            {sample && (
              <>
                {' · '}
                <button type="button" onClick={() => go('settings')} className="font-medium text-white/80 underline decoration-white/30 underline-offset-2 hover:text-white">
                  Sample data — clear it in Settings
                </button>
              </>
            )}
          </>
        }
      >
        <Segmented options={RANGES} value={range} onChange={setRange} />
        <Button icon={Download} onClick={download}>Export</Button>
      </PageHeader>

      <div className="m-stack grid grid-cols-4 gap-[18px]">
        <StatCard
          icon={ListChecks} color="amber" label="Open tasks" value={stats.open}
          chip={<><Check size={10} strokeWidth={3} /> {stats.doneToday} today</>} chipColor="green"
          spark={stats.taskSpark} onClick={() => go('tasks')}
        />
        <StatCard
          icon={Wallet} color="green" label={`Spent · ${R.word}`} value={money(stats.spent, cur)}
          chip={
            stats.spendDelta === null ? 'No earlier data'
              : <>{stats.spendDelta > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />} {Math.abs(stats.spendDelta)}%</>
          }
          chipColor={stats.spendDelta > 0 ? 'rose' : 'green'}
          spark={stats.spendSpark} onClick={() => go('finance')}
        />
        <StatCard
          icon={W?.Icon ?? CloudSun} color="blue" label={settings.city.name}
          value={weather?.current ? `${Math.round(weather.current.temp)}°C` : '—'}
          chip={W ? W.label : weatherError ? 'No connection' : 'Loading forecast'} chipColor={!W && weatherError ? 'rose' : 'blue'}
          spark={tempSpark} onClick={() => go('weather')}
        />
        <StatCard
          icon={Repeat} color="violet" label="Habits today" value={`${stats.habitToday}%`}
          chip={<><Sparkles size={10} /> {stats.best}d streak</>} chipColor="violet"
          spark={stats.habitSpark} onClick={() => go('habits')}
        />

        {/* ---- productivity ---- */}
        <Glass className="col-span-3 flex h-[392px] flex-col p-5 max-md:h-[300px]">
          <CardTitle title="Productivity" subtitle={`Tasks finished and habit check-ins · ${R.word}`}>
            <Chip color={chart.delta !== null && chart.delta < 0 ? 'rose' : 'green'} className="h-6 px-2.5 text-[11px]">
              {chart.delta === null ? `${chart.sum} completed`
                : <>{chart.delta >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />} {Math.abs(chart.delta)}% vs {R.prev}</>}
            </Chip>
          </CardTitle>
          <div className="mt-5 min-h-0 flex-1">
            <BarChart key={range} data={chart.data} height="100%" />
          </div>
        </Glass>

        {/* ---- today ---- */}
        <Glass className="flex h-[392px] flex-col p-5 max-md:h-auto max-md:max-h-[440px]">
          <CardTitle title="Today" subtitle={fmtLong(now)}>
            <IconButton icon={Plus} label="Add event" size={30} plain onClick={() => openEvent(today)} />
          </CardTitle>
          <div className="no-scrollbar -mx-1 mt-4 min-h-0 flex-1 overflow-y-auto px-1 pb-4" style={{ maskImage: 'linear-gradient(to bottom, #000 calc(100% - 26px), transparent)' }}>
            {!todayEvents.length && !dueToday.length && (
              <Empty icon={CalendarDays} title="Nothing scheduled" hint="Use the plus button to add an event for today." />
            )}
            <div className="grid grid-cols-1 gap-2.5">
              {todayEvents.map((e) => {
                const c = colorOf(e.color);
                const live = e.start <= nowTime && nowTime < e.end;
                return (
                  <div key={e.id} className="flex gap-2.5">
                    <span className="w-9 shrink-0 pt-2.5 text-right text-[10px] text-white/45">{e.start}</span>
                    <div
                      className="min-w-0 flex-1 rounded-[14px] py-2 pl-3 pr-2.5"
                      style={{ background: `linear-gradient(90deg, ${c.soft}, rgba(255,255,255,0.05))`, boxShadow: `inset 2.5px 0 0 ${c.hex}, inset 0 0 0 1px rgba(255,255,255,0.07)` }}
                    >
                      <div className="flex items-center gap-2">
                        <p className="min-w-0 flex-1 truncate text-[12px] font-semibold text-white">{e.title}</p>
                        {live && <Chip color="green">Now</Chip>}
                      </div>
                      <p className="mt-0.5 text-[10px] text-white/50">{e.start} – {e.end}</p>
                      {e.location && (
                        <p className="mt-1.5 flex items-center gap-1 text-[10px] text-white/60"><MapPin size={10} /> {e.location}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {dueToday.length > 0 && (
              <>
                <p className="mb-2 mt-4 text-[10px] font-medium uppercase tracking-[0.08em] text-white/40">Due</p>
                <div className="grid grid-cols-1 gap-1.5">
                  {dueToday.map((t) => (
                    <button key={t.id} type="button" onClick={() => toggleTask(t.id)} className="tile tile-hover group flex items-center gap-2.5 px-2.5 py-2 text-left">
                      <span className="relative grid size-4 shrink-0 place-items-center text-white/50 group-hover:text-emerald-300">
                        <Circle size={16} className="group-hover:hidden" />
                        <CircleCheck size={16} className="hidden group-hover:block" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[12px] text-white/90">{t.title}</span>
                      {t.due < today && <Chip color="rose">Late</Chip>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </Glass>

        {/* ---- recent activity ---- */}
        <Glass className="col-span-2 p-5">
          <CardTitle title="Recent activity" subtitle="What you've been up to">
            {activity.length > 5 && (
              <button type="button" onClick={() => setAllActivity((v) => !v)} className="flex items-center gap-0.5 text-[11px] font-medium text-white/60 hover:text-white">
                {allActivity ? 'Show less' : 'View all'} <ChevronRight size={13} className={allActivity ? '-rotate-90' : ''} />
              </button>
            )}
          </CardTitle>
          <div className="mt-3 grid grid-cols-1 gap-0.5">
            {shown.map((a) => {
              const meta = ACTIVITY[a.kind] ?? ACTIVITY.task;
              return (
                <div key={a.id} className="-mx-2 flex items-center gap-3 rounded-[14px] px-2 py-2 transition-colors hover:bg-white/[0.06]">
                  <Avatar size={32} color={meta.color} icon={meta.Icon} />
                  <p className="min-w-0 flex-1 truncate text-[12px]">
                    <span className="font-medium text-white">{a.verb}</span>
                    <span className="mx-2 inline-block h-px w-6 bg-white/20 align-middle" />
                    <span className="text-white/75">{a.text}</span>
                  </p>
                  <span className="shrink-0 text-[10px] text-white/40">{timeAgo(a.at)}</span>
                </div>
              );
            })}
            {!activity.length && <Empty icon={Sparkles} title="No activity yet" hint="Finish a task or check in a habit and it shows up here." />}
          </div>
        </Glass>

        {/* ---- habits ---- */}
        <Glass className="p-5">
          <CardTitle title="Habits" subtitle={`${habits.filter((h) => h.log[today]).length} of ${habits.length} done today`}>
            <IconButton icon={ArrowUpRight} label="Open habits" size={30} plain onClick={() => go('habits')} />
          </CardTitle>
          <div className="mt-3 grid grid-cols-1 gap-0.5">
            {habits.slice(0, 4).map((h) => {
              const on = !!h.log[today];
              return (
                <div key={h.id} className="-mx-2 flex items-center gap-3 rounded-[14px] px-2 py-2 transition-colors hover:bg-white/[0.06]">
                  <Avatar size={32} color={h.color} icon={HABIT_ICONS[h.icon]} name={h.name} status={on ? 'on' : 'off'} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-medium text-white">{h.name}</p>
                    <p className="text-[10px] text-white/45">{streakOf(h)} day streak</p>
                  </div>
                  <button
                    type="button" aria-label={`${on ? 'Undo' : 'Check in'} ${h.name}`} aria-pressed={on} onClick={() => toggleHabit(h.id, today)}
                    className={`grid size-7 shrink-0 place-items-center rounded-full transition-colors ${on ? 'bg-emerald-400 text-emerald-950' : 'bg-white/[0.08] text-white/55 hover:bg-white/[0.16] hover:text-white'}`}
                  >
                    <Check size={14} strokeWidth={2.6} />
                  </button>
                </div>
              );
            })}
            {!habits.length && <Empty icon={Repeat} title="No habits yet" hint="Create one on the Habits page." />}
          </div>
        </Glass>

        {/* ---- goals ---- */}
        <Glass className="p-5">
          <CardTitle title="Goals" subtitle={`${goals.length} targets`} />
          <div className="mt-3 grid grid-cols-1 gap-3">
            {goals.map((g) => (
              <div key={g.label} className="flex items-center gap-3">
                <Ring value={g.value} color={g.color} size={46} />
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-medium text-white">{g.label}</p>
                  <p className="truncate text-[10px] text-white/45">{g.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </Glass>
      </div>
    </motion.div>
  );
}
