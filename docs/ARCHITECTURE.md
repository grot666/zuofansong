# 做饭松 — Architecture

Status: reflects `main` at be96ed1 (v0.8.7). Owner of this doc: architecture bot. Code changes are tracked as BACKLOG items `A*`.
Reviews: 6ab7969 (v0.6.1) · 2f32a1a (v0.6.2: A17–A22 opened) · 836ac40 (v0.7.1: A23–A27 opened) · **be96ed1 (v0.8.7, 2026-10-15 ~06:05 SGT: A23–A27 + G1–G4 + UX-4…14 verified shipped, 123/123 tests local; new → A28–A32, §10)**.

## 1. Principles
- Static GitHub Pages, plain HTML/CSS/ES modules, **no build step**, no runtime deps, no network calls except same-origin assets.
- **Pure logic in `js/core/`** (no `document`, `window`, `alert`, `localStorage` except in `store.js` via an injectable backend). Everything in `js/core` and `data/` must import cleanly under `node --test`.
  - Since A24 (v0.7.4) `core/foods.js` imports `data/foods*.js` + `data/prices.js` for `foodIndexFromStore(S)`. That is the **only** core function allowed to pick data lists itself; every other core function takes `food` as a parameter so tests can inject a tiny index.
- **Browser glue in `js/boot.js`** (✅ v0.6.0): the only shared module allowed to touch `document`/`navigator`.
- **UI modules** (page entries, later `js/views/*`) only: read state, call core, render HTML strings, bind events.
- Data modules (`data/*.js`) are JS (not JSON) so they work offline and in Node without fetch (DECISIONS 04:00).
- **Every page entry does the same boot:** `bootStore()` → render → `registerSW()` (✅ v0.6.0, enforced by `test/version.test.js`).

## 2. Module layout @v0.8.7 (A6 ✅, A22 ✅, A24 ✅)
```
index.html            SPA shell, hash routes #today #plate #veg #rice #foods #me (+ A20 non-module escape hatch)
plan.html             weekly plan; in-page sections #menu #list #prep (UX-7)
review.html           每周复盘
sw.js                 service worker (CACHE = 'zfs-' + VERSION)
manifest.webmanifest, icon.svg, .nojekyll, css/app.css (--nav-h + safe-area padding, UX-5)
js/boot.js            bootStore(), toast(msg,{action,ms}), shouldShowUpdate (UX-8), getProfile(), registerSW()
js/nav.js             NAV (5 items, UX-11), COOK_TOOLS sub-nav, navHtml/navHref/markNav — shared by all 3 pages (UX-4)
js/app.js             index router only (2.5 KB): hash → views[name].{view(), view.bind()}
js/ui.js              index page context: food() / allFoods() / refreshFoods() via foodIndexFromStore, profile(), getLog/setLog, today(), PRESET_TEMPLATES
js/views/             today (16 KB), me (12 KB), foods, rice, plate, veg
js/plan-page.js       plan page (planWeek, mealScores, regenWeek undo toast)
js/review-page.js     review page (weekReview, plateauAdvice, decision radio → reviews / profile / breakState)
js/core/
  version.js   VERSION + CHANGELOG          profile.js  DEFAULT_PROFILE, normalizeProfile, paceCheck, parseProfileForm, saveProfile (UX-6), onboardStep/saveOnboardStep (UX-10)
  store.js     culiang.v1.* + migrations    foods.js    makeIndex({base,partials}), foodIndexFromStore, totals, priceOf, COOKED_TO_RAW, quickChips (UX-12), gramsFor, matchFoods
  dates.js     localDate/addDays/dayNum, backupDue (G3), todayIndex (UX-7)
  plan.js      selectWeek, portionDay (A25 cap + ADDONS + powderAddons G2), planWeek, applyBudget, shoppingList, checkWeek, feasibility, regenWeek (UX-9)
  scores.js    mealScores (G1)              review.js   weekReview, plateau / plateauAdvice (R-10 R8), reviewDue (UX-4), lastNDates
  protein.js   proteinGap, gutRisk, proteinFill (UX-13)     fiber.js  suggestFiber (N-04 R8)
  retention.js compact/compactStore (A11, A26)   breaks.js, sleep.js, portion.js, targets.js, grains.js, fat.js, weight.js, sauces.js
data/foods.js, foods2.js, foods3.js (137 foods), recipes.js (34), sauces.js, prices.js
test/  30 files, 123 tests @v0.8.7
.github/workflows/ci.yml  node --check + node --test on push/PR
```
Dependency rule: `UI (pages, views, ui.js, nav.js) → boot → core → data`. Core never imports boot/UI; data imports nothing.

