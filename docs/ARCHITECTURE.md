# 做饭松 — Architecture

Status: reflects `main` at c339c0f (v0.10.27). Owner of this doc: architecture bot. Code changes are tracked as BACKLOG items `A*`.
Reviews: 6ab7969 (v0.6.1) · 2f32a1a (v0.6.2: A17–A22) · 836ac40 (v0.7.1: A23–A27) · be96ed1 (v0.8.7: A28–A32) · e99d68d (v0.9.5: A33–A39) · 9390563 (v0.10.10: A40–A46) · **c339c0f (v0.10.27, 2026-10-15 ~07:10 SGT: A40–A46 + R-01/R-11/VER-10/R10-D1/F1/F2/S1 verified; new → A47–A48, A50–A53, §11)**.

## 1. Principles
- Static GitHub Pages, plain HTML/CSS/ES modules, **no build step**, no runtime deps, no network calls except same-origin assets.
- **Pure logic in `js/core/`** (no `document`, `window`, `alert`, `localStorage` except in `store.js` via an injectable backend). Everything in `js/core` and `data/` must import cleanly under `node --test`.
  - Since A24 (v0.7.4) `core/foods.js` imports `data/foods*.js` + `data/prices.js` for `foodIndexFromStore(S)`. That is the **only** core function allowed to pick data lists itself; every other core function takes `food` as a parameter so tests can inject a tiny index.
- **Browser glue in `js/boot.js`** (✅ v0.6.0): the only shared module allowed to touch `document`/`navigator`.
- **UI modules** (page entries, later `js/views/*`) only: read state, call core, render HTML strings, bind events.
- Data modules (`data/*.js`) are JS (not JSON) so they work offline and in Node without fetch (DECISIONS 04:00).
- **Every page entry does the same boot:** `bootStore()` → render → `registerSW()` (✅ v0.6.0, enforced by `test/version.test.js`).

## 2. Module layout @v0.10.27 (A6 ✅, A22 ✅, A24 ✅, A45 ✅)
```
index.html            SPA shell, hash routes #today #plate #veg #rice #foods #me (+ A20 non-module escape hatch)
plan.html             weekly plan; in-page sections #menu #list #prep (UX-7); R-11 trayCard per weekday
review.html           每周复盘 (A42 canDeepen reasons)
sw.js                 service worker (CACHE = 'zfs-' + VERSION); ASSETS includes js/core/plan/{select,portion,budget,shopping}.js
manifest.webmanifest, icon.svg, .nojekyll, css/app.css (--nav-h + safe-area padding, UX-5)
js/boot.js            bootStore(), toast(msg,{action,ms}), shouldShowUpdate (UX-8), getProfile(), registerSW()
js/nav.js             NAV (5 items, UX-11), COOK_TOOLS sub-nav, navHtml/navHref/markNav
js/app.js             index router only (~1.6 KB): hash → views[name].{view(), view.bind()}
js/ui.js              index page context: foodIndexFromStore, profile(), getLog/setLog, today(), PRESET_TEMPLATES
js/views/             today, me, foods, rice, plate, veg (A30: no data/foods* or makeIndex imports)
js/plan-page.js       plan page (planWeek, mealScores, regenWeek undo toast, maxPrepMin, trayPlan)
js/review-page.js     review page (weekReview, plateauAdvice, canDeepen → reviews / profile / breakState)
js/core/
  version.js   VERSION + CHANGELOG          profile.js  DEFAULT_PROFILE, normalizeProfile, paceCheck, parseProfileForm, saveProfile, onboardStep/saveOnboardStep (A29)
  store.js     culiang.v1.* + migrations + afterImport (A41)    foods.js  makeIndex({base,partials}), foodIndexFromStore, totals, priceOf, COOKED_TO_RAW, quickChips, gramsFor, matchFoods
  dates.js     localDate/addDays/dayNum, backupDue (G3), todayIndex
  plan.js      A45 re-export facade → plan/{select,portion,budget,shopping}.js (+ COOKED_TO_RAW)
  plan/select.js   BREAKFASTS/PROTEINS/STAPLES, rankVeg/rankProteins, pickReuse (A40/A46), selectWeek
  plan/portion.js  portionDay, generateWeek, FITS (A28), ADDONS, powderAddons, feasibility, tuna gates (A33)
  plan/budget.js   applyBudget, planWeek (R9-1 real-cost loop, A34 unfit, budget-revert)
  plan/shopping.js shoppingList, checkWeek, regenWeek, planTips, meatNote, parseBudget, distinctVeg
  scores.js    mealScores (G1)              review.js   weekReview, plateau / plateauAdvice, reviewDue, TUNA (⚠ imported by plan/portion — see A50)
  protein.js   proteinGap, gutRisk, proteinFill     fiber.js  suggestFiber (N-04)
  retention.js compact/compactStore (A11, A26)   breaks.js, sleep.js, portion.js, targets.js (canDeepen A42), grains.js, fat.js, weight.js, sauces.js (trayPlan R-11)
data/foods.js, foods2.js, foods3.js (~137 foods), recipes.js (34), sauces.js, prices.js
test/  ~61 files @v0.10.27 (serial in CI; +r10f1/r10s1)
.github/workflows/ci.yml  node --check + node --test --test-concurrency=1 on push/PR
```
Dependency rule: `UI (pages, views, ui.js, nav.js) → boot → core → data`. Core never imports boot/UI; data imports nothing.
Plan split (A45): UI and tests keep importing `js/core/plan.js`; implementation lives under `js/core/plan/*.js`. SW ASSETS lists both the facade and the four split files (A15).

