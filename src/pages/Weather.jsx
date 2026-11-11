import { useState } from 'react';
import { motion } from 'motion/react';
import { RefreshCw, Thermometer, Droplets, Wind, Umbrella, Sunrise, Sunset, MapPin, Search, CloudOff } from 'lucide-react';
import { CardTitle, Empty, Glass, IconButton, PageHeader, Sparkline, stagger } from '../components/ui';
import { useStore } from '../store';
import { describe, searchCity } from '../lib/weather';
import { timeAgo } from '../lib/date';

export function CitySearch({ className = '' }) {
  const setSettings = useStore((s) => s.setSettings);
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);
  const [state, setState] = useState('idle'); // idle | loading | error

  const submit = async (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    setState('loading');
    try {
      setResults(await searchCity(q.trim()));
      setState('idle');
    } catch {
      setResults(null);
      setState('error');
    }
  };
  const pick = (c) => {
    setSettings({ city: c });
    setQ('');
    setResults(null);
  };

  return (
    <form onSubmit={submit} className={`relative ${className}`}>
      <Search size={14} className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-white/45" />
      <input
        className="field !rounded-full" style={{ paddingLeft: 34 }} placeholder="Change city — type and press Enter"
        value={q} onChange={(e) => { setQ(e.target.value); setResults(null); }}
      />
      {(results || state !== 'idle') && (
        <div className="glass absolute inset-x-0 top-[46px] z-20 !rounded-[18px] p-1.5" style={{ '--glass-tint': 0.7 }}>
          {state === 'loading' && <p className="px-3 py-2 text-[12px] text-white/55">Searching…</p>}
          {state === 'error' && <p className="px-3 py-2 text-[12px] text-rose-300">Search failed. Check your connection and try again.</p>}
          {results?.length === 0 && <p className="px-3 py-2 text-[12px] text-white/55">No city found with that name.</p>}
          {results?.map((c) => (
            <button key={`${c.lat},${c.lon}`} type="button" onClick={() => pick(c)} className="flex w-full items-center gap-2.5 rounded-[12px] px-3 py-2 text-left hover:bg-white/[0.1]">
              <MapPin size={13} className="shrink-0 text-white/50" />
              <span className="min-w-0 flex-1 truncate text-[12px] text-white">{c.name} <span className="text-white/45">· {c.region}</span></span>
            </button>
          ))}
        </div>
      )}
    </form>
  );
}

const hhmm = (iso) => iso.slice(11, 16);

