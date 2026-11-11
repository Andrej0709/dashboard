import { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Download, Upload, Trash2, ImagePlus, Check, MapPin, Cloud, LogIn, LogOut, RefreshCw } from 'lucide-react';
import { signIn, signOut, signUp, syncNow, useSync } from '../lib/sync';
import { timeAgo } from '../lib/date';
import { Button, CardTitle, Field, Glass, Modal, PageHeader, stagger } from '../components/ui';
import { BACKGROUNDS, useStore } from '../store';
import { CitySearch } from './Weather';
import { todayKey } from '../lib/date';
import { initials, money } from '../lib/format';

/** Downscale a picked photo so it fits comfortably in local storage. */
function fileToDataUrl(file, max = 2400) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * k);
      canvas.height = Math.round(img.height * k);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.84));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('That file could not be read as an image.'));
    };
    img.src = url;
  });
}

const SYNC_TEXT = {
  syncing: 'Syncing…',
  offline: "Offline — your changes upload when you're back online.",
  error: 'Sync failed.',
};

function SyncCard() {
  const { status, user, error, lastSync } = useSync();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { ok, text }

  const run = async (fn) => {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
    } catch (err) {
      setMsg({ ok: false, text: err.message || 'Something went wrong.' });
    } finally {
      setBusy(false);
    }
  };
  const valid = email.includes('@') && password.length >= 6;

  return (
    <Glass className="col-span-2 p-5">
      <CardTitle title="Sync across devices" subtitle="Sign in on your computer and your phone to see the same dashboard on both">
        {user && <Cloud size={18} className="shrink-0 text-emerald-300" />}
      </CardTitle>

      {status === 'off' && (
        <p className="mt-4 text-[12px] leading-5 text-white/60">
          Sync is not set up in this build yet. Add your Supabase project URL and key to <code className="text-white/85">.env.local</code>, then build the app again.
        </p>
      )}

      {status !== 'off' && !user && (
        <form
          className="mt-4 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] items-end gap-3 max-md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) run(() => signIn(email.trim(), password));
          }}
        >
          <Field label="Email" className="max-md:col-span-2">
            <input className="field" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </Field>
          <Field label="Password" className="max-md:col-span-2">
            <input className="field" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
          </Field>
          <Button variant="primary" icon={LogIn} type="submit" className={`justify-center ${valid && !busy ? '' : 'opacity-50'}`}>Sign in</Button>
          <Button
            variant="soft" className={`justify-center ${valid && !busy ? '' : 'opacity-50'}`}
            onClick={() => valid && run(async () => {
              const needsConfirm = await signUp(email.trim(), password);
              setMsg({ ok: true, text: needsConfirm ? 'Account created. Open the link in your email, then sign in here.' : 'Account created and signed in.' });
            })}
          >
            Create account
          </Button>
        </form>
      )}

      {user && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1 max-md:basis-full">
            <p className="truncate text-[13px] font-medium text-white">{user.email}</p>
            <p className={`text-[11px] ${status === 'error' || status === 'offline' ? 'text-rose-300' : 'text-white/50'}`}>
              {SYNC_TEXT[status] ?? (lastSync ? `Up to date · synced ${timeAgo(lastSync)}` : 'Up to date')}
              {status === 'error' && error ? ` ${error}` : ''}
            </p>
          </div>
          <Button variant="soft" icon={RefreshCw} onClick={() => syncNow()}>Sync now</Button>
          <Button variant="soft" icon={LogOut} onClick={() => run(signOut)}>Sign out</Button>
        </div>
      )}

      {msg && <p role="status" className={`mt-3 text-[12px] ${msg.ok ? 'text-emerald-300' : 'text-rose-300'}`}>{msg.text}</p>}
    </Glass>
  );
}

function Slider({ label, value, min, max, onChange, suffix = '' }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex justify-between text-[11px] font-medium text-white/55">
        <span>{label}</span>
        <span className="text-white/80">{value}{suffix}</span>
      </span>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-blue-400" />
    </label>
  );
}

