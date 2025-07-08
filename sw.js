const CACHE_NAME = 'vakratund-attendance-cache-v1';
const URLS_TO_CACHE = [
  '/VdtdpAttendance/',
  '/VdtdpAttendance/index.html',
  '/VdtdpAttendance/manifest.json',
  '/VdtdpAttendance/icon.svg',
  '/VdtdpAttendance/icon3.svg'
  // Add more assets as needed
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(URLS_TO_CACHE))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request).then(fetchResponse => {
        if (!fetchResponse || fetchResponse.status !== 200 || (fetchResponse.type !== 'basic' && fetchResponse.type !== 'cors')) {
          return fetchResponse;
        }
        const responseToCache = fetchResponse.clone();
        if(event.request.method === 'GET') {
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
        }
        return fetchResponse;
      }))
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
});
