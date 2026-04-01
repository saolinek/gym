const CACHE_VERSION = '1.8.1'; // Keep in sync with APP_VERSION in js/data.js
const CACHE_NAME = `gym-app-v${CACHE_VERSION}`;
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './stats.html',
  './manifest.json',
  './pwa/icon-192.png',
  './pwa/icon-512.png',
  './js/app.js',
  './js/data.js',
  './js/firebase.js',
  './js/plan.js',
  './js/history.js',
  './js/charts.js',
  './js/calendar.js',
  './js/settings.js'
];

self.addEventListener('install', (event) => {
  console.log('[SW] Installing new version:', CACHE_VERSION);
  // Force activation of new service worker
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip Firebase and external CDN requests - let them go to network
  const url = new URL(request.url);
  if (url.origin !== location.origin) {
    return;
  }

  // Network-first for HTML and JS files (critical for updates)
  const isAppFile = url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.js') ||
    url.pathname === '/' ||
    url.pathname.endsWith('/');

  if (isAppFile) {
    // Network-first strategy for app files
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Network failed, fall back to cache
          return caches.match(request);
        })
    );
  } else {
    // Cache-first for other assets (images, etc.)
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        return cachedResponse || fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        });
      })
    );
  }
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating new version:', CACHE_VERSION);
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName.startsWith('gym-app-')) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    }).then(() => {
      // Notify all clients about the update
      return self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SW_UPDATED', version: CACHE_VERSION });
        });
      });
    })
  );
});
