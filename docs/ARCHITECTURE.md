# 做饭松 — Architecture

Status: reflects `main` at e2c4d2b (v0.3.0, plan page). Owner of this doc: architecture bot. Code changes are tracked as BACKLOG items `A*`.

## 1. Principles
- Static GitHub Pages, plain HTML/CSS/ES modules, **no build step**, no runtime deps, no network calls except same-origin assets.
- **Pure logic in `js/core/`** (no `document`, `window`, `alert`, `localStorage` except in `store.js` via an injectable backend). Everything in `js/core` and `data/` must import cleanly under `node --test`.
- **UI modules** (`js/app.js`, `js/plan-page.js`) only: read state, call core, render HTML strings, bind events.
- Data modules (`data/*.js`) are JS (not JSON) so they work offline and in Node without fetch (see DECISIONS 04:00).

## 2. Module layout (current → target)
```
index.html            SPA shell, hash routes #today #plate #veg #rice #foods #me
plan.html             weekly plan + shopping list (separate page, same storage)
sw.js                 service worker
manifest.webmanifest, icon.svg, .nojekyll
css/app.css
js/app.js             UI: views.{me,foods,rice,plate,veg,today}   (28 KB — split, see A6)
js/plan-page.js       UI: plan page
js/core/
  targets.js          BMR/TDEE, macro targets, warnings, fastLossWarning, projectedBodyFat
  grains.js           blend(): raw/cooked macros, yield, water ratio, soak list
  fat.js              fatWallet(), TSP_OIL_G
  protein.js          proteinGap(), gutRisk()
  plan.js             generateWeek(), shoppingList(), checkWeek(), COOKED_TO_RAW
  store.js            culiang.v1.* storage, migrate, export/import/reset
  [target] profile.js DEFAULT_PROFILE + normalizeProfile()  (A4)
  [target] foods.js   buildFoodIndex(custom) -> Map; totals(items, food)  (A5)
  [target] version.js VERSION + CHANGELOG, shared by app, plan page, sw  (A3)
data/foods.js, foods2.js, recipes.js
test/core.test.js, plan.test.js  [target] store.test.js, sw.test.js, data.test.js
.github/workflows/ci.yml  [target] (A1)
```
Dependency rule: `UI -> core -> data`. Core never imports UI; data imports nothing.

Duplications to remove (found in review):
- `DEFAULT_PROFILE` exists in both `app.js` and `plan-page.js` and **differs** (plan page lacks bodyFatPct/proteinPerFfm/usesPowder…) → targets can differ between pages if the user never saved a profile.
- `food(id)` (linear `find` over ~100+ items, rebuilt every call in app.js) and `totals()` live in UI; plan.js has its own `sum()`. One core implementation.
- Local-date helper duplicated (`today()` / `localDate()`).

## 3. Storage schema — `localStorage`, prefix `culiang.v1.`
All access through `js/core/store.js` (`get/set` JSON, try/catch). Keys in use today:

| key | shape | written by |
|---|---|---|
| `version` | int, schema version (currently 1) | store.migrate |
| `profile` | partial profile object, merged over DEFAULT_PROFILE | me |
| `weights` | `[{date:'YYYY-MM-DD', weight:kg}]` sorted asc, one per date | me |
| `customFoods` | `[{id:'c<ts>', name, cat:'自定义', kcal, protein, fat, carbs, fiber, verified:false, source:'用户'}]` | foods |
| `log.YYYY-MM-DD` | `{items:[{id, g, t}], water:ml}` (g = grams as eaten; cooked ids for cooked foods) | today, plate, veg, plan |
| `recents` | `[foodId]` max 12 | today |
| `riceCurrent` | `{grainId: pct}` | rice |
| `riceFavs` | `[{grainId: pct}]` | rice |
| `planSeed` | int | plan |
| `weeklyBudget` | CNY number, default 300 | plan |

