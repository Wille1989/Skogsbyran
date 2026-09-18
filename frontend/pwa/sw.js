// Replaced by Vite with a content version and an exact build asset allowlist.
const CACHE = 'skogsbyran-static-__CACHE_VERSION__';
const ASSETS = __STATIC_ASSETS__;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(
    ASSETS.map(url => new Request(url, { cache: 'reload', credentials: 'omit' }))
  )));
});

// Use the normal waiting lifecycle: never replace a worker beneath an open app.
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith('skogsbyran-static-') && key !== CACHE)
      .map(key => caches.delete(key))
  )));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  // HTML, API traffic, authenticated requests, mutations and third-party resources
  // stay on the network. Only exact, query-free static build URLs are eligible.
  if (request.method !== 'GET' || request.mode === 'navigate' ||
      request.headers.has('Authorization') || url.origin !== self.location.origin ||
      url.search || !ASSETS.includes(url.pathname)) return;

  event.respondWith(caches.open(CACHE).then(async cache =>
    (await cache.match(request)) || fetch(request)
  ));
});
