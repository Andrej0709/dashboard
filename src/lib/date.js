export const pad = (n) => String(n).padStart(2, '0');

/** Local-time YYYY-MM-DD key for a Date. */
export const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayKey = () => keyOf(new Date());

export const parseKey = (k) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Monday of the week containing d. */
export const startOfWeek = (d) => {
  const x = startOfDay(d);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
};

export const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const dowShort = (d) => DOW[(d.getDay() + 6) % 7];
export const fmtLong = (d) => d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
export const fmtShort = (d) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;
export const fmtTime = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

export const greeting = (h) =>
  h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';

/** "Today" / "Tomorrow" / "Yesterday" / "12 Nov" for a date key. */
export const relDay = (key) => {
  const diff = Math.round((parseKey(key) - startOfDay(new Date())) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return fmtShort(parseKey(key));
};

export const timeAgo = (iso) => {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
  return fmtShort(new Date(iso));
};

/** Last n days ending today, oldest first. */
export const lastDays = (n) => {
  const t = startOfDay(new Date());
  return Array.from({ length: n }, (_, i) => addDays(t, i - (n - 1)));
};