Remaining duplication / drift (A30):
- `views/today.js`, `views/veg.js`, `views/rice.js` still import `makeIndex` and `FOODS/FOODS2/FOODS3` but never call them (dead imports left by A24). Harmless at runtime, but they invite a second hand-built index again.
- `review.js` `plateau`/`plateauAdvice` parse dates with `new Date(str)` while `reviewDue` uses `dayNum`. Both are UTC midnight, so results agree today; use `dayNum` everywhere.

## 3. Storage schema — `localStorage`, prefix `culiang.v1.`
All access through `js/core/store.js` (`get/set` JSON, try/catch). `SCHEMA_VERSION = 2`. Keys @v0.6.2:

| key | shape | written by |
|---|---|---|
| `version` | int schema version (2) | store.migrate, store.importAll |
| `profile` | partial profile, normalized via `normalizeProfile` on read | me, review (deficitPct), boot (break restore) |
| `weights` | `[{date:'YYYY-MM-DD', weight:kg}]` sorted asc, one per date | me |
| `customFoods` | `[{id:'c<ts>', name, cat:'自定义', tags, kcal, protein, fat, carbs, fiber, verified:false, source:'用户'}]` | foods |
| `log.YYYY-MM-DD` | `{items:[{id, g, t}], water:ml}` (g as eaten; cooked ids for cooked foods) | today, plate, veg, plan |
| `recents` | `[foodId]` max 12 | today |
| `riceCurrent` / `riceFavs` | `{grainId: pct}` / `[{grainId: pct}]` | rice |
| `planSeed` | int | plan |
| `weeklyBudget` | CNY number, default 300 | plan |
| `templates` | `[{id:'u<ts>', name, items:[[foodId, g]]}]` (presets p1..p3 in code) | plate |
| `templateUse` | `{templateId: count}` | today |
| `tplMult` | 0.5 \| 1 \| 1.5 | today |
| `undo` | `{date, from, name}` or null | today |
| `reviews` | `{'YYYY-MM-DD': {decision, note}}` | review |
| `breakState` | `{from: deficitPct, until:'YYYY-MM-DD'}` or absent | review (start), boot (clears after until) |
| `breakFrom` | **legacy ≤v0.5.0**; removed by migration 2; kept in KNOWN_KEYS only so old backups import | — |
| `backup.preMigration` | export envelope, one copy, overwritten per migration; **not** exported/importable | store.migrate |
| `logArchive.YYYY-MM` | `{date: {kcal,protein,fat,carbs,fiber,cost,water,n}}` daily totals for logs >180 d (A11, v0.6.6) | core/retention.compactStore on index load |
| `backup.preImport` | export envelope taken before a replace-import; restored by 撤销上次导入 (A17, v0.6.4); not exported | store.importAll / undoImport |
| `prices` | `{foodId: CNY per 500 g}` user overrides (v0.6.7) | foods |
| `wRange` | weight chart weeks 4 \| 8 \| 12 \| 0 (all) (v0.6.8) | me |
| `lastExport` | 'YYYY-MM-DD' of the last JSON export (G3, v0.7.9) | me, today |
| `backupSnooze` | 'YYYY-MM-DD' until which the backup hint is hidden (G3) | today |
| `updateSeen` | VERSION whose update toast was already shown (UX-8, v0.8.4) | all pages |
| `foodUse` | {id: count} quick-add use counts for chips (UX-12, v0.8.6) | today, foods |
| `onboardStep` | 2–3, onboarding step to resume after reload; removed on skip/完成 (A29, v0.9.0) | today |
| `onboardSeen` | bool, hides 示例目标 card (UX-1, v0.6.9) | today |
| `sauceOff` | `[sauceId]` excluded from rotation (R-11b, v0.7.0) | plan |

Rules:
1. New keys go in this table **and** `KNOWN_KEYS` (import drops unknown keys; `log.*`/`logArchive.*` are regex-matched).
2. Plain JSON; dates are device-local `YYYY-MM-DD`.
3. Food references are by stable `id`; **never rename a food id** without a migration rewriting `log.*`, `recents`, `riceFavs`, `templates`, `templateUse`.
4. `v1` in the prefix is a namespace, not the schema version.
5. Writers of `profile` read-modify-write the **stored** object (`S.get('profile', {})`) via `mergeProfileEdit`, never the normalized one (A21 ✅; UX-6 `saveProfile` and UX-10 `saveOnboardStep` follow it).
6. Use-count / preference keys (`foodUse`, `templateUse`, `updateSeen`, `lastExport`, `backupSnooze`) are exported and imported like everything else. Keys that describe *this device's* state are not; today that is only `backup.*`.

### Migrations ✅ (A2, A13)
- `MIGRATIONS = {1: noop, 2: ({today}) => breakFrom → breakState}`; `migrate({today})` loops `version+1 … SCHEMA_VERSION`.
- Upgrading from ≥1 first writes `backup.preMigration`; **if that write fails, migrate returns early without bumping `version`** (A13b ✅).
- Each migration idempotent; tested with `memoryBackend`.
- ✅ A18 (v0.6.4): the abort and non-persistent storage are surfaced by `bootStore()`.

