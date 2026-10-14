const CACHE = 'zfs-0.2.0';
const ASSETS = ['./', 'index.html', 'css/app.css', 'js/app.js', 'js/core/targets.js', 'js/core/grains.js', 'js/core/fat.js', 'js/core/protein.js', 'js/core/store.js', 'data/foods.js', 'data/foods2.js', 'data/recipes.js', 'manifest.webmanifest', 'icon.svg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
});
