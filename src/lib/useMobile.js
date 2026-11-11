import { useEffect, useState } from 'react';

const QUERY = '(max-width: 767px)';

/**
 * Height for the app shell. Opened from the iPhone home screen, iOS reports a viewport that is
 * shorter than the screen by the status bar, which leaves an empty band at the bottom.
 * There the full screen height is used instead; everywhere else this is undefined (CSS 100%).
 */
export function useAppHeight() {
  const read = () => {
    if (!navigator.standalone) return undefined;
    const landscape = window.matchMedia('(orientation: landscape)').matches;
    const full = landscape ? Math.min(screen.width, screen.height) : Math.max(screen.width, screen.height);
    return full > window.innerHeight ? full : undefined;
  };
  const [height, setHeight] = useState(read);
  useEffect(() => {
    const update = () => setHeight(read());
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);
  return height;
}

/** True on phone-sized screens. Matches the max-md: breakpoint and the CSS in index.css. */
export function useMobile() {
  const [mobile, setMobile] = useState(() => window.matchMedia(QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const onChange = () => setMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return mobile;
}
