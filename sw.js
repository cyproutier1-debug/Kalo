// Service worker : réseau d'abord (toujours la dernière version en ligne), cache en secours hors connexion.
// Incrémente VERSION à chaque mise à jour.
const VERSION = 'kalo-v1.3.1';
const ASSETS = ['./', './index.html', './styles.css', './app.js', './foods.js', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './vendor/zxing-browser.min.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION)
    .then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return; // Open Food Facts : réseau direct
  const key = req.mode === 'navigate' ? './index.html' : req;
  e.respondWith(
    fetch(req, { cache: 'no-cache' })
      .then(r => { if (r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(key, copy)); } return r; })
      .catch(() => caches.match(key, { ignoreSearch: true }).then(hit => hit || caches.match('./index.html')))
  );
});
