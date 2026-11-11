// Keeps the dashboard the same on every device through one Supabase row per user.
//
// The row holds the whole dashboard (tasks, habits, money, …) plus a revision number.
// A device uploads only if the row is still at the revision it last saw; if another device
// got there first, the two copies are merged item by item (by id) and uploaded again.
// Wallpaper, blur and tint stay per device.
import { createClient } from '@supabase/supabase-js';
import { create } from 'zustand';
import { useStore } from '../store';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const syncConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);
let supabase = syncConfigured ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const TABLE = 'dashboards';
const META_KEY = 'glassy-dashboard-sync';
const DATA_KEYS = ['settings', 'lists', 'tasks', 'habits', 'events', 'tx', 'links', 'activity'];
const DEVICE_SETTINGS = ['background', 'blur', 'tint'];

/** status: off | signed-out | syncing | synced | offline | error */
export const useSync = create(() => ({
  status: syncConfigured ? 'signed-out' : 'off',
  user: null,
  error: null,
  lastSync: null,
}));
const setSync = (patch) => useSync.setState(patch);

// ---------- local bookkeeping ----------
// rev: the server revision this device last saw. dirty: local changes not uploaded yet.
const loadMeta = () => {
  try {
    return { userId: null, rev: 0, dirty: false, ...JSON.parse(localStorage.getItem(META_KEY) || '{}') };
  } catch {
    return { userId: null, rev: 0, dirty: false };
  }
};
let meta = loadMeta();
const saveMeta = () => {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch {
    // storage full or blocked: sync still works for this session
  }
};

// ---------- data shape ----------
const omit = (obj, keys) => Object.fromEntries(Object.entries(obj ?? {}).filter(([k]) => !keys.includes(k)));
const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => obj && k in obj).map((k) => [k, obj[k]]));

/** What gets uploaded: the dashboard without this device's look. */
function snapshot() {
  const s = useStore.getState();
  const data = Object.fromEntries(DATA_KEYS.map((k) => [k, s[k]]));
  data.settings = omit(s.settings, DEVICE_SETTINGS);
  return data;
}

/** Items from `a` win; items only in `b` are added after them. */
const unionById = (a = [], b = []) => {
  const seen = new Set(a.map((x) => x.id));
  return [...a, ...b.filter((x) => !seen.has(x.id))];
};

/** Merge two copies; `winner` decides which side keeps its version of an item edited on both. */
function merge(local, remote, winner) {
  const [a, b] = winner === 'local' ? [local, remote] : [remote, local];
  const out = { settings: { ...b.settings, ...a.settings } };
  for (const k of ['lists', 'tasks', 'habits', 'events', 'tx', 'links']) out[k] = unionById(a[k], b[k]);
  out.activity = unionById(a.activity, b.activity)
    .sort((x, y) => String(y.at).localeCompare(String(x.at)))
    .slice(0, 40);
  return out;
}

let applying = false;
let edits = 0; // bumps on every local change, so an edit made during an upload is not marked as sent
function apply(data) {
  const arr = (v) => (Array.isArray(v) ? v : []);
  const cur = useStore.getState();
  applying = true;
  useStore.setState({
    settings: { ...cur.settings, ...omit(data.settings, DEVICE_SETTINGS), ...pick(cur.settings, DEVICE_SETTINGS) },
    lists: arr(data.lists).length ? data.lists : cur.lists,
    tasks: arr(data.tasks),
    habits: arr(data.habits),
    events: arr(data.events),
    tx: arr(data.tx),
    links: arr(data.links),
    activity: arr(data.activity),
    sample: false,
  });
  applying = false;
}

