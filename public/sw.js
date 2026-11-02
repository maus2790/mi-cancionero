const CACHE_NAME = 'tu-cancionero-v2';
const APP_SHELL = ['/offline.html', '/manifest.json', '/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const request = event.request;
  const url = new URL(request.url);

  // Next.js ya gestiona sus recursos de desarrollo. Cachearlos rompe HMR y
  // puede dejar las navegaciones pendientes cuando una petición de red falla.
  if (
    url.origin !== self.location.origin ||
    self.location.hostname === 'localhost' ||
    self.location.hostname === '127.0.0.1' ||
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/api/')
  ) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)));
          }
          return response;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match('/offline.html')) || Response.error())
    );
    return;
  }

  event.respondWith(caches.match(request).then(async (cached) => {
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)));
      }
      return response;
    } catch {
      return Response.error();
    }
  }));
});
