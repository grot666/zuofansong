# 做饭松 — Architecture

Status: reflects `main` at 2f32a1a (v0.6.2). Owner of this doc: architecture bot. Code changes are tracked as BACKLOG items `A*`.
Reviews: 6ab7969 (v0.6.1, ~05:10 SGT: A2–A5/A7/A9/A10/A12 closed, A13–A16 opened) · 2f32a1a (v0.6.2, ~05:25 SGT: A13/A15/A16 shipped, 56/56 tests local; new probes → A17–A22).

## 1. Principles
- Static GitHub Pages, plain HTML/CSS/ES modules, **no build step**, no runtime deps, no network calls except same-origin assets.
- **Pure logic in `js/core/`** (no `document`, `window`, `alert`, `localStorage` except in `store.js` via an injectable backend). Everything in `js/core` and `data/` must import cleanly under `node --test`.
- **Browser glue in `js/boot.js`** (✅ v0.6.0): the only shared module allowed to touch `document`/`navigator`.
- **UI modules** (page entries, later `js/views/*`) only: read state, call core, render HTML strings, bind events.
- Data modules (`data/*.js`) are JS (not JSON) so they work offline and in Node without fetch (DECISIONS 04:00).
- **Every page entry does the same boot:** `bootStore()` → render → `registerSW()` (✅ v0.6.0, enforced by `test/version.test.js`).

## 2. Module layout @v0.6.2
```
index.html            SPA shell, hash routes #today #plate #veg #rice #foods #me
plan.html             weekly plan + shopping list (separate page, same storage)
review.html           每周复盘 (separate page, same storage)
sw.js                 service worker (CACHE = 'zfs-' + VERSION)
manifest.webmanifest, icon.svg, .nojekyll
css/app.css
js/boot.js            ✅ bootStore() (migrate → resolveBreak → storage-error banner), getProfile(), registerSW(), localDate()
js/app.js             UI: views.{me,foods,rice,plate,veg,today}   (35 KB, 285 lines — split, see A6)
js/plan-page.js       UI: plan page (calls planWeek)
js/review-page.js     UI: review page (decision radio → profile / breakState)
js/core/
  version.js          ✅ VERSION + CHANGELOG (single source, A3)
  profile.js          ✅ DEFAULT_PROFILE, normalizeProfile() (types+clamps), paceCheck() (A4, R-01b)
  foods.js            ✅ makeIndex(...lists) → food(id) (+ .all()), totals(items, food), proteinPerYuan (A5)
  store.js            ✅ culiang.v1.* get/set/remove/keys, useBackend, MIGRATIONS, migrate, export/import/reset (A2)
  breaks.js           ✅ startBreak / resolveBreak (A12; DECISIONS 05:08: not in review.js)
  sleep.js            ✅ dinnerDeadline, caffeineCutoff, isAfter (midnight wrap), sleepNotes (R-04/R-12)
  portion.js          ✅ MULTS [0.5,1,1.5], scaleItems (N-03)
  targets.js          BMR/TDEE, macro targets, warnings, fastLossWarning, projectedBodyFat
  grains.js           blend(): raw/cooked macros, yield, water ratio, soak list
  fat.js, protein.js, fiber.js, weight.js, review.js
  plan.js             selectWeek, portionDay, generateWeek, applyBudget, planWeek, shoppingList, checkWeek, COOKED_TO_RAW
  [target] dates.js   localDate(now), addDays(str,n), dayNum(str) — replaces 6 copies (A22)
js/views/             [target, A6] today, plate, veg, rice, foods, me — each {render, bind}
js/ctx.js             [target, A6] shared page context: food index, profile(), getLog/setLog, today()
data/foods.js, foods2.js, foods3.js, recipes.js   (131 foods)
test/core, plan, planweek, fiber-weight, review, store, sw, version, data, r6 (.test.js)   56 tests
.github/workflows/ci.yml  node --check + node --test on push/PR
```
Dependency rule: `UI → boot → core → data`. Core never imports boot/UI; data imports nothing.

