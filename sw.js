// Offline support: cache the app shell so KOG works on the course with no signal.
// Bump VERSION whenever app files change so phones pick up the update.
const VERSION = 'kog-v36';
const SHELL = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './js/rules.js',
  './js/ops.js',
  './js/quick.js',
  './js/lag.js',
  './js/ranked.js',
  './js/badges.js',
  './js/winrate.js',
  './js/illustrations.js',
  './js/sound.js',
  './assets/eagle.wav',
  './assets/kog-card.webp',
  './assets/king-ranked.webp',
  './assets/casual.webp',
  './assets/green-bg.jpg',
  './assets/kings/king-s.webp',
  './assets/kings/king-h.webp',
  './assets/kings/king-d.webp',
  './assets/kings/king-c.webp',
  './js/confetti.js',
  './js/sync.js',
  './js/auth.js',
  './js/config.js',
  './js/store.js',
  './manifest.webmanifest',
  './icons/favicon-32.png',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

// Network first (so updates arrive when online), cache fallback when offline.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match('./index.html'))),
  );
});
