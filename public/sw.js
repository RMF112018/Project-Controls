const CACHE_VERSION = 'v1'; // Bump on each production deploy
const CACHE_NAME = `hbc-controls-${CACHE_VERSION}`;
const BINARY_CACHE = `hbc-binary-${CACHE_VERSION}`; // Separate cache for photos/signatures

const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Install: pre-cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(APP_SHELL_URLS.filter(url => !url.includes('/icons/')))
        .catch(() => { /* icons may not exist yet — ignore */ })
    )
  );
  self.skipWaiting();
});

// Activate: clean up old caches (previous CACHE_VERSION entries)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== BINARY_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch strategy routing table:
//  1. SharePoint REST / Graph API  → Network-first (stale-while-revalidate for GET)
//  2. Binary assets (photos/sigs)  → Cache-first, network fallback, store in BINARY_CACHE
//  3. App shell (same origin)      → Cache-first, network fallback, offline.html on error
//  4. MSAL login.microsoftonline   → Network-only (auth must be live)
//  5. Everything else              → Network-only
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const method = event.request.method;

  // Rule 4: MSAL / AAD — always network-only (never cache auth endpoints)
  if (url.hostname.includes('login.microsoftonline.com') ||
      url.hostname.includes('login.microsoft.com')) {
    return; // Let browser handle natively
  }

  // Rule 1: SharePoint REST / Graph writes (POST/PATCH/DELETE) — network-only
  if ((url.hostname.includes('sharepoint.com') || url.hostname.includes('graph.microsoft.com'))
      && method !== 'GET') {
    return; // OfflineQueueService handles retry — SW does not intercept mutations
  }

  // Rule 1: SharePoint REST / Graph reads (GET) — network-first, cache fallback
  if (url.hostname.includes('sharepoint.com') || url.hostname.includes('graph.microsoft.com')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          return response;
        })
        .catch(() =>
          caches.match(event.request).then((r) => r ?? caches.match('/offline.html'))
        )
    );
    return;
  }

  // Rule 2: Binary assets — image/pdf uploads from QC forms
  if (url.pathname.match(/\.(jpg|jpeg|png|gif|pdf|webp)$/i) ||
      url.pathname.includes('/attachments/') ||
      url.pathname.includes('/signatures/')) {
    event.respondWith(
      caches.open(BINARY_CACHE).then((cache) =>
        cache.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request).then((response) => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
      )
    );
    return;
  }

  // Rule 3: App shell (same origin) — cache-first, offline fallback
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) =>
          cached ??
          fetch(event.request).catch(() => caches.match('/offline.html'))
      )
    );
    return;
  }

  // Rule 5: Everything else (CDNs, fonts) — network-only
});

// Message handler: force cache refresh on demand (triggered by app on new deploy)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data && event.data.type === 'CLEAR_BINARY_CACHE') {
    caches.delete(BINARY_CACHE).then(() => {
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ cleared: true });
      }
    });
  }
});