### Backup / import ✅ (A13, A17, A26)
Export envelope `{app:'zuofansong', schema, exportedAt, data}` (skips `backup.*`). Import = replace mode: validate → `backup.preImport` = exportAll() (abort if that write fails) → reset → whitelisted keys → version capped at SCHEMA_VERSION → migrate. 撤销上次导入 restores `backup.preImport`. `compactStore` skips while `backup.preImport` exists (A26). Export stamps `lastExport` (G3).

### Errors / persistence ✅ (A18)
`set()` returns false + emits `storage-error`; boot shows the banner, including migrate-abort and memory-backend fallback.

## 4. Service worker @v0.8.7 (A7, A15, A20 ✅)
- `CACHE === 'zfs-' + VERSION` (tested); install precaches ASSETS with `new Request(u, {cache:'reload'})` + `skipWaiting`; activate deletes other caches + `clients.claim`.
- Navigations: network-first 3 s → cached page (ignoreSearch) → `index.html`. Assets: stale-while-revalidate kept alive with `waitUntil`; miss + offline → `Response.error()`, never HTML. Only `ok && basic` cached.
- `sw.test.js` enforces disk ⊆ ASSETS ⊆ disk, no dups (A15) — it caught `js/nav.js` and `js/core/scores.js` in v0.8.x.
- A20 escape hatch: a non-module inline script in each page offers 清除离线缓存并重新加载 (unregisters SW, deletes caches, never touches localStorage).
- Update toast (UX-8): shown once per new version; `updateSeen` stores the version already shown.

## 5. Weekly plan @v0.8.7 (A9, A16, A19, A23, A25, G1, G2, UX-9 ✅)
```
selectWeek(food, recipes, {seed, proteins, dinnerProteins}) → skeleton[7] {day, bf, pDinner, pLunch=dinner(d-1), staple, vegL, vegD}
portionDay(skel, {kcal, protein}, food, {powderScoops}) → {day, meals, tot, proteinG, stapleG, bfMult, kiwiG, addon, fit}
generateWeek / planWeek(t, food, recipes, {seed, budget, powderScoops}) → {week, cost, overBudget, swaps, infeasible}
regenWeek({seed}) → {seed: seed+1, prevSeed: seed}   // the week is a pure function of (targets, seed, opts); undo = restore prevSeed
```
- Search (A19 closed-form): knobs BF_MULTS(4) × KIWI_G(3) × add-ons (12 whole-food + 2 per powder scoop) × staple g 30…350 step 10; protein g solved directly and capped at `MAX_PROTEIN_G_PER_MEAL = 300` (A25; tofu × `PORTION_MULT` 1.5). Score = protein shortfall × 1e6 + |kcal − target| + knob penalties (bf/kiwi × 5, add-on index × 8), so add-ons are tried in list order and powder comes last (G2).
- Cost: every path prices via `priceOf(food, id)` on the raw purchase (A23); today/plate `totals().cost` uses the same function (A27).
- Measured @be96ed1: `planWeek({1800,140}, budget 150, powderScoops 2)` ≈ 40 ms in Node 20 (box). Fine on a phone today, but the search grows linearly with add-ons; see A32.
- `fit` values: `ok` | `kcal-high` | `kcal-low` | `protein-high` (⚠ misnamed, means protein **short**; A28).
- Lunch/dinner show `mealScores` (G1, same function as the plate view).

## 6. Testing (A1, A8 ✅)
- `npm test` = `node --test test/` (Node 20+, no deps), CI on push/PR. **123 tests in 30 files @v0.8.7**, all pass on a clean clone (06:03 SGT).
- Unit tests per core module; feature tests are named after their backlog id (`a23`, `g1`…`g3`, `r8`, `ux4`…`ux14`), which makes "is X covered" a filename lookup.
- Data (`data.test.js`): ids, source/verified, kcal≈4P+4C+9F, recipe ingredients exist, UX-14 wrist rule (no 拍/剁/砸/颠锅 unless `wristSafe:false` + `wristNote`).
- Store/keys: migrations, envelope, replace-import + undo, persistence, KNOWN_KEYS ↔ §3 table (`keys.test.js`, A14).
- Text-level: `version.test.js` (CACHE/VERSION, boot order, SW fallback), `sw.test.js` (ASSETS), `ux4.test.js` (shared nav, `viewport-fit=cover`).
- Gaps: no DOM-level test for index views (onboarding flow across reload, see A29); no perf guard for the plan search (A32); `mealScores` only checked for range/shape (A31).

