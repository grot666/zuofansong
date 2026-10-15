# 做饭松 — Architecture

Status: reflects `main` at 1073021 (v0.10.51). Owner of this doc: architecture bot. Code changes are tracked as BACKLOG items `A*`.
Reviews: 6ab7969 (v0.6.1) · 2f32a1a (v0.6.2: A17–A22) · 836ac40 (v0.7.1: A23–A27) · be96ed1 (v0.8.7: A28–A32) · e99d68d (v0.9.5: A33–A39) · 9390563 (v0.10.10: A40–A46) · 261eab3 (v0.10.28: A47–A53, §11) · 3cd4958 (v0.10.43: A54–A63, BACKLOG only) · **1073021 (v0.10.51, 2026-10-15 ~08:15 SGT: A56–A60/A62 + R11-3/4/5 verified; new → A64–A73, §12)**.

## 1. Principles
- Static GitHub Pages, plain HTML/CSS/ES modules, **no build step**, no runtime deps, no network calls except same-origin assets.
- **Pure logic in `js/core/`** (no `document`, `window`, `alert`, `localStorage` except in `store.js` via an injectable backend). Everything in `js/core` and `data/` must import cleanly under `node --test`.
  - Since A24 (v0.7.4) `core/foods.js` imports `data/foods*.js` + `data/prices.js` for `foodIndexFromStore(S)`. That is the **only** core function allowed to pick data lists itself; every other core function takes `food` as a parameter so tests can inject a tiny index.
  - Known exception since A54 (v0.10.38): `core/fiber.js` builds module-level `SWAPS = computeSwaps(makeIndex(FOODS…))` from base data, so custom foods / price overrides never reach the today-view swaps (A73).
- **Browser glue in `js/boot.js`** (✅ v0.6.0): the only shared module allowed to touch `document`/`navigator`.
- **UI modules** (page entries, later `js/views/*`) only: read state, call core, render HTML strings, bind events.
- Data modules (`data/*.js`) are JS (not JSON) so they work offline and in Node without fetch (DECISIONS 04:00).
- **Every page entry does the same boot:** `bootStore()` → render → `registerSW()` (✅ v0.6.0, enforced by `test/version.test.js`).