Remaining coupling / drift (open A*):
- `plan/portion.js` imports `TUNA` from `review.js` (A50): plan should not depend on review.
- `selectWeek` with zero usable proteins crashes in `portionDay` (A47, same class as A40).
- R10-S1 merged USDA twins in `shoppingList` via private `twinOf`/`TWIN` — still not exported next to `COOKED_TO_RAW` (A53).
- `plan/portion.js` grew to 125 lines after R10-F1 (A45 AC was <100 / file) — fiber preference belongs in its own module (A53 companion / see A53).
- Dead comment block at end of `plan/portion.js` still documents `applyBudget` (A52).

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
| `maxPrepMin` | 0/5/10, plan veg prep-time limit (R9-10, v0.10.5) | plan |
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

## 4. Service worker @v0.10.27 (A7, A15, A20 ✅)
- `CACHE === 'zfs-' + VERSION` (tested); install precaches ASSETS with `new Request(u, {cache:'reload'})` + `skipWaiting`; activate deletes other caches + `clients.claim`.
- Navigations: network-first 3 s → cached page (ignoreSearch) → `index.html`. Assets: stale-while-revalidate kept alive with `waitUntil`; miss + offline → `Response.error()`, never HTML. Only `ok && basic` cached.
- `sw.test.js` enforces disk ⊆ ASSETS ⊆ disk, no dups (A15) — caught `js/nav.js` / `js/core/scores.js` in v0.8.x and the four `js/core/plan/*.js` files at A45.
- A20 escape hatch: a non-module inline script in each page offers 清除离线缓存并重新加载 (unregisters SW, deletes caches, never touches localStorage).
- Update toast (UX-8): shown once per new version; `updateSeen` stores the version already shown.

## 5. Weekly plan @v0.10.27 (A9, A16, A19, A23, A25, A33–A46, G1, G2, UX-9, R9-10, PERF-1 ✅)
```
selectWeek(food, recipes, {seed, proteins, dinnerProteins, maxPrepMin, reuse}) → skeleton[7] {day, bf, pDinner, pLunch=dinner(d-1), staple, vegL|null, vegD|null}
portionDay(skel, {kcal, protein}, food, {powderScoops, noTuna, addonUse}) → {day, meals, tot, proteinG, stapleG, bfMult, kiwiG, addon, fit}
generateWeek / planWeek(t, food, recipes, {seed, budget, powderScoops, maxPrepMin, revert}) → {week, cost, overBudget, swaps, infeasible, unfit}
regenWeek({seed}) → {seed: seed+1, prevSeed: seed}   // week = f(targets, seed, opts); undo = restore prevSeed
```
- Search (A19 closed-form + PERF-1): knobs BF_MULTS(4) × KIWI_G(3) × add-ons (whole-food list + 2 per powder scoop) × staple g 30…350 step 10; protein g solved directly and capped at `MAX_PROTEIN_G_PER_MEAL = 300` (A25; tofu × `PORTION_MULT` 1.5). Zero-staple base is precomputed per part (veg/bf/kiwi/addon) so planWeek median is ~5–7 ms. Score = protein shortfall × 1e6 + |kcal − target| + knob penalties + meat weight + add-on repeat; powder last (G2).
- Veg: `pickReuse` (REUSE_WINDOW 5) prefers recipes adding fewest new vegetables; empty vegs → `[]` / `vegL|vegD = null` / `infeasible.reason === 'no-veg'` (A40). Loops bounded (A46).
- Budget: R9-1 loops on *real* regenerated cost (≤7 rounds); A34 reports `unfit` days; optional one-slot revert when still over. Cost via `priceOf` (A23/A27).
- Tuna: add-on only, weekly gram budget shared with review via `TUNA` (A33; extraction → A50).
- Measured @4a688c5: A43 guard median < 25 ms (7 runs), grid p95 < 40 ms (30 mixed). CI runs tests serially so the guard measures the planner, not contention (v0.10.23).
- `fit` ∈ `FITS` = `ok` | `kcal-high` | `kcal-low` | `protein-low` (A28).
- Lunch/dinner show `mealScores` (G1). Plan page also shows distinct veg count, meat notes (R9-8), trayPlan (R-11), weekFiber line (R10-F2), per-day `fiberNote` / stapleSwap (R10-F1).
- Shopping (R10-S1 ✅): `twinOf` merges `*USDA` → base id; `PANTRY_IDS` + `small` (<50 g) collapse into 常备/少量; `listLines` ≤ 32 on the fixture.

