# BACKLOG (top = next)

1. **Enable GitHub Pages** (main, /): `gh api -X POST repos/grot666/zuofansong/pages -f 'source[branch]=main' -f 'source[path]=/'` — needs shell.
2. Run `node --test test/` and `node --check` on all JS; headless smoke test of index.html#{today,plate,veg,rice,foods,me} and plan.html; fix bugs.
3. Version string: app.js VERSION still 0.2.0 while plan page is 0.3.0 — bump + changelog entry in-app.
4. Expand foods to ≥120 (Shanghai takeaway/便利店: 面条, 馄飨, 食堂套餐, 饭团, 关东煮); price override per food.
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

---

## Research status & items (needs-research worker, 2026-10-15 04:35 SGT; sources: docs/RESEARCH.md, docs/RESEARCH-R5.md)
Status from CHANGELOG/PROGRESS @13c48c4 (not runtime-verified — tests not yet run per PROGRESS).

### Mission features (PROMPT §3)
- ✅ #1 我的目标 · ✅ #2 食材库 (≈100, 22 FDC-verified) · ✅ #3 杂粮饭配比器 · ✅ #4 一餐搭配 · ✅ #5 今日饮食 · ✅ #6 脂肪预算 · ✅ #7 蛋白补充 · ✅ #8 饮水/如厕舒适度 (v0.1) · ✅ #9 懒人蔬菜 32 (v0.2) · ✅ #10 一周菜单+购物清单+周日备餐 (v0.3; budget not enforced → A9).

### Research items already shipped (v0.2/v0.3)
- ✅ R-02 protein modes (自定 140 g / 体重 / 去脂体重) · ✅ R-03 rice-safety copy · ✅ R-07 "杂粮不更低热量" note · ✅ R-14 记入我的计划日 · ✅ R-05 护腕 filter · ✅ R-06 (22 of R3.1/R4.1 verified) · 🟡 R-01 (BF% at goal shipped; pace %/wk check not listed) · 🟡 R-15 (fiber-low flag shipped; ranked swaps = N-04) · 🟡 R-11 (周日备餐 shipped; 30-min evening one-tray variant open).

### Open items (slot after engineer items 1–3 / A1–A3; numbers in parentheses map to engineer list)
- **P0 · R-01b Pace check** — AC: profile shows kg/wk and %BW/wk to goal date; >1%/wk amber, <0.25%/wk info; test 74→58 kg, 2026-10-15→2027-07-31 ≈ 0.39 kg/wk ≈ 0.53%/wk.
- **P0 · N-02 Weight MA7 + chart** (R5.3) — AC: MA7 = calendar window [d−6,d], shown only with ≥3 entries (replace current last-7-entries average); inline SVG raw dots + MA line + goal line, 4w/8w/12w/全部, tap tooltip; status chip 正常/偏快/持平; tests for MA math, gap rule, %/wk.
- **P0 · N-03 Templates + 3-tap log** (= item 8; R5.5) — AC: "+"→sheet→template→记录 (×0.5/×1/×1.5) = 3 taps with undo; "存为模板" from plate builder; 3 presets; "复制昨天" with checkbox confirm; tests for multiplier expand + copy-yesterday.
- **P1 · N-04 Ranked fiber swaps** (R5.2, completes R-15) — AC: `js/core/fiber.js` ranks the 7 R5.2 swaps by fiberGain/max(kcalDelta,20), top 3, never > kcal target +5%, water tip when gut risk high; copy exactly as R5.2 (incl. corrected brown200: +2.4 g / −14 kcal); test: plan-day returns oats40/peas100/broc200 in top 3.
- **P1 · N-05 Takeaway quick-add data** (feeds item 4; R5.1) — AC: 20 R5.1 rows as `type:"dish"`, `verified:false`, `source:"fatsecret.cn 估算"`, `defaultPortionG` + `portionNote:"默认份量为假设，建议称重"`; always ≈ + tip line; test 黄焖鸡米饭 500 g → 835 kcal.
- **P1 · N-06 Weekly review** (= item 9; R5.4) — AC: 10-item checklist auto-filled from logs/weights; missing = "未记录"; one decision saved; "−100–150 kcal" updates target with confirm, "维持周" sets kcal = TDEE for 7 days; fixture-week test.
- **P1 · R-09 Tuna counter** (= item 5; R3.3) — AC: foods carry `mercuryClass`; tuna split 淡(鲣鱼/skipjack) / 白(长鳍/albacore); weekly soft note light >3×113 g or albacore >1×113 g, labelled conservative; plan rotates shrimp/salmon.
- **P1 · R-04/R-12 Bedtime & caffeine** (= item 6; R1.4, R3.5) — AC: bedtime setting (default 23:30); "晚餐建议 HH:MM 前吃完" = bedtime−3 h; caffeine items nudge after bedtime−6 h.
- **P1 · R-10 Plateau** (= item 7; R3.6) — AC: trigger only if MA7 change <0.1 kg over ≥14 d AND ≥5 logs/wk; offers −100–150 kcal / +steps / 1–2 wk maintenance (updates goal-date projection); trigger tests incl. sparse-data no-trigger.
- **P1 · R-08b Daily oil total** (R3.4) — AC: today view sums oil g from recipes/plates vs 膳食指南 25–30 g; test 15 g olive oil = 132.6 kcal / 15 g fat.
- **P2 · R-11b 30-min evening one-tray template** (R4.3) — AC: rice cooker + one tray/air fryer + microwave eggs; shows active minutes, 锅具数, 护腕 flag; ≥5 low-oil sauces rotated so flavour doesn't repeat 2 days running.
- **P2 · N-07 Verify kiwi** — AC: kiwi suggestion shows a number only after FDC 168153 verified via FDC API (`source:"USDA FDC 168153"`).
- **P2 · R-13 Slip recovery** (part of item 8) — AC: after over-target day show weekly average + "没关系，继续" (neutral, no red).

