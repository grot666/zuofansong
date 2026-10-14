# 做饭松 — Architecture

Status: reflects `main` at 12d5f2e (v0.5.0 每周复盘). Owner of this doc: architecture bot. Code changes are tracked as BACKLOG items `A*`.

## 1. Principles
- Static GitHub Pages, plain HTML/CSS/ES modules, **no build step**, no runtime deps, no network calls except same-origin assets.
- **Pure logic in `js/core/`** (no `document`, `window`, `alert`, `localStorage` except in `store.js` via an injectable backend). Everything in `js/core` and `data/` must import cleanly under `node --test`.
- **UI modules** (page entries) only: read state, call core, render HTML strings, bind events.
- Data modules (`data/*.js`) are JS (not JSON) so they work offline and in Node without fetch (see DECISIONS 04:00).
- **Every page entry does the same 3-step boot:** `S.migrate()` → render → register SW. Today only `app.js` does steps 1 and 3 (A2, A7).

## 2. Module layout (current → target)
```
index.html            SPA shell, hash routes #today #plate #veg #rice #foods #me
plan.html             weekly plan + shopping list (separate page, same storage)
review.html           每周复盘 (v0.5.0, separate page, same storage)
sw.js                 service worker
manifest.webmanifest, icon.svg, .nojekyll
css/app.css
js/app.js             UI: views.{me,foods,rice,plate,veg,today}   (34 KB — split, see A6)
js/plan-page.js       UI: plan page
js/review-page.js     UI: review page (+ decision radio, writes reviews/profile/breakFrom)
js/core/
  targets.js          BMR/TDEE, macro targets, warnings, fastLossWarning, projectedBodyFat
  grains.js           blend(): raw/cooked macros, yield, water ratio, soak list
  fat.js              fatWallet(), TSP_OIL_G
  protein.js          proteinGap(), gutRisk()
  fiber.js            suggestFiber() ranked swaps
  weight.js           ma7(), weeklyStatus()
  review.js           dayTotals(), weekReview(), plateau(), lastNDates(), TUNA
  plan.js             generateWeek(), shoppingList(), checkWeek(), COOKED_TO_RAW
  store.js            culiang.v1.* storage, migrate, export/import/reset
  [target] profile.js DEFAULT_PROFILE + normalizeProfile()  (A4)
  [target] foods.js   buildIndex(builtIn, custom) -> Map; totals(items, food)  (A5)
  [target] version.js VERSION + CHANGELOG (A3 invariants; engineer implements)
  [target] sw-register.js  one-liner used by all page entries (A7)
data/foods.js, foods2.js, foods3.js, recipes.js
test/core.test.js, plan.test.js, fiber-weight.test.js, review.test.js
     [target] store.test.js, sw.test.js, version.test.js, data.test.js
.github/workflows/ci.yml  ✅ node --check + node --test (A1)
```
Dependency rule: `UI -> core -> data`. Core never imports UI; data imports nothing.

Duplications to remove (found in review):
- `DEFAULT_PROFILE`: **3 copies** (app.js full; plan-page.js + review-page.js reduced) → targets can differ between pages for a never-saved user (A4).
- Item totals: **3 copies** — app.js `totals`, plan.js `sum`, review.js `dayTotals` (A5).
- `food(id)` linear find and `localDate()`/`today()` helper in every page entry.

## 3. Storage schema — `localStorage`, prefix `culiang.v1.`
All access through `js/core/store.js` (`get/set` JSON, try/catch). Keys in use @v0.5.0:

| key | shape | written by |
|---|---|---|
| `version` | int, schema version (currently 1) | store.migrate |
| `profile` | partial profile object, merged over DEFAULT_PROFILE | me, review (deficitPct) |
| `weights` | `[{date:'YYYY-MM-DD', weight:kg}]` sorted asc, one per date | me |
| `customFoods` | `[{id:'c<ts>', name, cat:'自定义', kcal, protein, fat, carbs, fiber, verified:false, source:'用户'}]` | foods |
| `log.YYYY-MM-DD` | `{items:[{id, g, t}], water:ml}` (g = grams as eaten; cooked ids for cooked foods) | today, plate, veg, plan |
| `recents` | `[foodId]` max 12 | today |
| `riceCurrent` | `{grainId: pct}` | rice |
| `riceFavs` | `[{grainId: pct}]` | rice |
| `planSeed` | int | plan |
| `weeklyBudget` | CNY number, default 300 | plan |
| `templates` | `[{id:'u<ts>', name, items:[[foodId, g]]}]` (user; presets live in code as p1..p3) | plate |
| `templateUse` | `{templateId: count}` for sort order | today |
| `undo` | `{date, from:index, name}` or null; last bulk-add only | today |
| `reviews` | `{'YYYY-MM-DD': {decision:'keep'\|'minus'\|'steps'\|'break'\|'sauce', note}}` | review |
| `breakFrom` | number (deficitPct before 维持周) — **to be replaced by `breakState {from, until}` (A12)** | review |

Rules:
1. New keys must be added to this table and to `KNOWN_KEYS` in store.js (A2). Import rejects keys not in KNOWN_KEYS (`log.` and `logArchive.` are prefix-matched).
2. Values are plain JSON; dates are local `YYYY-MM-DD` (Asia/Shanghai user, device-local).
3. Food references are by stable `id`; **never rename a food id** without a migration that rewrites `log.*`, `recents`, `riceFavs`, `templates`.
4. The `v1` in the prefix is the namespace, not the schema version. Schema changes bump `version` and add a migration; the prefix stays `culiang.v1.` unless we need a destructive reset.
5. Pages that write `profile` (me, review) must read-modify-write the **stored** object (`S.get('profile', {})`), never the merged-with-defaults one, so defaults can change later. review-page already does this; keep it.

### Migrations (A2)
```js
export const MIGRATIONS = { 1: s => {}, 2: s => { /* e.g. breakFrom -> breakState (A12) */ } }; // key = target version
export function migrate() { let v = get('version', 0); while (v < SCHEMA_VERSION) { v++; MIGRATIONS[v](api); set('version', v); } }
```
- Each migration is idempotent and pure over a store API, so it can be unit-tested with an in-memory backend.
- `migrate()` runs at startup in **every** page entry (plan-page.js and review-page.js currently do not). Alternative accepted: store.js runs migrate lazily on first get/set.
- Before running a migration with version ≥2, write `backup.preMigration` = exportAll() (overwritten each time).
- First real migration candidate: v2 = `breakFrom` → `breakState` (A12).

### Backup format
Export: `{app:'zuofansong', schema: version, exportedAt: ISO, data:{key:value}}`. Import accepts this envelope and the legacy bare object (≤v0.5.0 exports), rejects unknown/unsafe keys, refuses `schema` > SCHEMA_VERSION, then runs migrate(). Import replaces (after confirm) rather than merges for `log.*` dates it contains.

### Errors
`store.set` returns false on failure and emits a `storage-error` event; **UI** shows the message (no `alert()` inside core — it throws in Node and blocks tests).

## 4. Service worker (A7)
Current `sw.js` @v0.5.0: precache list (includes all 3 pages, all js/core, foods3 ✅), `CACHE='zfs-0.5.0'` hand-written, network-first for all GETs, caches only `ok && basic` ✅, offline miss → `index.html` for **any** request. Registered only from `app.js`.

Target strategy:
- `CACHE === 'zfs-' + VERSION` (A3 invariant, tested).
- Navigations (`request.mode==='navigate'`): **network-first** with ~3 s timeout → cache (ignoreSearch) → `index.html`.
- Non-navigation miss: return the network error / 404 — never HTML (HTML for a module script = confusing parse error instead of a clear offline state).
- Same-origin static assets (js/css/data/icons): **stale-while-revalidate**.
- Only cache `response.ok && response.type==='basic'` ✅. Ignore cross-origin.
- `install`: precache ASSETS; `test/sw.test.js` asserts every ASSETS path exists and every `*.html`, `js/**`, `data/**`, `css/**` file is in ASSETS.
- Keep `skipWaiting()+clients.claim()`; **register from every page entry** (plan.html, review.html missing today).