// ---------- the sync round ----------
async function syncOnce(uid) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const { data: row, error } = await supabase.from(TABLE).select('data, rev').eq('user_id', uid).maybeSingle();
    if (error) throw error;

    if (!row) {
      // first device on this account: upload what is here
      const at = edits;
      const { error: insertError } = await supabase.from(TABLE).insert({ user_id: uid, data: snapshot(), rev: 1 });
      if (insertError?.code === '23505') continue; // another device created it a moment ago
      if (insertError) throw insertError;
      meta = { userId: uid, rev: 1, dirty: edits !== at };
      saveMeta();
      return;
    }

    if (meta.userId !== uid) {
      // this device's first sync with the account: take the account's data, keep anything only found here
      apply(merge(snapshot(), row.data, 'remote'));
      meta = { userId: uid, rev: row.rev, dirty: true };
    } else if (row.rev > meta.rev) {
      if (meta.dirty) apply(merge(snapshot(), row.data, 'local'));
      else apply(row.data);
      meta.rev = row.rev;
    }
    saveMeta();

    if (!meta.dirty) return;

    // upload only if nobody else has written since we read the row
    const at = edits;
    const { data: updated, error: updateError } = await supabase
      .from(TABLE)
      .update({ data: snapshot(), rev: meta.rev + 1, updated_at: new Date().toISOString() })
      .eq('user_id', uid)
      .eq('rev', meta.rev)
      .select('rev');
    if (updateError) throw updateError;
    if (updated?.length) {
      meta.rev = updated[0].rev;
      meta.dirty = edits !== at;
      saveMeta();
      if (meta.dirty) again = true;
      return;
    }
    // lost the race: loop, pull the newer copy and merge
  }
  throw new Error('Another device keeps changing the data. Try again in a moment.');
}

let running = false;
let again = false;
export async function syncNow() {
  const uid = useSync.getState().user?.id;
  if (!supabase || !uid) return;
  if (running) {
    again = true;
    return;
  }
  running = true;
  setSync({ status: 'syncing', error: null });
  try {
    do {
      again = false;
      await syncOnce(uid);
    } while (again);
    setSync({ status: 'synced', lastSync: new Date().toISOString() });
  } catch (err) {
    const offline = !navigator.onLine || /fetch|network/i.test(err?.message ?? '');
    setSync({ status: offline ? 'offline' : 'error', error: offline ? null : err?.message || 'Sync failed.' });
  } finally {
    running = false;
  }
}

// ---------- triggers ----------
let pushTimer = null;
const schedule = (ms) => {
  clearTimeout(pushTimer);
  pushTimer = setTimeout(syncNow, ms);
};

let channel = null;
function listen(uid) {
  channel?.unsubscribe();
  channel = supabase
    .channel(`dashboard-${uid}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLE, filter: `user_id=eq.${uid}` }, (payload) => {
      if ((payload.new?.rev ?? 0) > meta.rev) schedule(200);
    })
    .subscribe();
}

let started = false;
/** `client` is only passed in tests; the app uses the client built from .env.local. */
export function initSync(client = supabase) {
  if (!client || started) return;
  supabase = client;
  started = true;
  if (useSync.getState().status === 'off') setSync({ status: 'signed-out' });

  // every local edit marks the data as changed and uploads it shortly after typing stops
  useStore.subscribe((state, prev) => {
    if (applying || !DATA_KEYS.some((k) => state[k] !== prev[k])) return;
    edits++;
    meta.dirty = true;
    saveMeta();
    if (useSync.getState().user) schedule(1200);
  });

  supabase.auth.onAuthStateChange((event, session) => {
    const user = session?.user ?? null;
    const prevId = useSync.getState().user?.id;
    setSync({ user, ...(user ? {} : { status: 'signed-out', lastSync: null }) });
    if (user && user.id !== prevId) {
      listen(user.id);
      schedule(0);
    }
    if (!user) {
      channel?.unsubscribe();
      channel = null;
    }
  });

  const wake = () => document.visibilityState === 'visible' && schedule(0);
  document.addEventListener('visibilitychange', wake);
  window.addEventListener('online', wake);
  window.addEventListener('focus', wake);
  // safety net in case the live channel drops
  setInterval(() => document.visibilityState === 'visible' && syncNow(), 60 * 1000);
}

// ---------- account ----------
export async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

/** Returns true when the account still needs its email confirmed. */
export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return !data.session;
}

export async function signOut() {
  await syncNow();
  await supabase.auth.signOut();
}