Rules:
1. New keys must be added to this table and to `KNOWN_KEYS` in store.js (A2).
2. Values are plain JSON; dates are local `YYYY-MM-DD` (Asia/Shanghai user, device-local).
3. Food references are by stable `id`; **never rename a food id** without a migration that rewrites `log.*`, `recents`, `riceFavs`.
4. The `v1` in the prefix is the namespace, not the schema version. Schema changes bump `version` and add a migration; the prefix stays `culiang.v1.` unless we need a destructive reset.

### Migrations (A2)
```js
export const MIGRATIONS = { 1: s => {}, 2: s => { /* e.g. rename food id */ } }; // key = target version
export function migrate(backend) { let v = get('version', 0); while (v < SCHEMA_VERSION) { v++; MIGRATIONS[v](api); set('version', v); } }
```
- Each migration is idempotent and pure over a store API, so it can be unit-tested with an in-memory backend.
- `migrate()` runs once at startup in **every** page (plan page currently does not call it).
- Before running a migration with version ≥2, write `backup.preMigration` = exportAll() (overwritten each time).

### Backup format
Export: `{app:'zuofansong', schema: version, exportedAt: ISO, data:{key:value}}`. Import accepts this envelope and the legacy bare object (v0.3.0 exports), rejects unknown/unsafe keys, refuses `schema` > SCHEMA_VERSION, then runs migrate(). Import replaces (after confirm) rather than merges for `log.*` dates it contains.

### Errors
`store.set` returns false on failure and emits a `storage-error` event; **UI** shows the message (no `alert()` inside core — it throws in Node and blocks tests).

## 4. Service worker (A7)
Current `sw.js`: precache list, `CACHE='zfs-<ver>'` hand-written, network-first for **all** GETs, caches every response (incl. 404/opaque), offline fallback to `index.html` for any miss.

Target strategy:
- `CACHE = 'zfs-' + VERSION` imported from the same version source (A3); CI test asserts sw cache name == app VERSION.
- Navigations (`request.mode==='navigate'`, *.html): **network-first** with ~3 s timeout → cache → `index.html` fallback only for navigations.
- Same-origin static assets (js/css/data/icons): **stale-while-revalidate** (fast offline start; new version lands via cache-name bump).
- Only cache `response.ok && response.type==='basic'`. Ignore cross-origin.
- `install`: precache ASSETS; a CI test asserts every ASSETS path exists on disk and every `js/**`, `data/**` file is in ASSETS (missing one breaks offline; a wrong one breaks install).
- Keep `skipWaiting()+clients.claim()`; register SW from **both** pages.

## 5. Testing (A1, A8)
- `npm test` = `node --test test/` (Node 20+). No deps.
- Unit: everything in js/core. Data integrity: unique ids, numeric macros, recipes ≤5 ingredients incl. oil, kcal ≈ 4P+4C+9F within 15% (flag outliers), price ≥0, `verified` boolean, `source` present.
- Store: in-memory backend injected (`store.useBackend(mapLike)`), tests for get/set/quota/migrate/export/import/reset.
- Static checks in CI: `node --check` every .js; sw ASSETS consistency; VERSION consistency.
- Optional smoke (when Playwright is available): load each hash route + plan.html at 360 px, fail on console error.

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
| weekly plan | kcal±5%, protein | **weekly budget not enforced by generator**, determinism per seed, ingredient reuse, multiple targets (1500/2200 kcal) |
| storage/migrations | none | all (A2) |

## 6. CI / Pages (A1)
- `.github/workflows/ci.yml`: on push + PR to main; `actions/setup-node@v4` node 20; `node --check` all js; `node --test test/`.
- Pages: branch deploy from `main` `/` (enable once with `gh api -X POST repos/grot666/zuofansong/pages -f 'source[branch]=main' -f 'source[path]=/'`). No build workflow needed; CI is a gate the engineer checks (`gh run list`) before declaring an iteration done. Branch protection is out of scope (PROMPT §0.5).
