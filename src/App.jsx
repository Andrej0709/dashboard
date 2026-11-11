import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import TopBar from './components/TopBar';
import Sidebar, { BottomNav } from './components/Sidebar';
import EventModal from './components/EventModal';
import Home from './pages/Home';
import Tasks from './pages/Tasks';
import Calendar from './pages/Calendar';
import Habits from './pages/Habits';
import Finance from './pages/Finance';
import Weather from './pages/Weather';
import Saved from './pages/Saved';
import Settings from './pages/Settings';
import { BACKGROUNDS, useStore } from './store';
import { fetchWeather } from './lib/weather';
import { useAppHeight, useMobile } from './lib/useMobile';

const PAGES = { home: Home, tasks: Tasks, calendar: Calendar, habits: Habits, finance: Finance, weather: Weather, saved: Saved, settings: Settings };
const IS_DESKTOP = navigator.userAgent.includes('Electron');
const CUSTOM_BG_KEY = 'glassy-dashboard-custom-bg';

export const readCustomBg = () => {
  try {
    return localStorage.getItem(CUSTOM_BG_KEY);
  } catch {
    return null;
  }
};
export const writeCustomBg = (dataUrl) => localStorage.setItem(CUSTOM_BG_KEY, dataUrl);

/** Re-renders every 20 s so the clock, greeting and "now" markers stay current. */
function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 20000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export default function App() {
  const [page, setPage] = useState('home');
  const [railHidden, setRailHidden] = useState(false);
  const [eventFor, setEventFor] = useState(null); // date key while the "new event" dialog is open
  const [customBg, setCustomBg] = useState(readCustomBg);
  const now = useNow();
  const mobile = useMobile();
  const appHeight = useAppHeight();

  const settings = useStore((s) => s.settings);
  const setWeather = useStore((s) => s.setWeather);
  const [weatherError, setWeatherError] = useState(null);

  const go = useCallback((id) => setPage(id), []);
  const openEvent = useCallback((dateKey) => setEventFor(dateKey), []);

  // Forecast: refresh on launch, when the city changes, and every 20 minutes.
  // A failed request (offline, slow start) is retried after 30 seconds.
  const { lat, lon } = settings.city;
  const refreshWeather = useCallback(async () => {
    try {
      setWeather(await fetchWeather({ lat, lon }));
      setWeatherError(null);
      return true;
    } catch (err) {
      setWeatherError(err.message || 'Could not reach the weather service.');
      return false;
    }
  }, [lat, lon, setWeather]);
  useEffect(() => {
    let timer;
    let stopped = false;
    const run = async () => {
      const ok = await refreshWeather();
      if (!stopped) timer = setTimeout(run, ok ? 20 * 60 * 1000 : 30 * 1000);
    };
    run();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [refreshWeather]);

  const bg = BACKGROUNDS.find((b) => b.id === settings.background);
  const bgUrl = settings.background === 'custom' && customBg ? customBg : `${import.meta.env.BASE_URL}${(bg ?? BACKGROUNDS[0]).file}`;
  const top = IS_DESKTOP ? 40 : mobile ? 10 : 20;
  const Page = PAGES[page] ?? Home;

  const mainRef = useRef(null);
  // a new page starts at the top (after the old one has faded out)
  const resetScroll = useCallback(() => mainRef.current?.scrollTo(0, 0), []);

  return (
    <div
      className="relative h-full overflow-hidden"
      style={{
        height: appHeight,
        '--glass-blur': `${settings.blur}px`,
        '--glass-tint': settings.tint / 100,
        '--rail-left': mobile ? '16px' : 'clamp(20px, 5.5vw, 80px)',
        '--edge-left': mobile ? '16px' : 'clamp(96px, 13vw, 188px)',
        '--edge-right': mobile ? '16px' : 'clamp(28px, 7.6vw, 110px)',
        '--safe-top': 'env(safe-area-inset-top, 0px)',
      }}
    >
      {/* wallpaper */}
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${bgUrl}")` }} />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(12,9,7,0.5) 0%, rgba(12,9,7,0.12) 20%, rgba(12,9,7,0.06) 60%, rgba(12,9,7,0.34) 100%)' }}
      />

      <TopBar page={page} go={go} top={top} mobile={mobile} railHidden={railHidden} toggleRail={() => setRailHidden((v) => !v)} />
      {mobile ? <BottomNav page={page} go={go} /> : <Sidebar page={page} go={go} hidden={railHidden} />}

      <main
        ref={mainRef}
        className="no-scrollbar absolute inset-x-0 bottom-0 overflow-y-auto overflow-x-hidden"
        style={{
          top: `calc(var(--safe-top) + ${top + (mobile ? 50 : 56)}px)`,
          paddingLeft: railHidden || mobile ? 'var(--rail-left)' : 'var(--edge-left)',
          paddingRight: 'var(--edge-right)',
          transition: 'padding-left 0.35s cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        <div
          className={mobile ? 'pt-2' : 'pb-12 pt-3'}
          style={mobile ? { paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)' } : undefined}
        >
          <AnimatePresence mode="wait" onExitComplete={resetScroll}>
            <Page
              key={page}
              go={go}
              now={now}
              openEvent={openEvent}
              refreshWeather={refreshWeather}
              weatherError={weatherError}
              customBg={customBg}
              setCustomBg={(dataUrl) => {
                writeCustomBg(dataUrl);
                setCustomBg(dataUrl);
              }}
            />
          </AnimatePresence>
        </div>
      </main>

      <EventModal open={eventFor !== null} date={eventFor} onClose={() => setEventFor(null)} />
    </div>
  );
}
