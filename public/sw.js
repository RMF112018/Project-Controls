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

// SP API TTL: serve cached responses for up to 5 min; stale responses evicted after 1 hour
const SP_API_TTL_MS = 5 * 60 * 1000; // 5 minutes (freshness window)
const SP_API_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour (eviction threshold)

/**
 * Clone response and append a custom x-sw-cached-at timestamp header.
 * Used to track freshness of SP API responses without extra storage.
 */
function addCacheTimestamp(response) {
  const headers = new Headers(response.headers);
  headers.append('x-sw-cached-at', Date.now().toString());
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Returns true if the cached response's timestamp exceeds maxAgeMs.
 * Missing timestamp is treated as stale.
 */
function isCacheStale(response, maxAgeMs) {
  const ts = response.headers.get('x-sw-cached-at');
  if (!ts) return true;
  return (Date.now() - parseInt(ts, 10)) > maxAgeMs;
}

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

// Activate: clean up old versioned caches + evict stale SP API entries
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Remove caches from previous CACHE_VERSION
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME && k !== BINARY_CACHE)
            .map((k) => caches.delete(k))
        )
      ),
      // Evict SP API entries older than SP_API_MAX_AGE_MS
      caches.open(CACHE_NAME).then(async (cache) => {
        const requests = await cache.keys();
        await Promise.all(
          requests
            .filter((req) =>
              req.url.includes('sharepoint.com') || req.url.includes('graph.microsoft.com')
            )
            .map(async (req) => {
              const res = await cache.match(req);
              if (res && isCacheStale(res, SP_API_MAX_AGE_MS)) {
                await cache.delete(req);
              }
            })
        );
      }),
    ])
  );
  self.clients.claim();
});

// Fetch strategy routing table:
//  1. SharePoint REST / Graph API  → Network-first (TTL-aware cache fallback)
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

  // Rule 1: SharePoint REST / Graph reads (GET) — network-first, TTL-aware cache fallback
  if (url.hostname.includes('sharepoint.com') || url.hostname.includes('graph.microsoft.com')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, addCacheTimestamp(clone)));
          return response;
        })
        .catch(() =>
          caches.open(CACHE_NAME).then((cache) =>
            cache.match(event.request).then((cached) => {
              if (cached && !isCacheStale(cached, SP_API_MAX_AGE_MS)) {
                // Serve stale response (within 1-hour eviction window)
                return cached;
              }
              // Cache missing or too stale — serve offline fallback
              return caches.match('/offline.html');
            })
          )
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
