/**
 * PhyxCalc Web Service Worker.
 * Caches core app shell, web worker, and assets for seamless offline operation.
 * Dynamically resolves URLs relative to scope to support GitHub Pages subpaths.
 */

const CACHE_NAME = 'phyxcalc-v1.0.0';

self.addEventListener('install', (event) => {
  const scope = self.registration.scope;
  const precacheUrls = [
    new URL('./', scope).href,
    new URL('./index.html', scope).href,
    new URL('./manifest.json', scope).href,
    new URL('./icon.svg', scope).href,
  ];

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(precacheUrls);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// User-approved update listener
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const scope = self.registration.scope;
  const indexUrl = new URL('./index.html', scope).href;
  const rootUrl = new URL('./', scope).href;

  // HTML navigation requests: Network first with cached index.html offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(indexUrl) || caches.match(rootUrl);
      })
    );
    return;
  }

  // Static assets and scripts: Cache-first with background update
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        if (
          response &&
          response.status === 200 &&
          (response.type === 'basic' || response.type === 'cors')
        ) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      }).catch(() => {
        // Fallback for missing offline image or asset
        return caches.match(new URL('./icon.svg', scope).href);
      });
    })
  );
});
