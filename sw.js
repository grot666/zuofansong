// Must equal 'zfs-' + VERSION in js/core/version.js (test/version.test.js).
const CACHE = 'zfs-0.10.53';
const ASSETS = ['./', 'index.html', 'plan.html', 'review.html', 'css/app.css', 'js/app.js', 'js/boot.js', 'js/ui.js', 'js/views/today.js', 'js/views/me.js', 'js/views/plate.js', 'js/views/foods.js', 'js/views/rice.js', 'js/views/veg.js', 'js/plan-page.js', 'js/review-page.js', 'js/core/version.js', 'js/core/profile.js', 'js/core/portion.js', 'js/core/dates.js', 'js/core/retention.js', 'js/core/sauces.js', 'js/core/scores.js', 'js/nav.js', 'js/core/foods.js', 'js/core/sleep.js', 'js/core/breaks.js', 'js/core/targets.js', 'js/core/grains.js', 'js/core/fat.js', 'js/core/protein.js', 'js/core/store.js', 'js/core/plan.js', 'js/core/tuna.js', 'js/core/social.js', 'js/core/plan/select.js', 'js/core/plan/portion.js', 'js/core/plan/fiber.js', 'js/core/plan/day.js', 'js/core/plan/budget.js', 'js/core/plan/shopping.js', 'js/core/fiber.js', 'js/core/weight.js', 'js/core/review.js', 'data/foods.js', 'data/foods2.js', 'data/foods3.js', 'data/recipes.js', 'data/sauces.js', 'data/prices.js', 'manifest.webmanifest', 'icon.svg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
const put = (req, r) => { if (r && r.ok && r.type === 'basic') { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return r; };
const timeout = (ms, p) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    // Network-first (3 s), then cached page, then index.html fallback — navigations only.
    e.respondWith(timeout(3000, fetch(req)).then(r => put(req, r)).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
    return;
  }
  // Assets: stale-while-revalidate; never fall back to HTML.
  const net = fetch(req).then(r => put(req, r));
  e.waitUntil(net.catch(() => {}));
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || net.catch(() => Response.error())));
});