export default function Settings({ customBg, setCustomBg }) {
  const settings = useStore((s) => s.settings);
  const sample = useStore((s) => s.sample);
  const signedIn = useSync((s) => Boolean(s.user));
  const { setSettings, exportData, importData, clearData } = useStore.getState();
  const [note, setNote] = useState(null); // { ok, text }
  const [confirm, setConfirm] = useState(false);
  const bgInput = useRef(null);
  const importInput = useRef(null);

  const pickBackground = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setCustomBg(await fileToDataUrl(file));
      setSettings({ background: 'custom' });
      setNote({ ok: true, text: 'Your photo is now the background.' });
    } catch (err) {
      setNote({ ok: false, text: err.name === 'QuotaExceededError' ? 'That photo is too large to store. Try a smaller one.' : err.message });
    }
  };

  const download = () => {
    const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `dashboard-backup-${todayKey()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  const restore = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      importData(JSON.parse(await file.text()));
      setNote({ ok: true, text: 'Backup restored.' });
    } catch (err) {
      setNote({ ok: false, text: err instanceof SyntaxError ? 'That file is not valid JSON.' : err.message });
    }
  };

  const budget = Number(settings.monthlyBudget) || 0;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" exit="exit">
      <PageHeader title="Settings" subtitle="Make the dashboard yours" />

      <div className="m-stack grid grid-cols-2 gap-[18px]">
        <Glass className="relative z-10 p-5">
          <CardTitle title="Profile and place" subtitle="Your name and the city used for the forecast" />
          <div className="mt-4 flex items-center gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-full text-[18px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]" style={{ background: 'linear-gradient(145deg, #fbbf24, #f97316)' }}>
              {initials(settings.name)}
            </span>
            <Field label="Your name" className="flex-1">
              <input className="field" value={settings.name} maxLength={30} onChange={(e) => setSettings({ name: e.target.value })} placeholder="Name" />
            </Field>
          </div>
          <p className="mb-1.5 mt-5 flex items-center gap-1.5 text-[11px] font-medium text-white/55">
            <MapPin size={11} /> Forecast city: <span className="text-white">{settings.city.name}{settings.city.region ? `, ${settings.city.region}` : ''}</span>
          </p>
          <CitySearch />
        </Glass>

        <Glass className="p-5">
          <CardTitle title="Money" subtitle="Currency and monthly budget" />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Field label="Currency symbol or code">
              <input className="field" value={settings.currency} maxLength={4} onChange={(e) => setSettings({ currency: e.target.value })} placeholder="RSD, €, $ …" />
            </Field>
            <Field label="Monthly budget">
              <input
                className="field" inputMode="numeric" value={settings.monthlyBudget}
                onChange={(e) => setSettings({ monthlyBudget: Number(e.target.value.replace(/[^\d]/g, '')) || 0 })}
              />
            </Field>
          </div>
          <p className="mt-2 text-[11px] text-white/45">Shown as {money(budget, settings.currency || '$', { full: true })} per month.</p>
        </Glass>

        <Glass className="col-span-2 p-5">
          <CardTitle title="Background and glass" subtitle="Pick a wallpaper and tune how frosted the panels are" />
          <div className="mt-4 grid grid-cols-4 gap-3 max-md:grid-cols-2">
            {BACKGROUNDS.map((b) => {
              const active = settings.background === b.id;
              return (
                <button key={b.id} type="button" aria-pressed={active} onClick={() => setSettings({ background: b.id })}
                  className={`group relative h-[104px] overflow-hidden rounded-[16px] text-left transition-shadow ${active ? 'shadow-[0_0_0_2px_#fff]' : 'shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)] hover:shadow-[0_0_0_2px_rgba(255,255,255,0.5)]'}`}>
                  <img src={`${import.meta.env.BASE_URL}${b.file}`} alt="" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-6 text-[11px] font-medium text-white">{b.name}</span>
                  {active && <span className="absolute right-2 top-2 grid size-5 place-items-center rounded-full bg-white text-neutral-900"><Check size={12} strokeWidth={3} /></span>}
                </button>
              );
            })}
            <button type="button" onClick={() => (customBg && settings.background !== 'custom' ? setSettings({ background: 'custom' }) : bgInput.current?.click())}
              aria-pressed={settings.background === 'custom'}
              className={`group relative grid h-[104px] place-items-center overflow-hidden rounded-[16px] border border-dashed border-white/25 bg-white/[0.05] text-white/70 transition-colors hover:bg-white/[0.1] hover:text-white ${settings.background === 'custom' ? 'shadow-[0_0_0_2px_#fff]' : ''}`}>
              {customBg && <img src={customBg} alt="" className="absolute inset-0 size-full object-cover" />}
              <span className={`relative flex flex-col items-center gap-1.5 text-[11px] font-medium ${customBg ? 'rounded-full bg-black/55 px-3 py-1.5 text-white' : ''}`}>
                <ImagePlus size={customBg ? 14 : 20} /> {customBg ? (settings.background === 'custom' ? 'Change photo' : 'Use my photo') : 'Use your own photo'}
              </span>
            </button>
            <input ref={bgInput} type="file" accept="image/*" hidden onChange={pickBackground} />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-6 max-md:grid-cols-1 max-md:gap-4">
            <Slider label="Blur" value={settings.blur} min={6} max={48} suffix="px" onChange={(blur) => setSettings({ blur })} />
            <Slider label="Panel darkness" value={settings.tint} min={10} max={70} suffix="%" onChange={(tint) => setSettings({ tint })} />
          </div>
          <p className="mt-3 text-[10px] text-white/35">
            Photos from Unsplash: {BACKGROUNDS.map((b) => `${b.name} by ${b.credit}`).join(' · ')}.
          </p>
        </Glass>

        <SyncCard />

        <Glass className="col-span-2 p-5">
          <CardTitle title="Your data" subtitle={signedIn ? 'Stored on this device and in your account' : 'Everything is stored on this device only'} />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button variant="soft" icon={Download} onClick={download}>Export backup</Button>
            <Button variant="soft" icon={Upload} onClick={() => importInput.current?.click()}>Restore backup</Button>
            <input ref={importInput} type="file" accept="application/json,.json" hidden onChange={restore} />
            <span className="flex-1" />
            <Button variant="danger" icon={Trash2} onClick={() => setConfirm(true)}>{sample ? 'Clear sample data' : 'Delete all data'}</Button>
          </div>
          {note && <p role="status" className={`mt-3 text-[12px] ${note.ok ? 'text-emerald-300' : 'text-rose-300'}`}>{note.text}</p>}
        </Glass>
      </div>

      <Modal open={confirm} onClose={() => setConfirm(false)} title={sample ? 'Clear the sample data?' : 'Delete all data?'} subtitle={`Tasks, events, habits, transactions and saved links will be removed${signedIn ? ' on all your devices' : ''}. Your settings stay.`}>
        <p className="text-[12px] leading-5 text-white/65">This cannot be undone. Export a backup first if you might want any of it back.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="soft" onClick={() => setConfirm(false)}>Keep everything</Button>
          <Button variant="danger" icon={Trash2} onClick={() => { clearData(); setConfirm(false); setNote({ ok: true, text: 'All data cleared. You have a clean slate.' }); }}>Delete</Button>
        </div>
      </Modal>
    </motion.div>
  );
}