Remaining duplication:
- Local-date helper: **6 copies** (boot.localDate, app.today/dayOffset, plan-page, review-page, store.localToday; review.lastNDates uses UTC ms math) → `core/dates.js` (A22). v0.6.2 already injects `{today}` into migrations ✅.
- plan-page.js builds its own `makeIndex(...)`; app.js has `refreshFoods`. Move to `js/ctx.js` with A6.

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
| `onboardSeen` | bool, hides 示例目标 card (UX-1, v0.6.9) | today |
| `sauceOff` | `[sauceId]` excluded from rotation (R-11b, v0.7.0) | plan |

Rules:
1. New keys go in this table **and** `KNOWN_KEYS` (import drops unknown keys; `log.*`/`logArchive.*` are regex-matched).
2. Plain JSON; dates are device-local `YYYY-MM-DD`.
3. Food references are by stable `id`; **never rename a food id** without a migration rewriting `log.*`, `recents`, `riceFavs`, `templates`, `templateUse`.
4. `v1` in the prefix is a namespace, not the schema version.
5. Writers of `profile` read-modify-write the **stored** object (`S.get('profile', {})`), never the normalized one. ⚠ `app.js` me-view `onsubmit` and the weight logger write `{...p, ...d}` where `p = normalizeProfile(...)` → every default is frozen into storage on first save, so a later DEFAULT_PROFILE change never reaches that user (A21).

### Migrations ✅ (A2, A13)
- `MIGRATIONS = {1: noop, 2: ({today}) => breakFrom → breakState}`; `migrate({today})` loops `version+1 … SCHEMA_VERSION`.
- Upgrading from ≥1 first writes `backup.preMigration`; **if that write fails, migrate returns early without bumping `version`** (A13b ✅).
- Each migration idempotent; tested with `memoryBackend`.
- ⚠ Consequence of the abort (A18): the page then runs v2 code on v1 data, and the `storage-error` emitted by the failed backup fires before boot.js attaches its banner listener, so it is silent. Probe 05:24: backend throwing on `backup.*` → `migrate() === 1`, `breakFrom` kept, no `breakState`, no banner.

