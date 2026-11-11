import { useEffect, useState } from 'react';

const QUERY = '(max-width: 767px)';

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
