/* Buck frontend-minimal: installability-only service worker.
 * Transparent fetch only. Do not precache Vite module graph or HMR in development.
 * Full offline caching is a separate production design.
 */
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  event.respondWith(fetch(event.request));
});