### R6 update (2026-10-15 ~04:55 SGT; full spec, copy, fixtures: docs/RESEARCH-R6.md)
v0.5.0 shipped N-06, R-08b, R-09, R-10 (per PM). **Correction:** R-01b expected value is **0.52 %/wk** (0.3875/74 = 0.5237), not 0.53.
- **P0 · R-01b Pace check (detailed)** — AC: pure `paceCheck({currentKg, goalKg, today, goalDate})` in core, local calendar days; returns `{status, days, kgPerWeek, pctPerWeek}`; status `ok|fast|slow|invalid-date|reached|gain|incomplete`; amber card for fast, info for slow, zh copy per R6.1; recomputes on new weight log. Tests (today 2026-10-15, tol 1e-3): A 74→58 @2027-07-31 → 289 d, 0.3875 kg/wk, 0.5237 %, ok · B @2027-01-31 → 108 d, 1.0370, 1.4014 %, fast · C 74→72 → 0.0484, 0.0655 %, slow · D goalDate=today → invalid-date · E goal=74 → reached · F goal=78 → gain (no warnings) · G today 2027-03-01, 66→58 → 152 d, 0.5582 %, ok.
- **P1 · R-04/R-12 Bedtime & caffeine (detailed)** — AC: profile `bedtime` (23:30), `dinnerGapH` (3, 2–4), `caffeineGapH` (6, 4–8), `sleepNudges` (on); pure `dinnerDeadline`/`caffeineCutoff` wrap past midnight; today card after 17:00; soft once/day note for meal ≥300 kcal after deadline; caffeine-tagged items after cutoff get note; copy per R6.2, no red. Tests: 23:30→20:30/17:30 · 01:00→22:00/19:00 · 22:00 gap2→20:00/16:00 · 00:00→21:00/18:00 · 21:10 450 kcal fires, 150 kcal not · coffee 17:29 no, 17:31 yes · nudges off → none.
- **P1 · A9 budget (test spec)** — AC as A9 plus: greedy swap = highest-cost protein day first (tie → lower index) → cheapest-per-protein-g option that is cheaper and used < 3 days; grams rescaled so protein/day unchanged; prices from `priceCNYPer500g` (estimates, user override); UI shows "超出预算 ¥x，已尽量替换" when overBudget. Fixture (synthetic test prices, FDC protein; R6.3): 7 days × 100 g protein from tuna (¥30/500 g), fixed ¥100 → start 316.50. budget 400 → 0 swaps, 316.50, overBudget false · 200 → tofu×3 egg×2 tuna×2, 194.78, false · 150 → tofu×3 egg×3 thigh×1, 157.67, true. Assert protein/day 100 ± 0.5 g, cost ± 0.05.
- **P2 · Protein-per-yuan column** — AC: foods view sortable "蛋白/元" = P/100 g × 5 / priceCNYPer500g, labelled 估算 (raw basis, shell/bone not adjusted); test egg 12.6 g @ ¥6 → 10.5 g/¥.
