# BACKLOG (top = next)

1. **Enable GitHub Pages** (main, /): `gh api -X POST repos/grot666/zuofansong/pages -f 'source[branch]=main' -f 'source[path]=/'` — needs shell.
2. Run `node --test test/` and `node --check` on all JS; headless smoke test of index.html#{today,plate,veg,rice,foods,me} and plan.html; fix bugs.
3. Version string: app.js VERSION still 0.2.0 while plan page is 0.3.0 — bump + changelog entry in-app.
4. Expand foods to ≥120 (Shanghai takeaway/便利店: 面条, 馄饨, 食堂套餐, 饭团, 关东煮); price override per food.
5. Tuna weekly counter (light ≤3×113 g, albacore ≤1×113 g; R3.3).
6. Dinner-time nudge: bedtime setting, dinner ≥ 2–3 h before bed; caffeine cut-off (R1.4/R3.5).
7. Plateau logic: 7-day avg flat ≥2–3 weeks → −100–150 kcal or diet-break (R3.6).
8. Saved meal templates; 3-tap logging; “没关系，继续” recovery after over-target day.
9. Weekly review (adherence, avg macros, fiber, cost).
10. Fix recipe r24 name (蒸南瓜山药 uses carrot, not pumpkin) and r9 (虾皮 not in ingredients).

## Architecture items (see docs/ARCHITECTURE.md) — slot A1–A3 right after item 2

- **A1 CI workflow** — Why: no automated gate; pushes via API connector skip local tests. AC: `.github/workflows/ci.yml` runs on push/PR to main with Node 20: `node --check` on every `*.js`, then `node --test test/`; first run green; PROGRESS notes `gh run list` check per iteration.
- **A2 store.js hardening + migrations** — Why: `alert()` inside core (throws in Node), `exportAll` JSON.parse unguarded, `importAll` writes any key with no validation/version check, migrate() has no registry, plan page never calls migrate(). AC: injectable backend (`useBackend`), `MIGRATIONS` map + `SCHEMA_VERSION` loop; set() returns false + dispatches `storage-error` (UI shows message); export envelope `{app,schema,exportedAt,data}`; import accepts envelope + legacy, rejects schema>current and non-whitelisted keys; `test/store.test.js` covers quota failure, corrupted JSON value, export→reset→import round-trip, migrate idempotent.
- **A3 single version source** — Why: app.js VERSION 0.2.0, sw CACHE zfs-0.3.0, plan page shows none → users may not get updates / wrong 更新日志. AC: `js/core/version.js` exports VERSION + CHANGELOG; app.js, plan-page.js (#ver) use it; sw.js `importScripts`-free: test asserts `sw.js` CACHE string === 'zfs-'+VERSION.
- **A4 shared profile defaults** — Why: DEFAULT_PROFILE differs between app.js and plan-page.js → different targets per page for users who never saved. AC: `js/core/profile.js` exports DEFAULT_PROFILE + `normalizeProfile(p)` (types, clamps); both pages import it; test: computeTargets(normalizeProfile({})) identical in both code paths.
- **A5 food index + shared totals in core** — Why: `food(id)` is a linear find that rebuilds allFoods() on every call (O(n²) renders as data grows to 120+); totals() duplicated vs plan.js sum(). AC: `js/core/foods.js` `buildIndex(builtIn, custom)` → Map, `totals(items, food)` used by app.js and plan.js; tests for unknown id ignored and cost math.
- **A6 split app.js by view** — Why: 28 KB single file edited via full-file API writes = high conflict/regression risk. AC: `js/views/{today,plate,veg,rice,foods,me}.js` each exporting `{render, bind}`; app.js ≤ 3 KB router; no behavior change (smoke test passes); sw ASSETS updated.
- **A7 service worker strategy** — Why: caches non-OK/opaque responses, serves index.html for any offline miss (wrong for plan.html and assets), all assets network-first (slow on bad mobile network). AC: navigations network-first w/ 3 s timeout → cache → index.html; static assets stale-while-revalidate; only `ok && basic` cached; plan.html registers SW; `test/sw.test.js` asserts ASSETS ⊇ all js/data/css files and every ASSETS path exists.
- **A8 core test gaps vs §4** — Why: see coverage map in ARCHITECTURE §5. AC: tests added for female BMR, each activity factor, kcal<BMR warning, BMI≥30 goal-weight protein, multi-grain blend + soak/water ratio, fatWallet over budget, gutRisk low + monotonic in fiber, shoppingList raw grams exact for rice (cooked/2.3), generateWeek deterministic per seed and valid at 1500 & 2200 kcal.
- **A9 plan generator honours weekly budget** — Why: §3.10 requires plan within weekly budget; `weeklyBudget` is only displayed, never used. AC: `generateWeek(targets, food, recipes, {budget})` swaps the most expensive proteins for cheaper ones until shopping cost ≤ budget or no swap left; returns `{days, overBudget}`; test with budget 150 vs 400.
- **A10 data integrity tests** — Why: PROMPT §2.6 forbids silent invented numbers; recipe bugs (item 10) slipped through. AC: `test/data.test.js`: kcal vs 4P+4C+9F within 15% or `note` explains; every food has `source` and boolean `verified`; recipe names' key ingredient present in items (allowlist map); cooked foods have a COOKED_TO_RAW or `yield`.
- **A11 log retention** — Why: one `log.YYYY-MM-DD` key per day grows forever toward the ~5 MB quota. AC: after 180 days, logs collapse into `logArchive.YYYY-MM` daily totals (migration-safe); export includes both; test with synthetic 400 days.