## 2. Module layout @v0.10.51 (A6 ✅, A22 ✅, A24 ✅, A45 ✅, A50 ✅, A53 ✅, A57 ✅)
```
index.html            SPA shell, hash routes #today #plate #veg #rice #foods #me (+ A20 non-module escape hatch)
plan.html             weekly plan; in-page sections #menu #list #prep (UX-7); R-11 trayCard per weekday
review.html           每周复盘 (A42 canDeepen reasons)
sw.js                 service worker (CACHE = 'zfs-' + VERSION); ASSETS lists every js/core/plan/*.js + core/social.js, core/tuna.js
manifest.webmanifest, icon.svg, .nojekyll, css/app.css (--nav-h + safe-area padding, UX-5; .ctl 2-col grid at 375 px, UX-375)
js/boot.js            bootStore(), toast(msg,{action,ms}), shouldShowUpdate (UX-8), getProfile(), registerSW()
js/nav.js             NAV (5 items, UX-11), COOK_TOOLS sub-nav, navHtml/navHref/markNav
js/app.js             index router only: hash → views[name].{view(), view.bind()}
js/ui.js              index page context: foodIndexFromStore, profile(), getLog/setLog, today(), PRESET_TEMPLATES
js/views/             today (+ 聚餐 card, R11-5), me, foods (+ 包装 pack size, R11-4), rice, plate, veg (A30: no data/foods* or makeIndex imports)
js/plan-page.js       plan page (planWeek, mealScores, regenWeek undo, maxPrepMin, breakfastPref, two-trip list R11-3, leftovers R11-4, trayPlan)
js/review-page.js     review page (weekReview, plateauAdvice, canDeepen → reviews / profile / breakState)
js/core/
  version.js   VERSION + CHANGELOG (bumped only by scripts/release.mjs)   profile.js  DEFAULT_PROFILE, normalizeProfile, paceCheck, saveProfile, onboardStep (A29)
  store.js     culiang.v1.* + KNOWN_KEYS + migrations + afterImport (A41)   foods.js  makeIndex, foodIndexFromStore, totals, priceOf, COOKED_TO_RAW, SHOP_ALIAS, twinOf (A53)
  dates.js     localDate/addDays/dayNum, backupDue (G3), todayIndex
  plan.js      facade (8 lines) → plan/{select,portion,fiber,day,budget,shopping}.js + COOKED_TO_RAW/SHOP_ALIAS/twinOf
  plan/select.js   BREAKFASTS (opts.breakfast rotate|oats), PROTEINS, STAPLES (4, one per 2-day batch), rankVeg/rankProteins, pickReuse (A40/A46), selectWeek
  plan/portion.js  portionCore (closed-form search), FITS (A28), ADDONS, powderAddons, STAPLE_MAX_G (R11-1), feasibility          94 lines
  plan/fiber.js    FIBER_MIN (= core FIBER_TARGET.min), fiberNote, FIBER_ALT, SP cap constants, FIBER_SIDE (peas, PEAS_SIDE_G per meal)
  plan/day.js      portionDay (A47 no-protein path), dayWith (peas side), generateWeek (batch staple A55, no 3-run R11-2, SP cap), tuna cap
  plan/budget.js   applyBudget, planWeek (R9-1 real-cost loop, A34 unfit, budget-revert)
  plan/shopping.js shoppingList (twins R10-S1, pantry/small, perishable/frozen + g1/g2 trips R11-3), listLines, leftovers (R11-4), checkWeek, regenWeek, planTips, meatNote, parseBudget, distinctVeg, weekFiber
  tuna.js      TUNA weekly limits (A50; shared by plan/portion + review)     social.js  聚餐 mode: preAllocate, nextDayTargets, socialCopy, HOTPOT_* data, BANNED_WORDS (R11-5)
  fiber.js     FIBER_TARGET {min 25, goal 28, max 30}, FIBER_RANGE, PEAS_SIDE_G, SWAP_DEFS → computeSwaps(food), suggestFiber (A54)
  scores.js    mealScores (G1)              review.js   weekReview, plateau / plateauAdvice, reviewDue
  protein.js   proteinGap, gutRisk, proteinFill   retention.js compact/compactStore (A11, A26)
  breaks.js, sleep.js, portion.js, targets.js (canDeepen A42), grains.js, fat.js, weight.js, sauces.js (trayPlan R-11)
data/foods.js, foods2.js, foods3.js, recipes.js, sauces.js, prices.js
scripts/release.mjs   A57 release helper (`npm run release -- <ver> "<cn>" "<en>" <ID|-> "<msg>"`), pure helpers tested in test/release.test.mjs
test/  79 files, 220 tests @v0.10.51 (`npm test` = CI = `node --test --test-concurrency=1 test/`)
.github/workflows/ci.yml  workflow `ci`: node --check + serial node --test on push/PR
```
Dependency rule: `UI (pages, views, ui.js, nav.js) → boot → core → data`. Core never imports boot/UI; data imports nothing. `scripts/` may import core for helpers but nothing imports `scripts/` except its own test.
Plan split (A45/A53): UI and tests import only `js/core/plan.js`; every `plan/*.js` file < 100 lines. SW ASSETS lists the facade and all six split files (A15 test).

Remaining coupling / drift (open A*):
- **plan-page.js holds untested logic**: the fiber line per day (A64 bug lives here), the trip-1/trip-2 cost split `x.cost * x.g1 / x.g` and row filters (A67), and the leftover call without `weekRecipeIds` (A68). Rule: anything that computes a number or chooses copy moves into `js/core/*` as a pure function with a test; pages only join strings.
- Storage class for the two-trip list is inferred from free-text `tags` (`鱼`/`海鲜`/`绿叶菜`, `冷冻`), not a closed data field (A66).
- `core/social.js` carries food data (HOTPOT_*, DIPS) that belongs in `data/` and duplicates `sesamePaste` numbers (A72).
- `core/fiber.js` imports data lists at module load (A73, see §1).

