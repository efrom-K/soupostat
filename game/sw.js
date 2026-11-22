const cachePrefix = 'soupostat:' + self.registration.scope + ':';
const cacheName = cachePrefix + '2.0.0';
const files = [
  'index.html',
  'icons.js',
  'traits.js',
  'engine.js',
  'scene.js',
  'app.js',
  'style.css',
  'manifest.webmanifest',
  'assets/fridge.webp',
  'assets/icon-192.png',
  'assets/icon-512.png',
  'assets/fonts/neucha.ttf',
  'assets/fonts/nunito.ttf',
];
self.addEventListener('install', (event) =>
  event.waitUntil(caches.open(cacheName).then((cache) => cache.addAll(files))),
);
self.addEventListener('activate', (event) =>
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys())
        if (name.startsWith(cachePrefix) && name !== cacheName) await caches.delete(name);
      await self.clients.claim();
    })(),
  ),
);
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || !request.url.startsWith(self.registration.scope)) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(cacheName);
      const local = await cache.match(request.mode === 'navigate' ? 'index.html' : request);
      return local || fetch(request);
    })(),
  );
});
