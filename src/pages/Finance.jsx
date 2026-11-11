import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Plus, ArrowDownLeft, ArrowUpRight, Scale, PiggyBank, Trash2, Receipt } from 'lucide-react';
import { Avatar, BarChart, Button, CardTitle, Empty, Field, Glass, Modal, PageHeader, Ring, Segmented, stagger } from '../components/ui';
import { CATEGORY_COLOR, EXPENSE_CATEGORIES, INCOME_CATEGORIES, sumTx, useStore } from '../store';
import { addDays, dowShort, keyOf, lastDays, MONTHS, relDay, startOfDay, todayKey } from '../lib/date';
import { colorOf, compact, money, pct } from '../lib/format';
import { CATEGORY_ICONS } from '../lib/icons';

const RANGES = [
  { value: 'week', label: 'Week', days: 7, word: 'Last 7 days' },
  { value: 'month', label: 'Month', days: 30, word: 'Last 30 days' },
  { value: 'year', label: 'Year', days: 365, word: 'Last 12 months' },
];

function TxModal({ open, onClose }) {
  const addTx = useStore((s) => s.addTx);
  const currency = useStore((s) => s.settings.currency);
  const blank = { type: 'expense', amount: '', category: 'Food', note: '', date: todayKey() };
  const [f, setF] = useState(blank);
  const set = (patch) => setF((v) => ({ ...v, ...patch }));
  const cats = f.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const amount = Number(String(f.amount).replace(',', '.'));
  const valid = Number.isFinite(amount) && amount > 0 && f.date;

  const submit = (e) => {
    e.preventDefault();
    if (!valid) return;
    addTx({ type: f.type, amount, category: f.category, note: f.note.trim(), date: f.date });
    setF({ ...blank, date: todayKey() });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="New transaction" subtitle="Log money coming in or going out">
      <form onSubmit={submit} className="grid grid-cols-1 gap-3.5">
        <Segmented
          className="w-full" glass={false}
          options={[{ value: 'expense', label: 'Expense' }, { value: 'income', label: 'Income' }]}
          value={f.type}
          onChange={(type) => set({ type, category: type === 'expense' ? 'Food' : 'Salary' })}
        />
        <div className="grid grid-cols-2 gap-3">
          <Field label={`Amount (${currency})`}>
            <input autoFocus inputMode="decimal" className="field" value={f.amount} onChange={(e) => set({ amount: e.target.value })} placeholder="0" />
          </Field>
          <Field label="Date">
            <input type="date" className="field" value={f.date} onChange={(e) => set({ date: e.target.value })} />
          </Field>
        </div>
        {f.amount !== '' && !(amount > 0) && <p className="-mt-1 text-[11px] text-rose-300">Enter an amount greater than zero.</p>}
        <Field label="Category">
          <select className="field" value={f.category} onChange={(e) => set({ category: e.target.value })}>
            {cats.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Note (optional)">
          <input className="field" value={f.note} onChange={(e) => set({ note: e.target.value })} placeholder="What was it for?" />
        </Field>
        <div className="mt-1 flex justify-end gap-2">
          <Button variant="soft" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" className={valid ? '' : 'opacity-50'}>Add</Button>
        </div>
      </form>
    </Modal>
  );
}

function MoneyCard({ icon: Icon, color, label, value, sub }) {
  const c = colorOf(color);
  return (
    <Glass lift className="m-half flex h-[156px] flex-col p-[18px] max-md:h-[128px] max-md:p-4">
      <div className="flex items-start justify-between">
        <span className="grid size-9 place-items-center rounded-[12px]" style={{ background: c.soft, color: c.hex, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.18), 0 6px 16px -8px ${c.solid}` }}>
          <Icon size={17} strokeWidth={2} />
        </span>
      </div>
      <p className="mt-auto truncate pt-3 text-[11px] text-white/55">{label}</p>
      <p className="truncate text-[22px] font-semibold leading-8 tracking-[-0.01em] text-white">{value}</p>
      {sub && <p className="mt-0.5 truncate text-[10px] text-white/45">{sub}</p>}
    </Glass>
  );
}

export default function Finance() {
  const tx = useStore((s) => s.tx);
  const settings = useStore((s) => s.settings);
  const deleteTx = useStore((s) => s.deleteTx);
  const [range, setRange] = useState('month');
  const [modal, setModal] = useState(false);
  const R = RANGES.find((r) => r.value === range);
  const cur = settings.currency;
  const today = todayKey();

  const view = useMemo(() => {
    const t0 = startOfDay(new Date());
    const from = keyOf(addDays(t0, -(R.days - 1)));
    const income = sumTx(tx, 'income', from, today);
    const expense = sumTx(tx, 'expense', from, today);
    const monthFrom = `${today.slice(0, 7)}-01`;
    const spentMonth = sumTx(tx, 'expense', monthFrom, today);

    let bars;
    if (range === 'week') {
      bars = lastDays(7).map((d, i) => ({ key: keyOf(d), label: dowShort(d), value: sumTx(tx, 'expense', keyOf(d), keyOf(d)), active: i === 6 }));
    } else if (range === 'month') {
      bars = lastDays(30).map((d, i) => ({ key: keyOf(d), label: i % 5 === 4 || i === 0 ? String(d.getDate()) : '', value: sumTx(tx, 'expense', keyOf(d), keyOf(d)), active: i === 29 }));
    } else {
      bars = Array.from({ length: 12 }, (_, i) => {
        const m = new Date(t0.getFullYear(), t0.getMonth() - 11 + i, 1);
        const prefix = keyOf(m).slice(0, 7);
        return { key: prefix, label: MONTHS[m.getMonth()], value: tx.reduce((a, t) => (t.type === 'expense' && t.date.startsWith(prefix) ? a + t.amount : a), 0), active: i === 11 };
      });
    }

    const byCat = {};
    for (const t of tx) if (t.type === 'expense' && t.date >= from && t.date <= today) byCat[t.category] = (byCat[t.category] ?? 0) + t.amount;
    const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
    const list = tx.filter((t) => t.date >= from && t.date <= today).sort((a, b) => b.date.localeCompare(a.date));
    return { income, expense, spentMonth, bars, cats, list };
  }, [tx, range, R.days, today]);

  const budgetLeft = settings.monthlyBudget - view.spentMonth;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" exit="exit">
      <PageHeader title="Finance" subtitle="Where your money comes from and where it goes">
        <Segmented options={RANGES} value={range} onChange={setRange} />
        <Button variant="primary" icon={Plus} onClick={() => setModal(true)}>Add transaction</Button>
      </PageHeader>

      <div className="m-stack grid grid-cols-4 gap-[18px]">
        <MoneyCard icon={ArrowDownLeft} color="green" label={`Income · ${R.word.toLowerCase()}`} value={money(view.income, cur)} sub={money(view.income, cur, { full: true })} />
        <MoneyCard icon={ArrowUpRight} color="rose" label={`Expenses · ${R.word.toLowerCase()}`} value={money(view.expense, cur)} sub={money(view.expense, cur, { full: true })} />
        <MoneyCard icon={Scale} color="blue" label="Balance" value={money(view.income - view.expense, cur, { sign: true })} sub={view.income >= view.expense ? 'You saved money' : 'You spent more than you earned'} />
        <MoneyCard icon={PiggyBank} color="amber" label="Budget left this month" value={money(budgetLeft, cur)} sub={`of ${money(settings.monthlyBudget, cur, { full: true })}`} />

        <Glass className="col-span-3 flex h-[360px] flex-col p-5 max-md:h-[280px]">
          <CardTitle title="Spending" subtitle={R.word} />
          <div className="mt-5 min-h-0 flex-1">
            <BarChart key={range} data={view.bars} height="100%" format={(v) => compact(v)} />
          </div>
        </Glass>

        <Glass className="flex h-[360px] flex-col p-5 max-md:h-auto max-md:max-h-[360px]">
          <CardTitle title="Categories" subtitle={R.word} />
          <div className="no-scrollbar mt-4 grid min-h-0 flex-1 content-start gap-3 overflow-y-auto">
            {view.cats.map(([name, amount]) => {
              const c = colorOf(CATEGORY_COLOR[name]);
              const share = pct(amount, view.expense);
              return (
                <div key={name}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-2 text-[12px]">
                    <span className="truncate font-medium text-white">{name}</span>
                    <span className="shrink-0 text-white/55">{money(amount, cur)} · {share}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/[0.09]">
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }} animate={{ width: `${share}%` }}
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                      style={{ background: `linear-gradient(90deg, ${c.solid}, ${c.hex})`, boxShadow: `0 0 12px ${c.soft}` }}
                    />
                  </div>
                </div>
              );
            })}
            {!view.cats.length && <Empty icon={Receipt} title="No spending" hint="Nothing was spent in this period." />}
          </div>
        </Glass>

        <Glass className="col-span-3 p-5">
          <CardTitle title="Transactions" subtitle={`${view.list.length} in this period`} />
          <div className="mt-3 grid grid-cols-1 gap-0.5">
            {view.list.slice(0, 40).map((t) => {
              const income = t.type === 'income';
              return (
                <div key={t.id} className="group -mx-2 flex items-center gap-3 rounded-[14px] px-2 py-2 transition-colors hover:bg-white/[0.06]">
                  <Avatar size={34} color={CATEGORY_COLOR[t.category]} icon={CATEGORY_ICONS[t.category]} name={t.category} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-white">{t.note || t.category}</p>
                    <p className="text-[10px] text-white/45">{t.category} · {relDay(t.date)}</p>
                  </div>
                  <button type="button" aria-label={`Delete ${t.note || t.category}`} onClick={() => deleteTx(t.id)} className="grid size-7 place-items-center rounded-full text-white/0 transition-colors hover:bg-white/10 hover:!text-rose-300 group-hover:text-white/45 focus-visible:text-white/70 touch-show">
                    <Trash2 size={13} />
                  </button>
                  <span className={`shrink-0 text-[13px] font-semibold ${income ? 'text-emerald-300' : 'text-white'}`}>
                    {income ? '+' : '−'}{money(t.amount, cur, { full: true })}
                  </span>
                </div>
              );
            })}
            {!view.list.length && <Empty icon={Receipt} title="No transactions yet" hint="Add your first income or expense with the blue button." />}
          </div>
        </Glass>

        <Glass className="flex flex-col items-center self-start p-5 text-center">
          <div className="w-full text-left"><CardTitle title="Monthly budget" subtitle={`${MONTHS[new Date().getMonth()]} ${new Date().getFullYear()}`} /></div>
          <div className="my-5">
            <Ring value={pct(view.spentMonth, settings.monthlyBudget)} size={128} stroke={10} color={budgetLeft < 0 ? 'rose' : 'amber'} />
          </div>
          <p className="text-[13px] font-medium text-white">{money(view.spentMonth, cur, { full: true })} spent</p>
          <p className="mt-0.5 text-[11px] text-white/50">
            {budgetLeft >= 0 ? `${money(budgetLeft, cur, { full: true })} left` : `${money(-budgetLeft, cur, { full: true })} over budget`}
          </p>
          <p className="mt-3 text-[10px] text-white/40">Change the budget in Settings.</p>
        </Glass>
      </div>

      <TxModal open={modal} onClose={() => setModal(false)} />
    </motion.div>
  );
}
