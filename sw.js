const CACHE = 'zfs-0.5.0';
const ASSETS = ['./', 'index.html', 'plan.html', 'review.html', 'css/app.css', 'js/app.js', 'js/plan-page.js', 'js/review-page.js', 'js/core/targets.js', 'js/core/grains.js', 'js/core/fat.js', 'js/core/protein.js', 'js/core/store.js', 'js/core/plan.js', 'js/core/fiber.js', 'js/core/weight.js', 'js/core/review.js', 'data/foods.js', 'data/foods2.js', 'data/foods3.js', 'data/recipes.js', 'manifest.webmanifest', 'icon.svg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => { if (r.ok && r.type === 'basic') { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); } return r; }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
});