## 3. Storage schema — `localStorage`, prefix `culiang.v1.`
All access through `js/core/store.js` (`get/set` JSON, try/catch). `SCHEMA_VERSION = 2`. Keys @v0.10.51 (no migration since 2; R11-4/R11-5 keys are additive and default-safe):

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
| `packs` | {foodId: g} user pack sizes for leftover hints (R11-4) | foods, plan |
| `social` | {date, meal, type} 聚餐 mode for one day (R11-5) | today |
| `breakfastPref` | rotate/oats, plan breakfast preference (opts.breakfast, v0.10.42) | plan |
| `onboardSeen` | bool, hides 示例目标 card (UX-1, v0.6.9) | today |
| `sauceOff` | `[sauceId]` excluded from rotation (R-11b, v0.7.0) | plan |

Rules:
1. New keys go in this table **and** `KNOWN_KEYS` (import drops unknown keys; `log.*`/`logArchive.*` are regex-matched).
2. Plain JSON; dates are device-local `YYYY-MM-DD`.
3. Food references are by stable `id`; **never rename a food id** without a migration rewriting `log.*`, `recents`, `riceFavs`, `templates`, `templateUse`.
4. `v1` in the prefix is a namespace, not the schema version.
5. Writers of `profile` read-modify-write the **stored** object (`S.get('profile', {})`) via `mergeProfileEdit`, never the normalized one (A21 ✅; UX-6 `saveProfile` and UX-10 `saveOnboardStep` follow it).
6. Use-count / preference keys (`foodUse`, `templateUse`, `updateSeen`, `lastExport`, `backupSnooze`, `breakfastPref`, `packs`, `social`) are exported and imported like everything else. Keys that describe *this device's* state are not; today that is only `backup.*`.
7. Per-day UI state (`social`, `undo`) carries its own `date` and is ignored when stale; clearing writes `null` (not removed). Readers must treat `null`, a stale date and an unknown `type` as "off".
8. Keys holding food ids for *shopping* (`packs`) must be keyed by the shopping id (`COOKED_TO_RAW` raw id → `twinOf` base), the same id `shoppingList` emits (A68).

### Migrations ✅ (A2, A13)
- `MIGRATIONS = {1: noop, 2: ({today}) => breakFrom → breakState}`; `migrate({today})` loops `version+1 … SCHEMA_VERSION`.
- Upgrading from ≥1 first writes `backup.preMigration`; **if that write fails, migrate returns early without bumping `version`** (A13b ✅).
- Each migration idempotent; tested with `memoryBackend`.
- ✅ A18 (v0.6.4): the abort and non-persistent storage are surfaced by `bootStore()`.

### Backup / import ✅ (A13, A17, A26)
Export envelope `{app:'zuofansong', schema, exportedAt, data}` (skips `backup.*`). Import = replace mode: validate → `backup.preImport` = exportAll() (abort if that write fails) → reset → whitelisted keys → version capped at SCHEMA_VERSION → migrate. 撤销上次导入 restores `backup.preImport`. `compactStore` skips while `backup.preImport` exists (A26). Export stamps `lastExport` (G3).

### Errors / persistence ✅ (A18)
`set()` returns false + emits `storage-error`; boot shows the banner, including migrate-abort and memory-backend fallback.

## 4. Service worker @v0.10.51 (A7, A15, A20 ✅) — strategy unchanged since v0.6; only ASSETS grew (plan/fiber.js, plan/day.js, tuna.js, social.js)
- `CACHE === 'zfs-' + VERSION` (tested); install precaches ASSETS with `new Request(u, {cache:'reload'})` + `skipWaiting`; activate deletes other caches + `clients.claim`.
- Navigations: network-first 3 s → cached page (ignoreSearch) → `index.html`. Assets: stale-while-revalidate kept alive with `waitUntil`; miss + offline → `Response.error()`, never HTML. Only `ok && basic` cached.
- `sw.test.js` enforces disk ⊆ ASSETS ⊆ disk, no dups (A15) — caught `js/nav.js` / `js/core/scores.js` in v0.8.x and the four `js/core/plan/*.js` files at A45.
- A20 escape hatch: a non-module inline script in each page offers 清除离线缓存并重新加载 (unregisters SW, deletes caches, never touches localStorage).
- Update toast (UX-8): shown once per new version; `updateSeen` stores the version already shown.