### §4 coverage map
| PROMPT §4 item | test today | gap |
|---|---|---|
| BMR/TDEE | bmr male | female BMR, TDEE × each activity factor |
| macro targets | bw/fixed/ffm, fat floor, normalizeProfile({}) ≡ defaults | kcal<BMR warning, BMI≥30 goal weight, protein clamp 1.2–2.0 |
| pace | R6.1 fixtures A–G ✅ | — |
| grain blend | single-grain yield | multi-grain weighted yield, non-100% sums, needsSoak, waterRatio |
| raw/cooked | rice cooked→raw | every COOKED_TO_RAW entry round-trip; cooked protein ids priced via raw |
| fat wallet | basic | over-budget (left<0), neutral bucket |
| protein gap | cap | zero gap, scoopG=0 guard |
| gut risk | high | low case, monotonic in fiber |
| weekly plan | ±5%/protein @default, split≡generateWeek, R6.3 fixture, planweek invariants (seeds × budgets @1800/140) ✅ | **feasibility grid other targets (A19)**, determinism per seed |
| weekly review | 6 tests | ±10% boundary, lowFatPct, plateau rising, window edges, month-end |
| sleep / break / portion | R6.2, A12, N-03 ✅ | break started mid-week + user edits deficit during break |
| storage/migrations | store.test.js ✅ incl. A13 | A17 import cases, A18 persistence detection |

## 7. CI / Pages
- `.github/workflows/ci.yml` ✅: push to main + PR; Node 20; `node --check` every tracked js; `node --test test/`.
- Pages: branch deploy from `main` `/` (enabled 05:03). CI is the gate; engineer checks it before declaring an iteration done.
- Hygiene: an accidental nested clone `zuofansong/` was untracked and git-ignored in 6ab7969; `node --check $(git ls-files)` is unaffected.

## 8. Decisions log (architecture)
- Legacy import with no `version` = schema 1 so all migrations run (A13a ✅).
- `migrate()` must not bump the version if the pre-migration backup can't be written (A13b ✅) — **and the user must be told** (A18).
- Import is **replace**, not merge, with `backup.preImport` first; version from backup capped at SCHEMA_VERSION for envelope **and** legacy (A17).
- SW precache bypasses the HTTP cache; every page has a non-module escape hatch that clears SW caches but never localStorage (A20).
- Plan generator never silently misses its band: `portionDay` reports `fit`, `planWeek` reports `infeasible` + reason; protein floor still wins over kcal (A19).
- Sequence: A18 → A17 → A20 → A21 → A22 → A6 (one view per commit, veg first, today last).

## 9. Pricing model and review @836ac40 (v0.7.1)
- **Precedence:** food estimate (`priceCNYPer500g` in data/foods*.js) < official ref (`data/prices.js` PRICE_REFS, carries `priceSource`/`priceDate`) < user override (`prices` key → `priceOverrides`). Partials never create foods.
- **Cooked vs raw (A23):** plan/shopping costs use the raw ingredient via `COOKED_TO_RAW [rawId, k]`. A user override on a cooked id must flow through `priceOf()` as a raw-equivalent of `cookedPrice × k`. Today it is ignored by planWeek and budget swaps.
- **Single builder (A24):** pages must call `foodIndexFromStore(S)`, not hand-assemble the `makeIndex` argument list.
- **Protein portion cap (A25):** per-meal cooked protein is capped by an exported constant pinned by tests. Extra protein comes from an add-on slot (yogurt/egg/tofu/powder) before the meat portion grows.
- **Retention (A11, A26):** `compactStore` on index load. Measured on 400 days / ~170 KB: 7 ms first run, ~3 ms steady. It should skip while `backup.preImport` exists.
- New storage keys since §8: `prices` ({id: CNY/500g}), `logArchive.YYYY-MM`, `backup.preImport`. `keys.test.js` (A14) keeps §3 in sync.

## 10. Review @be96ed1 (v0.8.7, 2026-10-15 ~06:05 SGT)
Verified shipped: A23 (`priceOf`, cooked-id overrides reach plan/budget), A24 (`makeIndex({base,partials})`, `foodIndexFromStore` used by ui.js and plan-page), A25 (300 g cap + add-ons), A26 (compaction skip during import undo), A27; G1–G4; UX-4…UX-14. 123/123 tests.
Design decisions recorded this round:
- **Week = f(targets, seed, opts).** No stored week; 换一套 undo restores `planSeed` (UX-9). Any future plan state (locked meals, manual swaps) must be stored as an explicit override list on top of the seed, never as a stored week, so undo and determinism still hold.
- **Onboarding progress must survive a reload** (A29). Session-only `obStep` is not enough because step 1 already writes `profile`.
- **Views get foods only through `ui.js` / `foodIndexFromStore`** (A30, enforced by a text test).
- **Taste/ease heuristics live in data, not in `scores.js`** (A31), so adding a food never needs a code edit.
New items: A28–A32 in BACKLOG.md.
