// Offline cache for the installed web app. Only same-origin GET requests are handled:
// sync (Supabase) and the forecast always go straight to the network.
const CACHE = 'glassy-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const put = async (req, res) => {
  if (res.ok) (await caches.open(CACHE)).put(req, res.clone());
  return res;
};

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  // the page itself: newest version when online, cached copy when offline
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => put(new Request(new URL('./', self.registration.scope)), res))
        .catch(() => caches.match(new URL('./', self.registration.scope))),
    );
    return;
  }

  // hashed build files never change: cache first
  if (url.pathname.includes('/assets/')) {
    event.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => put(req, res))));
    return;
  }

  // everything else (wallpapers, icons): cached copy now, refresh in the background
  event.respondWith(
    caches.match(req).then((hit) => {
      const fresh = fetch(req).then((res) => put(req, res)).catch(() => hit);
      return hit || fresh;
    }),
  );
});