export default function Weather({ refreshWeather, weatherError }) {
  const weather = useStore((s) => s.weather);
  const city = useStore((s) => s.settings.city);
  const [spinning, setSpinning] = useState(false);

  const refresh = async () => {
    setSpinning(true);
    await refreshWeather();
    setTimeout(() => setSpinning(false), 600);
  };

  const cur = weather?.current;
  const W = cur ? describe(cur.code, cur.isDay) : null;
  const today = weather?.daily?.[0];
  const hours = weather?.hourly?.slice(0, 12) ?? [];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" exit="exit">
      <PageHeader
        title="Weather"
        subtitle={weatherError ? `Could not update: ${weatherError}` : weather ? `${city.name}${city.region ? `, ${city.region}` : ''} · updated ${timeAgo(new Date(weather.at).toISOString())}` : 'Loading the forecast…'}
      >
        <CitySearch className="w-[300px] max-md:min-w-0 max-md:flex-1" />
        <IconButton icon={RefreshCw} label="Refresh forecast" onClick={refresh} className={spinning ? 'animate-spin' : ''} />
      </PageHeader>

      {!weather && (
        <Glass className="p-5">
          <Empty icon={CloudOff} title={weatherError ? 'No forecast available' : 'Fetching the forecast…'} hint={weatherError ? 'Check your internet connection, then press refresh.' : 'This only takes a moment.'} />
        </Glass>
      )}

      {weather && (
        <div className="m-stack grid grid-cols-4 gap-[18px]">
          <Glass className="col-span-2 flex h-[300px] flex-col justify-between p-6 max-md:h-[260px] max-md:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="flex items-center gap-1.5 text-[13px] text-white/65"><MapPin size={13} /> {city.name}</p>
                <p className="mt-2 text-[76px] font-light leading-[80px] tracking-[-0.04em] text-white">{Math.round(cur.temp)}°</p>
                <p className="mt-1 text-[15px] font-medium text-white">{W.label}</p>
                {today && <p className="mt-0.5 text-[12px] text-white/50">High {Math.round(today.max)}° · Low {Math.round(today.min)}°</p>}
              </div>
              <motion.div
                initial={{ scale: 0.6, opacity: 0, rotate: -12 }} animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 160, damping: 14, delay: 0.3 }}
                className="mr-2 mt-1 text-white drop-shadow-[0_10px_30px_rgba(147,197,253,0.55)]"
              >
                <W.Icon className="max-md:size-20" size={112} strokeWidth={1.1} />
              </motion.div>
            </div>
            {today && (
              <div className="flex gap-5 text-[12px] text-white/65">
                <span className="flex items-center gap-1.5"><Sunrise size={14} className="text-amber-300" /> {hhmm(today.sunrise)}</span>
                <span className="flex items-center gap-1.5"><Sunset size={14} className="text-orange-300" /> {hhmm(today.sunset)}</span>
              </div>
            )}
          </Glass>

          <div className="col-span-2 grid h-[300px] grid-cols-2 gap-[18px] max-md:h-[250px] max-md:gap-3">
            {[
              { Icon: Thermometer, label: 'Feels like', value: `${Math.round(cur.feels)}°`, tint: 'text-rose-300' },
              { Icon: Droplets, label: 'Humidity', value: `${Math.round(cur.humidity)}%`, tint: 'text-blue-300' },
              { Icon: Wind, label: 'Wind', value: `${Math.round(cur.wind)} km/h`, tint: 'text-emerald-300' },
              { Icon: Umbrella, label: 'Chance of rain', value: `${Math.round(today?.rain ?? 0)}%`, tint: 'text-violet-300' },
            ].map((m) => (
              <Glass key={m.label} lift className="flex flex-col justify-between p-5">
                <m.Icon size={20} className={m.tint} />
                <div>
                  <p className="text-[26px] font-semibold leading-8 tracking-[-0.01em] text-white">{m.value}</p>
                  <p className="text-[11px] text-white/50">{m.label}</p>
                </div>
              </Glass>
            ))}
          </div>

          <Glass className="col-span-4 p-5">
            <CardTitle title="Next 12 hours" subtitle="Temperature and chance of rain">
              <span className="max-md:hidden"><Sparkline data={hours.map((h) => h.temp)} color="#60a5fa" width={150} height={30} /></span>
            </CardTitle>
            <div className="no-scrollbar mt-4 grid grid-cols-12 gap-2 max-md:-mx-5 max-md:flex max-md:overflow-x-auto max-md:px-5">
              {hours.map((h, i) => {
                const d = describe(h.code, h.isDay);
                return (
                  <div key={h.time} className={`tile flex flex-col items-center gap-1.5 px-1 py-3 max-md:min-w-[58px] ${i === 0 ? '!border-blue-400/40 !bg-blue-500/20' : ''}`}>
                    <span className="text-[10px] text-white/55">{i === 0 ? 'Now' : hhmm(h.time)}</span>
                    <d.Icon size={20} strokeWidth={1.6} className="text-white" />
                    <span className="text-[14px] font-semibold text-white">{Math.round(h.temp)}°</span>
                    <span className="text-[10px] text-blue-200/70">{h.rain}%</span>
                  </div>
                );
              })}
            </div>
          </Glass>

          <Glass className="col-span-4 p-5">
            <CardTitle title="7-day forecast" subtitle={city.name} />
            <div className="mt-4 grid grid-cols-7 gap-2.5 max-md:grid-cols-1 max-md:gap-1.5">
              {weather.daily.map((d, i) => {
                const info = describe(d.code, true);
                const date = new Date(`${d.date}T12:00`);
                return (
                  <div key={d.date} className="tile tile-hover flex flex-col items-center gap-2 px-2 py-4 max-md:grid max-md:grid-cols-[52px_28px_minmax(0,1fr)_auto_44px] max-md:gap-2.5 max-md:px-3 max-md:py-2.5">
                    <span className="text-[11px] font-medium text-white/75">{i === 0 ? 'Today' : date.toLocaleDateString('en-GB', { weekday: 'short' })}</span>
                    <info.Icon size={26} strokeWidth={1.5} className="text-white max-md:size-[22px]" />
                    <span className="text-[10px] text-white/50 max-md:truncate max-md:text-[12px]">{info.label}</span>
                    <span className="text-[13px] font-semibold text-white">{Math.round(d.max)}° <span className="font-normal text-white/45">{Math.round(d.min)}°</span></span>
                    <span className="flex items-center gap-1 text-[10px] text-blue-200/70"><Umbrella size={10} /> {d.rain}%</span>
                  </div>
                );
              })}
            </div>
          </Glass>
        </div>
      )}
    </motion.div>
  );
}
