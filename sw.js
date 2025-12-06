const CACHE_NAME = 'slot-pwa-v1';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './sw.js',
  './icon-192.png',
  './icon-512.png',
  './spin_effect.mp3',
  './spin_music.mp3',
  './win.mp3',
  './lose.mp3',
  './music.mp3'
];

// Инсталиране – кеширане на ресурси
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
});

// Активиране – чистене на стари кешове (ако сменим версията)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// Fetch – първо опит от мрежата, иначе от кеш
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