### Backup / import (A13 ✅, A17 open)
Export: `{app:'zuofansong', schema, exportedAt, data}` ✅. Import accepts envelope + legacy flat object, whitelists keys ✅, rejects envelope `schema > SCHEMA_VERSION` ✅, stamps `version = data.version || env.schema || 1` before migrate ✅ (legacy `{breakFrom:15}` → `breakState{from:15}` verified 05:24). Remaining gaps (probe on 2f32a1a):
- Legacy object with `version: 99` bypasses the newer-schema check (only the envelope's `schema` is checked) → store ends at version 99 and no future migration ever runs.
- Import **merges**: `log.*` days not in the backup survive, contrary to "replace after confirm".
- No `backup.preImport`, so a wrong file can't be undone.
Target: `importAll(obj, {mode:'replace'})` = validate → `backup.preImport` = exportAll() → resetAll() → write whitelisted keys → set `version` = envelope.schema ?? data.version ?? 1 (reject > SCHEMA_VERSION) → migrate().

### Errors / persistence (A18 open)
`set()` returns false + emits `storage-error` ✅; boot shows a banner ✅. Gaps: `bootStore()` calls `S.migrate()` **before** adding the listener, so a quota failure while writing `backup.preMigration` is silent; when `localStorage` throws (Safari private mode / blocked), store silently falls back to `memoryBackend` and every write is lost on reload with no warning.

## 4. Service worker @v0.6.2 (A7 ✅, A15 ✅, A20 open)
- `CACHE === 'zfs-' + VERSION` (tested) ✅; install precaches ASSETS + `skipWaiting`; activate deletes other caches + `clients.claim` ✅.
- Navigations: network-first, 3 s timeout → cached page (ignoreSearch) → `index.html` ✅ (only place HTML fallback appears; tested).
- Assets: stale-while-revalidate, miss + offline → `Response.error()` (never HTML) ✅. Only `ok && basic` cached ✅.
- ✅ v0.6.2: SWR revalidation kept alive with `e.waitUntil(net)`; `test/sw.test.js` enforces disk ⊆ ASSETS, no dups, ASSETS ⊆ disk (A15).
- Gaps (A20):
  1. `c.addAll(ASSETS)` can be served from the HTTP cache (GitHub Pages sends `max-age=600`), so a SW installed within 10 min of a deploy may precache **old** JS under the **new** cache name. Use `new Request(u, {cache: 'reload'})`.
  2. (note) v0.6.2 starts a network fetch for every asset request even on a cache hit — inherent to SWR; fine on Pages, revisit before adding large data files.
  3. No escape hatch: a module-link error (mixed old/new modules, missing asset) happens before `app.js` runs its try/catch → blank screen. Add a tiny non-module inline script per page that, if `#view` is still empty after ~4 s or on `error` for a `script` target, shows “加载失败 · 清除离线缓存并重新加载” (unregister SW + `caches.delete` all; **never touch localStorage**).
  4. Update UX: on `controllerchange` show a small “已更新到新版本” toast with 刷新 button (no auto-reload mid-logging).

## 5. Weekly plan @v0.6.2 (A9 ✅, A16 ✅, A19 open)
```
selectWeek(food, recipes, {seed, proteins, dinnerProteins}) → skeleton[7] {day, bf, pDinner, pLunch=dinner(d-1), staple, vegL, vegD}
portionDay(skel, {kcal, protein}, food) → {day, meals, tot, dinnerProtein, staple, proteinG, stapleG}
generateWeek(t, food, recipes, opts) = selectWeek(...).map(portionDay)
applyBudget({slots, options, slotCost, fixed, budget, cap:3}) → {slots, cost, swaps, overBudget, steps}   // R6.3 greedy, generic
planWeek(t, food, recipes, {seed, budget, proteins}) → {week, cost, overBudget, swaps}   // cost from real shoppingList
```
- Lunch-reuse incl. wraparound, cap 3, overBudget flag, cost monotone: `test/planweek.test.js` ✅ (A16, at 1800 kcal / 140 g only).
- **Feasibility gap (A19)** — grid probe 2026-10-15 05:12, re-run on 2f32a1a 05:24 (same) (kcal 1400/1500/1800/2000/2200 × protein 110/140/160 × seeds 0–8 = 945 days): **247 days fail `checkWeek`** (kcal outside ±5%). Default profile (1617 kcal / 140 g) passes all 63. Failures cluster at (a) low kcal + high protein — protein floor forces kcal up (1500/140: 8 of 63 days, 1400/160: 46) and (b) high kcal + low protein — staple capped at 350 g per meal (2200/110: 59). (a) matters for this user: `computeTargets(normalizeProfile({weight:62}))` = 1502 kcal / 140 g → **9 of 63 days fail** over seeds 0–8; the target drifts there as weight falls toward 58 kg. plan-page should not show a plan that silently misses its own band.

## 6. Testing (A1 ✅, A8 open)
- `npm test` = `node --test test/` (Node 20+). No deps. CI on push/PR ✅. 56 tests @v0.6.2.
- Unit: js/core. Data (`data.test.js` ✅): unique ids, source+verified, numeric macros, kcal≈4P+4C+9F (15% / ±10 kcal / `kcalNote`), recipe ingredients exist.
- Store (`store.test.js` ✅): migrate v1→v2 + idempotent, envelope round-trip, whitelist, newer schema rejected, quota → false. ✅ A13: legacy-without-version, backup-failure abort, injected today. **Add (A17):** legacy version 99 rejected, replace mode drops stale logs, preImport backup; **(A18):** throwing backend → `isPersistent()` false.
- Text-level (`version.test.js` ✅): CACHE vs VERSION, changelog head, no literal versions, boot+SW in every page, HTML fallback navigation-only, ASSETS exist. ✅ `sw.test.js` disk ⊆ ASSETS (A15). **Add (A20):** precache uses `cache:'reload'`; every `*.html` has the escape-hatch script and it contains no `localStorage`.
- Property (A19): plan grid above — feasible combos must pass checkWeek on every day; infeasible combos must return an explicit reason.
- Optional smoke (Playwright if available): each hash route + plan.html + review.html at 360 px, fail on console error.

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
