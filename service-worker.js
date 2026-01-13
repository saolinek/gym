const CACHE_VERSION = '1.4.3';
const CACHE_NAME = `gym-app-v${CACHE_VERSION}`;
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './pwa/icon-192.png',
  './pwa/icon-512.png',
  './js/app.js',
  './js/data.js',
  './js/firebase.js',
  './js/plan.js',
  './js/history.js',
  './js/charts.js',
  './js/calendar.js'
];

self.addEventListener('install', (event) => {
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

  // Stale-while-revalidate for app assets
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          // Only cache valid responses
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // Network failed, return cached or nothing
          return cachedResponse;
        });

        // Return cached response immediately, update in background
        return cachedResponse || fetchPromise;
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName.startsWith('gym-app-')) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});