## 5. Weekly plan @v0.10.51 (A9, A16, A19, A23, A25, A33–A47, A51, A54, A55, A59, G1, G2, UX-9, R9-10, R10-F1, R11-1/2/3/4, PERF-1 ✅)
```
selectWeek(food, recipes, {seed, proteins, dinnerProteins, maxPrepMin, reuse, breakfast}) → skeleton[7] {day, bf, pDinner, pLunch=dinner(d-1), staple, vegL|null, vegD|null}
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
- Shopping (R10-S1 ✅): `twinOf` merges `*USDA` → base id (+ `SHOP_ALIAS` eggWhite/oatsDry, A53); `PANTRY_IDS` + `small` (<50 g) collapse into 常备/少量; `listLines` ≤ 32 on the fixture (grid max 33 @v0.10.51, 34 counting split rows — A67).
- Staples (A55, R11-1, R11-2, A59): one staple per 2-day rice-cooker batch, decided per batch in `generateWeek`; `STAPLES` (4) rotate over 4 batches so 烤红薯 lands on ≤ 1 batch by construction; day.js SP cap (≤ 3 days) is the backstop; `STAPLE_MAX_G.sweetPotatoBaked = 175` per meal; no staple 3 days running. `FIBER_ALT` staple swaps are near-dormant (5/3024 grid days, budget runs only — A71).
- Fiber (A54, R10-F1, R11-2): target constants only in `core/fiber.js`; a day still < 25 g may add the peas side (`FIBER_SIDE`, 80 g per lunch **and** dinner) — 28.7% of grid days. Full grid (8 targets × seeds 0–8 × {rotate, oats} × budget {none, .8, .5}) = 86.7% of days ≥ 25 g; 1500/140 rotate 65% (A61).
- Breakfast (v0.10.42, A62): `opts.breakfast` 'rotate' | 'oats' from `breakfastPref`; part of the memo key; covered by plangrid (oats seeds 0–2) + A44 snapshot.
- Two trips (R11-3): each list item carries `perishable` (tags 鱼/海鲜/绿叶菜, not pantry, not frozen), `frozen` (tag 冷冻) and `g1 + g2 = g`, where g2 = grams needed on day ≥ `TRIP2_FROM` (4 = 周五). The cost split per trip is done in plan-page (A67).
- Leftovers (R11-4): `leftovers(list, packs, recipes, weekRecipeIds)` → `{id, left, recipeId}` when need < user pack size; no default pack sizes in data.
- 聚餐 (R11-5) is a **today-view overlay**, not a plan input: the plan for that date is unchanged; `preAllocate(targets, {meal})` splits day fat by fixed shares (0.25/0.35/0.40) and moves half of the other meals' fat to the social meal (A65: the number is not reconciled with what the plan actually serves).

## 6. Testing (A1, A8, A32/A43, A44, A46, A48, A56, A58, A60, A62 ✅)
- `npm test` = CI = `node --test --test-concurrency=1 test/` (A48). **220 tests in 79 files @v0.10.51**, all pass serially on a clean clone (~32 s, 08:11 SGT).
- Perf guards (A56): a32/A43 samples are divided by a CPU-calibration factor locally so plain parallel `node --test test/` passes on a busy box; CI (`CI=true`) or `PERF=1` keeps the raw 25/40 ms limits. plangrid/plangrid-det keep a 4 s wall guard.
- Unit tests per core module; feature tests are named after their backlog id (`a23`, `g1`…`g3`, `r8`, `r11-3`…`r11-5`, `ux4`…`ux14`), so "is X covered" is a filename lookup.
- Grid invariants (A44/A51/A58/A62): `plangrid.test.js` (rotate seeds 0–5, oats 0–2; pairing, fit flags, batch staple, no 3-run, SP cap on every budget incl .5×, `spCap ⇒ staple ≠ SP`, `fiberSide ⇒` peas in lunch+dinner), `plangrid-det.test.js` (determinism), A44 snapshot pins staple:fiberSide:breakfast per day.
- Data (`data.test.js`): ids, source/verified, kcal≈4P+4C+9F, recipe ingredients exist, UX-14 wrist rule.
- Store/keys: migrations, envelope, replace-import + undo, persistence, KNOWN_KEYS ↔ §3 table (`keys.test.js`, A14 — **this file's §3 table is parsed by a test**: keep the `| \`key\` |` row format).
- Text-level / lint: `version.test.js` (CACHE/VERSION, boot order, SW fallback), `sw.test.js` (ASSETS ⊆ disk ⊆ ASSETS), `ux4.test.js` (shared nav), `lint.test.js` (A60: no `assert` hidden after a trailing `//`), bounded-loop grep (A46), `release.test.mjs` (A57 pure helpers).
- Copy: R11-5 `BANNED_WORDS` is checked on social copy only; other pages' neutral-copy rule is reviewed by hand.
- Gaps @v0.10.51: **no test renders page strings** — the literal `${PEAS_SIDE_G}` shipped in v0.10.38 and sits on 28.7% of plan days (A64); the cost split per trip lives in UI (A67); one vacuous test (`r11-4` "rounded threshold", empty body, A69); `FIBER_ALT` path has no pinned fixture (A71).

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

