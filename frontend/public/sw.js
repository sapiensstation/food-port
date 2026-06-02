const SHELL_CACHE = 'fv-shell-v1';
const API_CACHE = 'fv-api-v1';

const SHELL_URLS = [
  '/',
  '/order',
  '/order/vendors',
  '/vendor/login',
  '/display',
  '/offline',
];

// Install — cache shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS)).then(() => self.skipWaiting())
  );
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== SHELL_CACHE && k !== API_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin (except our API)
  if (request.method !== 'GET') return;

  // API calls — network-first, short cache fallback
  if (url.pathname.startsWith('/api/') || url.port === '3001') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          // Only cache successful GET responses
          if (res.ok) {
            const clone = res.clone();
            caches.open(API_CACHE).then((cache) => cache.put(request, clone));
          }
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Shell / static — cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((res) => {
        if (res.ok && url.origin === self.location.origin) {
          const clone = res.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(request, clone));
        }
        return res;
      }).catch(() => caches.match('/offline') ?? new Response('Offline', { status: 503 }));
    })
  );
});
