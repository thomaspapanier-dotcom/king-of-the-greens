// Offline support: cache the app shell so KOG works on the course with no signal.
// Bump VERSION whenever app files change so phones pick up the update.
const VERSION = 'kog-v70';
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
  './assets/four-kings.webp',
  './assets/ranked-crest.webp',
  './assets/h2h-banner.webp',
  './assets/duos-banner.webp',
  './assets/casual-lounge.webp',
  './assets/casual-h2h.webp',
  './assets/casual-duos.webp',
  './assets/quickplay-compass.webp',
  './assets/app-bg.webp',
  './assets/splash.webp',
  './assets/store-front.webp',
  './assets/kings/king-s.webp',
  './assets/kings/king-h.webp',
  './assets/kings/king-d.webp',
  './assets/kings/king-c.webp',
  './assets/duos/king-spades.webp',
  './assets/duos/king-diamonds.webp',
  './assets/duos/king-hearts.webp',
  './assets/duos/king-clubs.webp',
  './js/confetti.js',
  './js/avatars.js',
  './js/shop.js',
  './js/cozy-wear.js',
  './js/lfg.js',
  './assets/store/art/fireside.webp',
  './assets/store/art/king-patch.webp',
  './assets/store/art/king-putter.webp',
  './assets/store/art/royal-crest.webp',
  './assets/store/art/spade-patch.webp',
  './assets/store/four-houses-print.webp',
  './assets/store/items/quiggs-raglan-7.webp',
  './assets/store/items/stazz-beanie-white.webp',
  './assets/store/items/mccarthy-argyle-polo.webp',
  './assets/store/logos/mccarthy-1.webp',
  './assets/store/logos/mccarthy-2.webp',
  './assets/store/logos/mccarthy-3.webp',
  './assets/store/logos/mccarthy-4.webp',
  './assets/store/logos/mccarthy-5.webp',
  './assets/store/logos/quiggs-1.webp',
  './assets/store/logos/quiggs-2.webp',
  './assets/store/logos/quiggs-3.webp',
  './assets/store/logos/quiggs-4.webp',
  './assets/store/logos/quiggs-5.webp',
  './assets/store/logos/stazz-1.webp',
  './assets/store/logos/stazz-2.webp',
  './assets/store/logos/stazz-3.webp',
  './assets/store/logos/stazz-4.webp',
  './assets/store/logos/stazz-5.webp',
  './assets/store/logos/stazz-6.webp',
  './assets/store/logos/stazz-7.webp',
  './assets/store/logos/stazz-8.webp',
  './assets/brands/2cozy-green.webp',
  './assets/brands/2cozy-teal.webp',
  './assets/brands/2cozy-cocoa.webp',
  './assets/brands/2cozy-red.webp',
  './assets/brands/2cozy-royal.webp',
  './assets/avatars/king-classic.webp',
  './assets/avatars/king-closer.webp',
  './assets/avatars/king-elder.webp',
  './assets/avatars/king-gentleman.webp',
  './assets/avatars/king-jolly-redhead.webp',
  './assets/avatars/king-showman.webp',
  './assets/avatars/king-smooth-operator.webp',
  './assets/avatars/king-wink.webp',
  './assets/avatars/king-young-gun.webp',
  './assets/avatars/queen-boss.webp',
  './assets/avatars/queen-crowned-afro.webp',
  './assets/avatars/queen-focused.webp',
  './assets/avatars/queen-free-spirit.webp',
  './assets/avatars/queen-matriarch.webp',
  './assets/avatars/queen-radiant.webp',
  './assets/avatars/queen-sharp-shooter.webp',
  './assets/avatars/queen-silver.webp',
  './assets/avatars/queen-sunny.webp',
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