## 7. CI / Pages / release
- `.github/workflows/ci.yml` ✅: push to main + PR; Node 20; `node --check` every tracked js; `node --test --test-concurrency=1 test/` (serial for stable A43).
- Pages: branch deploy from `main` `/` (enabled 05:03). CI is the gate; engineer checks it before declaring an iteration done.
- Release (A57 ✅, v0.10.44): only via `npm run release` (scripts/release.mjs) on a clean tree: pull --rebase (abort on conflict) → conflict-marker grep → `npm test` → bump version.js/sw.js/CHANGELOG/PROGRESS (newest first)/BACKLOG ✅ → `npm test` again (revert on red) → commit (no doubled `(vX)`) → push, one rebase-and-retry on rejection → wait for the `ci` run of that SHA (exit 2 if not success). Gap: the retry path pushes without re-testing what the rebase brought in (A70).
- Docs-only commits (arch/research/PM) go straight to main with `git pull --rebase`; they never touch version.js/sw.js.
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

## 11. Review @261eab3 (v0.10.28, 2026-10-15 ~07:10 SGT)
Commits reviewed: `9390563` (docs(arch) @v0.10.10) → `261eab3` (v0.10.28). Mid-round engineer landings R10-F1/F2/S1/S2 (v0.10.25–0.10.28) included. Tests green on a clean clone (serial).

Verified shipped:
- **A40** no-veg guard + bounded `pickReuse` (v0.10.15)
- **A41** `afterImport` in core/store (v0.10.16)
- **A42** `canDeepen` → `{ok, reason}` + break guard (v0.10.17)
- **A43** tighter perf guards (v0.10.18) + CI serial (v0.10.23)
- **A44** veg-reuse snapshots, revert fixture, `plangrid.test.js` (v0.10.19; wall 4 s @v0.10.22)
- **A45** `js/core/plan/{select,portion,budget,shopping}.js` behind `plan.js` facade (v0.10.20)
- **A46** bounded-loop grep test (v0.10.21)
- Also: R-01 (v0.10.12), R-11 (v0.10.13), VER-10 (v0.10.14), R10-D1 (v0.10.24), **R10-F1 fiber-aware portions (v0.10.25)**, **R10-F2 weekFiber line (v0.10.26)**, **R10-S1 twin/pantry shopping (v0.10.27)** — closes A49 behaviour, **R10-S2 meat-over-250 g score penalty (v0.10.28)**.

Design decisions this round:
- **Empty protein list must fail closed like empty veg (A47).** Still crashes on tip @c339c0f. Mirror A40: `infeasible.reason === 'no-protein'`, plan-page notice, no throw.
- **Local `npm test` must match CI serial concurrency (A48).**
- **`TUNA` belongs outside `review.js` (A50).**
- **Twin map should live next to `COOKED_TO_RAW` and be exported (A53).** R10-S1's private `TWIN`/`twinOf` in shopping.js is correct behaviour; architecture wants one shared alias table (and `portion.js` is now 125 lines after F1 — peel fiber preference back under the A45 size budget).

New items: A47–A48, A50–A53 in BACKLOG.md (A49 ✅ via R10-S1).

## 12. Review @1073021 (v0.10.51, 2026-10-15 ~08:15 SGT)
Commits reviewed: `a882db7` (docs(arch) @3cd4958, v0.10.43) → `1073021` (v0.10.51): A57 release.mjs (v0.10.44), A60 (v0.10.45), A58+A62 (v0.10.46), A56 (v0.10.47), A59 (v0.10.48), R11-5 聚餐 (v0.10.49), R11-3 two trips (v0.10.50), R11-4 leftovers (v0.10.51). `npm test` 220/220 serial; CI green on e93f28c and 1073021.