## 6. Testing (A1, A8, A32/A43, A44, A46 ✅)
- Local `npm test` = `node --test test/` (Node 20+, no deps). **CI** uses `node --test --test-concurrency=1 test/` (v0.10.23) so A43 perf guards are stable. **180 tests in 59 files @v0.10.24**, all pass on a clean clone (07:02 SGT). Local script still parallel — see A48.
- Unit tests per core module; feature tests are named after their backlog id (`a23`, `g1`…`g3`, `r8`, `ux4`…`ux14`), which makes "is X covered" a filename lookup.
- Data (`data.test.js`): ids, source/verified, kcal≈4P+4C+9F, recipe ingredients exist, UX-14 wrist rule (no 拍/剁/砸/颠锅 unless `wristSafe:false` + `wristNote`).
- Store/keys: migrations, envelope, replace-import + undo, persistence, KNOWN_KEYS ↔ §3 table (`keys.test.js`, A14).
- Text-level: `version.test.js` (CACHE/VERSION, boot order, SW fallback), `sw.test.js` (ASSETS), `ux4.test.js` (shared nav, `viewport-fit=cover`).
- Gaps closed since v0.8.7: A29 onboardStep persistence, A32/A43 perf guards, A31/A36 golden scores, A44 snapshots + plangrid (4 s CI wall), A46 bounded-while grep, R10-S1 twin merge. Open: empty-protein crash (A47), npm↔CI concurrency drift (A48), plan→review TUNA import (A50), export twin map + portion.js size (A53).

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
- `.github/workflows/ci.yml` ✅: push to main + PR; Node 20; `node --check` every tracked js; `node --test --test-concurrency=1 test/` (serial for stable A43).
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

## 11. Review @c339c0f (v0.10.27, 2026-10-15 ~07:10 SGT)
Commits reviewed: `9390563` (docs(arch) @v0.10.10) → `c339c0f` (v0.10.27). Mid-round engineer landings R10-F1/F2/S1 (v0.10.25–0.10.27) included. Tests green on a clean clone (serial).

Verified shipped:
- **A40** no-veg guard + bounded `pickReuse` (v0.10.15)
- **A41** `afterImport` in core/store (v0.10.16)
- **A42** `canDeepen` → `{ok, reason}` + break guard (v0.10.17)
- **A43** tighter perf guards (v0.10.18) + CI serial (v0.10.23)
- **A44** veg-reuse snapshots, revert fixture, `plangrid.test.js` (v0.10.19; wall 4 s @v0.10.22)
- **A45** `js/core/plan/{select,portion,budget,shopping}.js` behind `plan.js` facade (v0.10.20)
- **A46** bounded-loop grep test (v0.10.21)
- Also: R-01 (v0.10.12), R-11 (v0.10.13), VER-10 (v0.10.14), R10-D1 (v0.10.24), **R10-F1 fiber-aware portions (v0.10.25)**, **R10-F2 weekFiber line (v0.10.26)**, **R10-S1 twin/pantry shopping (v0.10.27)** — closes the behavioural half of A49.

Design decisions this round:
- **Empty protein list must fail closed like empty veg (A47).** Still crashes on tip @c339c0f. Mirror A40: `infeasible.reason === 'no-protein'`, plan-page notice, no throw.
- **Local `npm test` must match CI serial concurrency (A48).**
- **`TUNA` belongs outside `review.js` (A50).**
- **Twin map should live next to `COOKED_TO_RAW` and be exported (A53).** R10-S1's private `TWIN`/`twinOf` in shopping.js is correct behaviour; architecture wants one shared alias table (and `portion.js` is now 125 lines after F1 — peel fiber preference back under the A45 size budget).

New items: A47–A48, A50–A53 in BACKLOG.md (A49 ✅ via R10-S1).

