const PREFIX = new Set(['$', '€', '£', '¥', '₹']);

const trim = (n) => {
  const s = n.toFixed(1);
  return s.endsWith('.0') ? s.slice(0, -2) : s;
};

/** 48200 -> "48.2k", 1250000 -> "1.3M", 950 -> "950" */
export const compact = (n) => {
  const a = Math.abs(n);
  if (a >= 1e6) return `${trim(a / 1e6)}M`;
  if (a >= 1e4) return `${trim(a / 1e3)}k`;
  return Math.round(a).toLocaleString('en-US');
};

/** Money with the user's currency. `full` keeps every digit. */
export const money = (n, cur = '$', { full = false, sign = false } = {}) => {
  const body = full ? Math.round(Math.abs(n)).toLocaleString('en-US') : compact(n);
  const s = n < 0 ? '−' : sign && n > 0 ? '+' : '';
  return PREFIX.has(cur) ? `${s}${cur}${body}` : `${s}${body} ${cur}`;
};

export const pct = (part, whole) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

export const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || '?';

export const domainOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

export const COLORS = {
  blue: { hex: '#60a5fa', solid: '#3b82f6', soft: 'rgba(59,130,246,0.24)' },
  amber: { hex: '#fbbf24', solid: '#f59e0b', soft: 'rgba(245,158,11,0.24)' },
  green: { hex: '#34d399', solid: '#10b981', soft: 'rgba(16,185,129,0.24)' },
  violet: { hex: '#a78bfa', solid: '#8b5cf6', soft: 'rgba(139,92,246,0.26)' },
  rose: { hex: '#fb7185', solid: '#f43f5e', soft: 'rgba(244,63,94,0.24)' },
  cyan: { hex: '#22d3ee', solid: '#06b6d4', soft: 'rgba(6,182,212,0.24)' },
};
export const COLOR_KEYS = Object.keys(COLORS);
export const colorOf = (key) => COLORS[key] ?? COLORS.blue;