Verified shipped (evidence in BACKLOG "Status @1073021"): A56, A57, A58, A59 (no code: ≤ 1 SP batch by construction, pinned), A60, A62, R11-3, R11-4, R11-5. Still open from the last round: A61 (fiber-days claim), A63 (folded into A64).

Probe (script not committed): 8 targets × seeds 0–8 × {rotate, oats} × budget {none, .8, .5} = 432 weeks / 3024 days.
- **Bug:** `plan-page.js` line 53 renders `' · 午晚餐各加青豆 ${PEAS_SIDE_G} g'` — a single-quoted string inside a template, so users see the literal `${PEAS_SIDE_G}`. Introduced in 3ac8763 (A54, v0.10.38); 867/3024 days (28.7%), 358/432 weeks. Only hit of the regex ``/[?:] '[^'`\n]*\$\{[^'`\n]*'/`` across js/ (A64).
- **聚餐 reserve is arithmetic, not food:** the post-cut breakfast/lunch fat budgets (5–7 g / 7–10 g) are below the planned meals' intrinsic non-oil fat on 504/504 plan days probed (1400/110, 1500/140, 1800/140, 2200/160 × seeds 0–8 × {rotate, oats}) (breakfast alone 14–26 g), and lunch oil is ≤ 6 g, so "少放油" frees ≤ 1 g. The 加餐 meal is ignored by the 3-meal shares (A65).
- **Two trips** (budget {none, .8} subset, 288 weeks): 257/288 weeks have a trip 2 (avg 1.7 lines; 145 items split across both trips). 生菜 (lettuce, cited in R11-3's own seed-7 example), 海带(鲜) and fresh mushrooms are classed non-perishable because classification reads free-text tags (A66). Perishables used on day 3 (周四) come from trip 1 in 65 item-weeks — product call, not changed.
- **Leftovers:** packs set on cooked/twin ids (烤鸡腿 `thighRoasted`, `eggUSDA`) never match the list's raw/base ids; pantry items produce noise (rice 5 kg → "剩余约 4835 g"); need > 1 pack gives no hint; the page omits `weekRecipeIds` (A68).
- 250/3024 days show `fiberNote` "膳食纤维约 25 g（目标 25–30 g）：可把…" because the note rounds a value < 25 (the R11-4 rider, dropped) (A69).

Design decisions this round:
- **Pages compute nothing.** Any number or copy choice on plan/today pages (per-day fiber line, per-trip costs, leftover hints, social reserve) is a pure `js/core` function with a test; pages only join strings. A cheap lint guards template-in-quote mistakes (A64, A67).
- **聚餐 stays a today-view overlay** (plan unchanged, `social` key per date). Any number it shows must be derived from concrete food changes on the actual day (plan day or log), never from fixed meal-share ratios (A65).
- **Storage class is data, not tags.** Perishable/frozen/keeps/pantry becomes a closed per-food field with a data test, replacing tag inference and `PANTRY_IDS` over time (A66).
- **Shopping-id normalisation is one function.** Every user key that refers to something you buy (`packs`, later per-item checkmarks) goes through `COOKED_TO_RAW` → `twinOf` (A68, §3 rule 8).

New items: A64–A73 in BACKLOG.md.

## 13. Review @8a0fb00 (v0.10.52, 2026-10-15 ~08:25 SGT): data provenance and twins
- **Citations:** `verified:true` requires a source starting with `USDA FDC <id>` or `营养所查询平台 #<id>`. 70/137 foods verified (63 FDC, 7 平台). Test coverage must include foods3 (A75).
- **Twins → aliases (A74):** the `*USDA` duplicates predate VER-20. Where the values are now identical (egg, broccoli), or one side is verified (spinach, kiwi), the canonical food is the verified one; the other carries `aliasOf`.
  - Ids are never renamed. `makeIndex` resolves aliases for nutrients, price and storage class.
  - Search hides aliases; `twinOf` derives from `aliasOf`.
  - Migration v3 moves `prices[alias]`.
- **Invariant:** any per-food user state (prices, packs, storage class) is keyed by the canonical id after resolution, so today, plan, shopping and leftovers agree on one physical food.
