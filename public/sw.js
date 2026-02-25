const CACHE_VERSION = 'v2-stage4';
const APP_SHELL_CACHE = `hbc-controls-shell-${CACHE_VERSION}`;
const DATA_CACHE = `hbc-controls-data-${CACHE_VERSION}`;
const BINARY_CACHE = `hbc-controls-binary-${CACHE_VERSION}`;
const OFFLINE_FALLBACK = '/offline.html';

// Stage 4 (sub-task 2): Workbox-style precache list using native SW APIs.
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  OFFLINE_FALLBACK,
];

const SP_API_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour hard max for stale reads

function addCacheTimestamp(response) {
  const headers = new Headers(response.headers);
  headers.set('x-sw-cached-at', Date.now().toString());
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function isCacheStale(response, maxAgeMs) {
  const ts = response.headers.get('x-sw-cached-at');
  if (!ts) return true;
  const parsed = parseInt(ts, 10);
  if (Number.isNaN(parsed)) return true;
  return Date.now() - parsed > maxAgeMs;
}

async function fetchWithTimeout(request, timeoutMs) {
  return Promise.race([
    fetch(request),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Network timeout')), timeoutMs)),
  ]);
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then(async (cache) => {
      for (const url of PRECACHE_URLS) {
        try {
          await cache.add(url);
        } catch {
          // Keep install resilient; missing optional assets should not fail install.
        }
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => ![APP_SHELL_CACHE, DATA_CACHE, BINARY_CACHE].includes(k))
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Auth endpoints remain network-only.
  if (url.hostname.includes('login.microsoftonline.com') || url.hostname.includes('login.microsoft.com')) {
    return;
  }

  // Stage 4 (sub-task 2): Network-first for SharePoint/Graph GET with stale fallback.
  if ((url.hostname.includes('sharepoint.com') || url.hostname.includes('graph.microsoft.com')) && request.method === 'GET') {
    event.respondWith(
      fetchWithTimeout(request, 4000)
        .then((response) => {
          if (response && response.ok) {
            caches.open(DATA_CACHE).then((cache) => cache.put(request, addCacheTimestamp(response.clone())));
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(DATA_CACHE);
          const cached = await cache.match(request);
          if (cached && !isCacheStale(cached, SP_API_MAX_AGE_MS)) {
            return cached;
          }
          return caches.match(OFFLINE_FALLBACK);
        })
    );
    return;
  }

  // Mutations (POST/PATCH/DELETE) remain network-only.
  if ((url.hostname.includes('sharepoint.com') || url.hostname.includes('graph.microsoft.com')) && request.method !== 'GET') {
    return;
  }

  // Binary payloads: cache-first.
  if (url.pathname.match(/\.(jpg|jpeg|png|gif|pdf|webp)$/i) || url.pathname.includes('/attachments/') || url.pathname.includes('/signatures/')) {
    event.respondWith(
      caches.open(BINARY_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response && response.ok) {
          cache.put(request, response.clone());
        }
        return response;
      })
    );
    return;
  }

  // App shell: stale-while-revalidate.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.open(APP_SHELL_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const networkPromise = fetch(request)
          .then((response) => {
            if (response && response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(async () => cached || caches.match(OFFLINE_FALLBACK));

        return cached || networkPromise;
      })
    );
  }
});

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
