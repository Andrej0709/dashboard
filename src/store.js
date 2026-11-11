import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addDays, keyOf, startOfDay } from './lib/date';

const uid = () => crypto.randomUUID();

export const BACKGROUNDS = [
  { id: 'mountain', name: 'Mountain', file: 'backgrounds/mountain.jpg', credit: 'Mo Alach' },
  { id: 'dusk', name: 'Dusk', file: 'backgrounds/dusk.jpg', credit: 'Polina Kuzovkova' },
  { id: 'golden', name: 'Golden hour', file: 'backgrounds/golden.jpg', credit: 'Clay Banks' },
];

export const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Bills', 'Shopping', 'Fun', 'Health', 'Other'];
export const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Gift', 'Other'];
export const CATEGORY_COLOR = {
  Food: 'amber', Transport: 'blue', Bills: 'rose', Shopping: 'violet', Fun: 'cyan', Health: 'green', Other: 'blue',
  Salary: 'green', Freelance: 'cyan', Gift: 'violet',
};
export const LINK_TAGS = ['Articles', 'Videos', 'Tools'];

const defaultSettings = {
  name: 'Andrej',
  currency: 'RSD',
  monthlyBudget: 80000,
  city: { name: 'Belgrade', region: 'Serbia', lat: 44.80401, lon: 20.46513 },
  background: 'mountain',
  blur: 34,
  tint: 42,
};

const defaultLists = [
  { id: 'personal', name: 'Personal', color: 'blue' },
  { id: 'work', name: 'Work', color: 'amber' },
  { id: 'study', name: 'Study', color: 'violet' },
];

const withLog = (state, kind, verb, text) =>
  [{ id: uid(), kind, verb, text, at: new Date().toISOString() }, ...state.activity].slice(0, 40);

export const useStore = create(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      lists: defaultLists,
      sample: false,
      weather: null,
      tasks: [],
      habits: [],
      events: [],
      tx: [],
      links: [],
      activity: [],

      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      setWeather: (weather) => set({ weather }),

      // ---- tasks
      addTask: (task) =>
        set((s) => ({
          tasks: [
            {
              id: uid(), title: task.title.trim(), done: false, doneAt: null, createdAt: new Date().toISOString(),
              due: task.due ?? null, priority: task.priority ?? 'med', list: task.list ?? s.lists[0].id,
              notes: '', starred: false,
            },
            ...s.tasks,
          ],
          activity: withLog(s, 'task', 'Added', task.title.trim()),
        })),
      toggleTask: (id) =>
        set((s) => {
          const t = s.tasks.find((x) => x.id === id);
          if (!t) return {};
          const done = !t.done;
          return {
            tasks: s.tasks.map((x) => (x.id === id ? { ...x, done, doneAt: done ? new Date().toISOString() : null } : x)),
            activity: done ? withLog(s, 'task', 'Completed', t.title) : s.activity,
          };
        }),
      updateTask: (id, patch) => set((s) => ({ tasks: s.tasks.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((x) => x.id !== id) })),
      clearCompleted: (listId) =>
        set((s) => ({ tasks: s.tasks.filter((x) => !(x.done && (listId === 'all' || x.list === listId))) })),
      addList: (name) =>
        set((s) => {
          const palette = ['green', 'rose', 'cyan', 'blue', 'amber', 'violet'];
          return { lists: [...s.lists, { id: uid(), name: name.trim(), color: palette[s.lists.length % palette.length] }] };
        }),

      // ---- calendar
      addEvent: (ev) =>
        set((s) => ({ events: [...s.events, { id: uid(), ...ev }], activity: withLog(s, 'event', 'Scheduled', ev.title) })),
      deleteEvent: (id) => set((s) => ({ events: s.events.filter((x) => x.id !== id) })),

      // ---- habits
      addHabit: (h) =>
        set((s) => ({
          habits: [...s.habits, { id: uid(), log: {}, createdAt: new Date().toISOString(), ...h }],
          activity: withLog(s, 'habit', 'Started', h.name),
        })),
      toggleHabit: (id, key) =>
        set((s) => {
          const h = s.habits.find((x) => x.id === id);
          if (!h) return {};
          const log = { ...h.log };
          const on = !log[key];
          if (on) log[key] = true;
          else delete log[key];
          return {
            habits: s.habits.map((x) => (x.id === id ? { ...x, log } : x)),
            activity: on && key === keyOf(new Date()) ? withLog(s, 'habit', 'Checked in', h.name) : s.activity,
          };
        }),
      deleteHabit: (id) => set((s) => ({ habits: s.habits.filter((x) => x.id !== id) })),

      // ---- money
      addTx: (t) =>
        set((s) => ({
          tx: [{ id: uid(), ...t }, ...s.tx],
          activity: withLog(s, 'money', t.type === 'income' ? 'Received' : 'Spent', t.note || t.category),
        })),
      deleteTx: (id) => set((s) => ({ tx: s.tx.filter((x) => x.id !== id) })),

      // ---- saved links
      addLink: (l) =>
        set((s) => ({
          links: [{ id: uid(), createdAt: new Date().toISOString(), ...l }, ...s.links],
          activity: withLog(s, 'link', 'Saved', l.title),
        })),
      deleteLink: (id) => set((s) => ({ links: s.links.filter((x) => x.id !== id) })),

      // ---- data
      clearData: () => set({ tasks: [], habits: [], events: [], tx: [], links: [], activity: [], sample: false }),
      exportData: () => {
        const { settings, lists, tasks, habits, events, tx, links, activity } = get();
        return { app: 'glassy-dashboard', version: 1, exportedAt: new Date().toISOString(), settings, lists, tasks, habits, events, tx, links, activity };
      },
      importData: (data) => {
        if (!data || data.app !== 'glassy-dashboard') throw new Error('This file is not a Glassy Dashboard backup.');
        const arr = (v) => (Array.isArray(v) ? v : []);
        set((s) => ({
          settings: { ...s.settings, ...(data.settings ?? {}) },
          lists: arr(data.lists).length ? data.lists : s.lists,
          tasks: arr(data.tasks), habits: arr(data.habits), events: arr(data.events),
          tx: arr(data.tx), links: arr(data.links), activity: arr(data.activity), sample: false,
        }));
      },
    }),
    {
      name: 'glassy-dashboard',
      version: 2,
      // v1 shipped with made-up starter content; drop it so the dashboard starts empty
      migrate: (state, version) =>
        version < 2 && state?.sample
          ? { ...state, tasks: [], habits: [], events: [], tx: [], links: [], activity: [], sample: false }
          : state,
      partialize: ({ settings, lists, sample, weather, tasks, habits, events, tx, links, activity }) => ({
        settings, lists, sample, weather, tasks, habits, events, tx, links, activity,
      }),
    },
  ),
);

// ---------- derived helpers shared by pages ----------

/** Consecutive days ending today (or yesterday when today is still open). */
export function streakOf(habit) {
  let d = startOfDay(new Date());
  if (!habit.log[keyOf(d)]) d = addDays(d, -1);
  let n = 0;
  while (habit.log[keyOf(d)]) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

/** Tasks finished + habit check-ins on a given day key. */
export function doneOn(key, tasks, habits) {
  let n = 0;
  for (const t of tasks) if (t.done && t.doneAt && keyOf(new Date(t.doneAt)) === key) n++;
  for (const h of habits) if (h.log[key]) n++;
  return n;
}

export const sumTx = (tx, type, from, to) =>
  tx.reduce((acc, t) => (t.type === type && t.date >= from && t.date <= to ? acc + t.amount : acc), 0);