## 5. Weekly plan interface (A9 prerequisite)
Current: `generateWeek(targets, food, recipes, {seed})` does selection (which breakfast/protein/staple/veg per day, lunch = previous dinner) **and** portion scaling (protein +10 g until target, staple ±10 g until ±3% kcal) in one loop. Budget enforcement needs to change selection and re-run scaling, so split first:
```
selectWeek(targets, food, recipes, {seed, proteins}) -> skeleton[7]  {bf, pLunch, pDinner, staple, vegL, vegD}
portionDay(skel, targets, food)                    -> {meals, tot, proteinG, stapleG, dinnerProtein, staple}
generateWeek(...) = selectWeek(...).map(portionDay)  // return shape unchanged
applyBudget(skeleton, food, budget, {maxUsesPerProtein:3}) -> {skeleton, swaps}   // greedy per RESEARCH-R6 §R6.3
planWeek(targets, food, recipes, {seed, budget})  -> {days, list, cost, overBudget, swaps}
```
- Lunch-reuse invariant (lunch(d+1).protein = dinner(d).protein) must survive swaps: swap a protein in dinner(d) **and** lunch(d+1) together.
- plan-page.js calls `planWeek`; `generateWeek` stays for plan.test.js compatibility.
- Cost basis = `shoppingList` (raw grams via COOKED_TO_RAW), so cooked-only protein ids (thighRoasted…) must have a COOKED_TO_RAW entry or a price of their own; add a data test.

## 6. Testing (A1, A8)
- `npm test` = `node --test test/` (Node 20+). No deps. CI runs it on push/PR ✅.
- Unit: everything in js/core. Data integrity: unique ids across foods/foods2/foods3, numeric macros, recipes ≤5 ingredients incl. oil, kcal ≈ 4P+4C+9F within 15% (flag outliers), price ≥0, `verified` boolean, `source` present.
- Store: in-memory backend injected (`store.useBackend(mapLike)`), tests for get/set/quota/migrate/export/import/reset.
- Text-level consistency tests (no DOM needed): sw ASSETS vs disk, CACHE vs VERSION, every page entry contains `migrate(` and SW registration.
- Optional smoke (when Playwright is available): load each hash route + plan.html + review.html at 360 px, fail on console error.

### §4 coverage map
| PROMPT §4 item | test today | gap |
|---|---|---|
| BMR/TDEE | bmr male | female BMR, TDEE × each activity factor |
| macro targets | bw/fixed/ffm, fat floor | calorie-below-BMR warning, BMI≥30 uses goal weight, protein clamp 1.2–2.0 |
| grain blend | single-grain yield | multi-grain weighted yield, non-100% sums, needsSoak, waterRatio |
| raw/cooked | blend only | COOKED_TO_RAW round-trip in shoppingList (exact grams) |
| fat wallet | basic | over-budget (left<0), neutral bucket |
| protein gap | cap | zero gap, scoopG=0 guard |
| gut risk | high | low case, monotonicity (more fiber never raises score) |
| weekly plan | kcal±5%, protein | **budget (A9)**, determinism per seed, lunch-reuse invariant, 1500/2200 kcal |
| weekly review | 6 tests (review.test.js) | ±10% boundary, lowFatPct, plateau on rising weight, window edges, month-end dates |
| fiber / weight | fiber-weight.test.js | — (not re-audited this round) |
| storage/migrations | none | all (A2) |

## 7. CI / Pages (A1)
- `.github/workflows/ci.yml` ✅ (6c3edfb): on push + PR to main; Node 20; `node --check` all js; `node --test test/`.
- Pages: branch deploy from `main` `/` (engineer item 1). No build workflow needed; CI is the gate the engineer checks (`gh run list`) before declaring an iteration done.
