# PROGRESS

- 2026-10-15 05:44 SGT — v0.7.4: A23 priceOf(food, id) in core/foods.js (COOKED_TO_RAW moved there, re-exported by plan.js): user override on a cooked id → raw-equivalent cookedPrice×k, else raw food's merged price; shoppingList/proteinCost/totals all use it. Probe flipped: thighRoasted:999 now raises the 1800/140 seed-0 week by >¥100 and budget 300 swaps thigh out; chickenThigh:999 unchanged; egg:7 beats ref 5.91. 食材 page labels cooked prices 按熟重. A24 makeIndex({base, partials}) (partials never create entries; legacy positional = all base) + foodIndexFromStore(S) used by ui/plan/review; precedence + page text tests. A27 today vs plan cost for 230 g cooked rice agree. 96 tests.
- 2026-10-15 05:41 SGT — v0.7.3 (Rulings R8): N-04 suggestFiber = filter fiberGain ≥3, kcal room, rice replacements only with logged riceCooked ≥150/200 g and ≤1 per output; sort score desc → lower kcalDelta → id; today passes riceG. Fixtures F1–F8 pass. R-10: reverted my v0.7.2 ≥5/week change to the ruled rule (≥10 in window, ≥3 per half); plateau returns reason flat|up|down|sparse; new plateauAdvice adds adherence gate (kcalOkDays ≥5 & logged ≥5 else actions steps/keep only), 14-day cooldown after minus/break decisions, break suppression (until ≥ window start). Review page uses it (copy 上升/基本持平, hides −kcal/维持周 when not adherent). Fixtures P1–P9 pass. Live real-browser check (puppeteer-core, 375px) of v0.7.1→v0.7.2: index/plan/review empty + seeded profile render, no hatch, no banners, no console errors; SW cache zfs-0.7.2 has 42 entries incl. sauces.js/prices.js; offline reload of all 3 pages works. 91 tests.
- 2026-10-15 05:40 SGT — v0.7.2: A8 leftovers test/a8b.test.js (fatWallet over budget, gutRisk low + monotonic in fiber, shoppingList rice 690 g cooked → 300 g raw, weekReview ±10% inclusive boundary + lowFatPct, plateau trend up/flat, lastNDates month/year/leap edges, normalizeProfile clamps/coercion, sleepNoteDay moot). R-10 plateau now requires ≥5 weigh-ins in each of the 2 weeks (AC) and returns trend; review copy says 上升 vs 基本持平. 375px headless screenshot pass: unified 7-tab nav on all 3 pages (plan/review previously differed), aria-current + document.title per tab, focus-visible outlines, checkbox sizing fix (was full-width 44px), small 改价 button, nowrap first table column, version shown on plan/review headers, clearer empty states (rice favourites, weights), copy-yesterday uses inline message instead of alert. 88 tests.
- 2026-10-15 05:36 SGT — v0.7.1: R-13 slip note shows 7-day average of logged days vs target (neutral copy); 食材 page 按每元蛋白排序 toggle (protein ≥5 g foods with a price); N-05 takeaway dishes get type:'dish', defaultPortionG, portionNote (shown in list); R-08b olive-oil fixture test (15 g = 132.6 kcal / 15 g fat / counted as oil); A14 test/keys.test.js asserts every KNOWN_KEYS entry is in the ARCHITECTURE §3 table (table updated: prices, wRange, onboardSeen, sauceOff, backup.preImport, logArchive shape; sleepNoteDay row removed). 80 tests.
- 2026-10-15 05:34 SGT — v0.7.0: R-11b data/sauces.js (12 FDC ingredients, s1–s6, TRAY_STEPS) + js/core/sauces.js sauceNutrition (computed; matches R7.1 within 0.1) and rotateSauces (fixtures: all → s1…s6 s1; no s5 → s1 s2 s3 s4 s6 s1 s2; only s1 → repeatWarning; no adjacent family repeats); plan page card: 6 steps (≈19 active min, 3 devices, 护腕), 禽肉 74 °C FSIS, sodium note, sauce checkboxes (`sauceOff`). R7.3 data/prices.js official refs (猪里脊 17.55 / 鸡蛋 5.91 SH 2026-10-13, 大米 3.00 FX) merged under user overrides; 食材 page labels source vs 估算; 基围虾 not applied (whole shrimp ≠ 虾仁). protein/¥ fixtures pass. N-07 kiwi FDC 168153 asserted. Fixed 腼→腌 typo. 77 tests.
- 2026-10-15 05:33 SGT — v0.6.9 (R7 UX P1s): UX-1 today shows 示例目标 card + chip when no stored profile (去设置 / 先用示例 → `onboardSeen`); UX-2 pure parseProfileForm (blank keeps previous, required 身高/体重/出生日期 > 0, inline #pfmsg, clamp note) replaces `+d[k]`; UX-3 pure matchFoods (startsWith > includes > pinyin > tag, top 5) + gramsFor (no unit → null) — quick-add shows inline candidates / 添加为自定义食材 link instead of alert, auto-switches to 克 when food has no unit. Headless seeded check: weight chart 4周 range renders 14 points; late meal + caffeine notes + 烹调油 35 g 偏多 render. 73 tests.
- 2026-10-15 05:32 SGT — v0.6.8: N-02 weight chart range chips 4/8/12 周/全部 (`wRange` key; MA7 computed on full history then windowed by calendar date — previously last 56 entries); R-08b today fat card shows 烹调油 g vs 膳食指南 25–30 g (from shared totals().oil). Also: 73a2787 briefly had a red test (price-override merge dropped nameless foods), fixed in 895a58a within minutes.
- 2026-10-15 05:32 SGT — v0.6.7: per-food price override — 食材 page 改价 button (prompt; blank restores estimate), stored as `prices` {id: CNY/500g} (KNOWN_KEYS); makeIndex now merges same-id entries, priceOverrides() feeds all 3 pages so plan cost, budget swaps (A9) and review cost use user prices; unknown ids ignored. 71 tests.
- 2026-10-15 05:30 SGT — v0.6.6: A8 test/a8.test.js (female BMR −161, TDEE per activity factor, kcal<BMR warning, BMI≥30 → goal-weight protein, blend needsSoak/waterRatio). A11 js/core/retention.js compact/compactStore: logs older than 180 d → logArchive.YYYY-MM daily totals {kcal,protein,fat,carbs,fiber,cost,water,n}, archive written before any log removed; runs on index load; test with 400 synthetic days (181 kept / 219 archived, export has both, idempotent). 70 tests. R-15/N-04 note: the BACKLOG AC test (plan day → oats40/peas100/broc200 top 3) contradicts its own ranking formula fiberGain/max(kcalDelta,20) with R5.2 values (formula gives sweetpot/brownhalf/spinach); left ranking as shipped (replacements first, then ratio) pending research clarification.
- 2026-10-15 05:29 SGT — v0.6.5: A19 portionDay rewritten as closed-form search (totals linear in staple/protein g): breakfast ×1/0.75/1.25/0.5 × kiwi 100/0/200 × staple 50–350 → best protein g (60–450, ≥ floor), lexicographic protein floor → kcal distance → default knobs; returns fit ok|kcal-high|kcal-low|protein-low and bfMult/kiwiG. planWeek returns infeasible when protein*4 > 45% kcal; plan page explains. test/feasibility.test.js: kcal {1400,1500,1617,1800,2000,2200} × protein {110,140,160} × seeds 0–8 — every day with protein*4 ≤ 40% kcal passes checkWeek (was 247/945 failing); others flagged fit≠ok. Note: protein cap per meal raised 400→450 g to cover tofu/seabass days at 1617/160. 64 tests.
- 2026-10-15 ~05:29 SGT — v0.6.4: A18 bootStore attaches storage-error listener before migrate, banners for migrate abort (<SCHEMA_VERSION) and non-persistent storage (store.isPersistent probe). A17 importAll: incoming = envelope schema ?? data.version ?? 1, rejects > current for both formats; backup.preImport (abort if unwritable) → replace (clear non-backup keys) → whitelist+type-checked write → set version → migrate; 撤销上次导入 button (store.undoImport). A20 precache with cache:'reload'; non-module data-zfs-hatch script on all 3 pages (script error or empty #view 4 s after load → 清除离线缓存并重新加载; no storage access); controllerchange toast. A21 mergeProfileEdit (writers use stored profile). A22 js/core/dates.js (localDate/addDays/dayNum) replaces 6 copies. A14: dropped unused sleepNoteDay key. 62 tests; smoke OK (no false hatch).
- 2026-10-15 ~05:27 SGT — v0.6.3: A6 done in 7 commits (shared→veg→rice→foods→plate→me→today): js/ui.js (helpers, lazy Map food index, setRender/rerender) + js/views/*.js; app.js is a 46-line router. Each step: node --check, 56 tests, headless smoke of 6 index tabs + plan + review. Note: box workspace was reset once (~05:25) — re-cloned state from origin, nothing lost.
- 2026-10-15 ~05:15 SGT — v0.6.2: A13 importAll sets version (payload version / envelope schema / else 1) so v2 migration runs on legacy imports; migrate() aborts without bump if backup.preMigration write fails; migrate({today}) injectable; single backup key. A15 test/sw.test.js (every html/js/data/css/manifest/icon in ASSETS, no dups, all exist). A16 test/planweek.test.js (6 seeds × 6 budgets: dinner(d)→lunch(d+1) incl. d=6→lunch(0), ≤3 uses after swaps, protein ok, cost ≤ unbudgeted, overBudget consistent). SW revalidation passed to e.waitUntil. 56 tests.
- 2026-10-15 ~05:10 SGT — v0.6.1: A4 confirmed (profile.js used by all pages; test targets(normalize({}))==targets(defaults)); A5 js/core/foods.js makeIndex (Map) + shared totals() replacing app totals / plan sum / review dayTotals; A10 test/data.test.js (unique ids, source+verified, kcal≈4P+4C+9F ±15%, recipe ingredients exist) — all pass with no data edits; P2 protein-per-yuan on 食材 page (egg 12.6 g @ ¥6 → 10.5 g/¥). 51 tests pass; smoke OK. Housekeeping: BACKLOG items 1–10 collapsed ✅; stale Pages paragraph replaced.
- 2026-10-15 ~05:08 SGT — v0.6.0 (shell back): GitHub Pages enabled (main /) → https://grot666.github.io/zuofansong/. A3 single VERSION (js/core/version.js; sw CACHE zfs-0.6.0; test/version.test.js enforces CACHE/CHANGELOG/no stray v0.x.y). A2 store: injectable backend, MIGRATIONS registry (SCHEMA 2: breakFrom→breakState, pre-migration backup), set() → false + `storage-error` event (banner), envelope export, KNOWN_KEYS import whitelist, newer-schema reject; test/store.test.js. A7: every page entry = bootStore (migrate → resolveBreak) → render → registerSW (js/boot.js); SW navigations network-first 3 s → cache → index.html, assets SWR, no HTML fallback for assets. N-03 ×0.5/×1/×1.5 chips (core/portion.js). R-01b paceCheck (core/profile.js) fixtures A–G pass. A12 startBreak/resolveBreak (core/breaks.js), 维持周 auto-reverts after 7 days. A9 plan.js split selectWeek/portionDay/generateWeek + applyBudget (R6.3 fixture exact: 316.50 / 194.78 / 157.67 + step costs) + planWeek (dinner(d)+lunch(d+1) swapped together); plan page uses budget. R-04/R-12 bedtime/caffeine (core/sleep.js; profile 睡觉时间 + toggle; 4 caffeine drinks added → foods 131). 44 tests pass locally; headless Chrome smoke of index/plan/review OK.
- 2026-10-15 ~04:45 SGT — v0.5.0: 每周复盘 page (review.html + js/core/review.js, N-06): 7-day adherence, avg kcal/protein/fat/fiber/water, daily oil vs 膳食指南 25–30 g (R-08b), low-value fat %, cost & takeaway count, tuna weekly counter light ≤339 g / albacore ≤113 g (R-09), plateau check (R-10: ≥10 logs in 14 d, MA flat), one decision (−125 kcal / steps / 维持周 / sauce) with confirm. SW caches only ok+basic responses. Nav: 菜单 tab in main nav; 复盘 link in footer. CI run #3 green.
- 2026-10-15 ~04:40 SGT — CI workflow (.github/workflows/ci.yml): node --check every JS + node --test. Runs #1–#3 all green (tests incl. plan generator, fiber, weight, review).
- 2026-10-15 ~04:35 SGT — v0.4.0: foods 127 (data/foods3.js: 20 Shanghai takeaway/breakfast estimates from R5.1 + kiwi USDA FDC 168153 + 12 CFCT items); recipes 34 (renamed r9 水煮冬瓜汤, r24 蒸山药胡萝卜; +微波南瓜, 清炒荷兰豆); fiber swaps (N-04, 糙米 corrected +2.4 g/−14 kcal per 200 g); MA7 weight chart (N-02); meal templates 1-tap + 撤销 (N-03 partial); takeaway tips; slip-recovery copy (R-13).
- 2026-10-15 ~04:25 SGT — v0.3.0: 一周菜单 (plan.html + js/core/plan.js), shopping list, 周日备餐.
- 2026-10-15 ~04:20 SGT — v0.2.0: 懒人蔬菜 32 recipes; foods ≈100 (22 USDA FDC verified); protein modes (default fixed 140 g); 记入我的计划日; fiber flag; rice safety notes.
- 2026-10-15 ~04:00 SGT — v0.1.0 scaffold: features 1–8 basic, PWA, export/import/reset, 更新日志.

Current state: Pages live https://grot666.github.io/zuofansong/ (200 on index/plan/review); CI green; headless-Chrome smoke OK on local and live.
Current gaps (07:20, v0.10.36): 77/137 foods unverified (7 of them ≈ with an FDC comparison note; most of the rest are 外食/饮品 composites with no FDC row); prices are estimates (per-food override exists); meat per meal soft-capped at 250 g (R10-S2, MEAT_OVER_G; hard cap 300); 烤红薯 ≤3 days/week; fiber ≥25 g on ~77% of grid days (target 80% → oats breakfast option next); R-15 covered in substance (fiber-low flag, N-04 ranked swaps v0.7.3, planner fiber preference R10-F1 v0.10.25) — no open sub-item.

- 05:45 v0.7.5 A25 protein cap + add-ons, 97 tests green.

- 05:45 v0.7.6 A26 import/compact/undo safety.

- 05:46 a11y form-label audit (375px, empty + seeded, 8 views): 0 unlabeled inputs/selects, 0 empty buttons/links. Static scan: no unlabeled markup.

- 05:49 v0.7.7 G1: shared core mealScores; plan page shows 4-dimension scores per lunch/dinner.

- 05:50 v0.7.8 G2: plan add-on may use whey powder when usesPowder (≤ maxScoops), after whole-food add-ons.

- 05:51 v0.7.9 G3: backup reminder (lastExport/backupSnooze keys, pure backupDue + test).

- 05:51 v0.8.0 G4: 4 canteen set-meal estimates (verified:false); 137 foods.

- 05:54 v0.8.1 UX-4 shared nav (js/nav.js) + reviewDue card; UX-5 --nav-h + safe-area padding, toast; UX-11 5 icon items ≥44px with 搭配 sub-nav.

- 05:55 v0.8.2 UX-6: pure saveProfile {ok, changed, clamped}; toast + scroll/highlight 每日目标.

- 05:56 v0.8.3 UX-7: sticky 菜单/购物清单/备餐 anchors (#menu/#list/#prep), days in <details>, only today open.

- 05:58 v0.8.4 UX-8 update toast once per version (updateSeen); UX-9 换一套 undo toast (regenWeek).

- 05:59 v0.8.5 UX-13 proteinFill (≤3 eggs, ≤1 serving others); UX-14 wristSafe on every recipe/tray step, 拌黄瓜片, gentler prep copy.

- 06:00 v0.8.6 UX-12: quickChips (recents, foodUse counts, curated padding) + per-row log button in 食材库.

- 06:02 v0.8.7 UX-10: 3-step onboarding (onboardStep/saveOnboardStep saving only step keys, pace text, first-meal templates, skip).

- 06:04 v0.8.8 Meat-lean planner: meat = protein floor, 0.5/g meat penalty, more add-ons, tuna ≤2/week; 1617/160 avg meat 283→233 g.

- 06:04 v0.8.9 Meal scores steer plan: rankVeg by mealScores; seed 0 = 14 top recipes, seeds rotate by 14.

- 06:09 v0.9.0 A29: persist onboarding step (onboardStep key); resumes at step 2/3 after reload.

- 06:10 v0.9.1 A28: fit 'protein-high' → 'protein-low'; export FITS.

- 06:11 v0.9.2 A30: drop dead data/makeIndex imports from views/app; review.js dates via dayNum/addDays; guard test.

- 06:11 A32 perf guard test added (planWeek median ~38 ms in Node, limit 150 ms).

- 06:11 v0.9.3 A31: tasty flag in data (incl. canteen meat sets), scores.js reads it; golden score test.

- 06:12 v0.9.4 Snack variety: per-week repeat penalty on add-on items (≤4 days each), new add-ons milk/千张/虾/豆干.

- 06:13 v0.9.5 Budget swaps weigh meal scores (best-scoring protein that fits budget; else cheapest).

- 06:15 v0.9.6 Plan tips (planTips): budget swaps by score, add-on rotation; BACKLOG Next / PROGRESS gaps refreshed.

- 06:18 v0.9.7 A33 (P0): one weekly tuna gram budget shared with review; tuna add-on only; grid test incl. 0.8× budget.

- 06:19 v0.9.8 R9-1 (P0): budget loop on real regenerated cost (≤7 rounds); A34: unfit days reported + ⚠ tip.

- 06:20 v0.9.9 R9-2 plan uses kiwiUSDA; R9-3 eggWhite = FDC 172183 verified.

- 06:22 A35 budget-score fixtures (real data pin, tie-break, final-swap-only, monotonic, price→score) — tests only.

- 06:25 v0.10.0 R9-4 verify-or-≈ for generator foods (milk, seabass FDC); R9-5 fdcCompare gap test + notes; budget rounds monotonic.

- 06:26 v0.10.1 R9-6: price refs 2026-10-14 (porkLoin 17.50, egg 5.89, rice 2.81); estimate labels for unofficial protein prices.

- 06:27 v0.10.2 R9-7: removed never-chosen milk/千张/豆干 add-ons; 0.9.4 copy corrected; usage test.

- 06:27 v0.10.3 R9-8: meatNote on lunch/dinner > 250 g cooked meat/fish.

- 06:27 v0.10.4 R9-9: wristSafe:false + notes on 茭白切片 and 丝瓜削皮切块.

- 06:28 v0.10.5 R9-10: maxPrepMin, distinct-veg metric, budget validation.

- 06:29 v0.10.6 A36 golden rankings/add-on scores; A37 explicit tasty booleans; A38 rankProteins documented as snapshot helper + seed-only test; A39 determinism tests.


- 06:37 v0.10.7 Weekly plan reuses vegetables (shorter shopping list); pasta/sweet potato FDC ids confirmed; budget overshoot revert

- 06:39 v0.10.8 Walkthrough fixes: onboarding goal suggestion, select-on-focus, 44px checkbox/radio rows

- 06:42 v0.10.9 planWeek ~10x faster (precomputed base); sole (龙利鱼) added to PROTEINS

- 06:43 v0.10.10 Review: no deeper deficit below BMR; no backup nag right after import

- 06:45 v0.10.11 BACKLOG Next line refreshed

- 06:45 v0.10.12 R-01 remainder: %BW/week pace in onboarding, fast-loss review warning

- 06:45 v0.10.13 R-11 remainder: per-weekday 30-min one-tray evening variant

- 06:46 v0.10.14 Verify batch: top-10 generator foods FDC-verified or ≈ with FDC comparison

- 06:49 v0.10.15 A40: no-veg guard (pickReuse/selectWeek hang), infeasible no-veg

- 06:49 v0.10.16 A41: afterImport sets lastExport = max(imported, today)

- 06:50 v0.10.17 A42: canDeepen {ok, reason} with per-reason copy; hidden during 维持周

- 06:50 v0.10.18 A43: perf guard median<25 ms, grid p95<40 ms

- 06:50 v0.10.19 A44: veg-reuse snapshots, revert fixture, plangrid invariants

- 06:51 v0.10.20 A45: split plan.js into plan/{select,portion,budget,shopping}.js behind facade

- 06:51 v0.10.21 A46: bounded loops in core + grep test

- 06:53 v0.10.22 plangrid time guard for slower CI runners

- 06:56 v0.10.23 CI runs tests serially so perf guards measure the planner

- 06:59 v0.10.24 R10-D1: data fixes and citations, verified chip twins, Atwater test

- 07:02 v0.10.25 R10-F1: fiber-aware portioning (veg multiplier, staple alternatives, fiberNote)

- 07:03 v0.10.26 R10-F2: weekly fiber line

- 07:03 v0.10.27 R10-S1: shorter shopping list (twins merged, 常备 line, small items flagged)

- 07:05 v0.10.28 R10-S2: per-meal meat cap via score penalty

- 07:07 v0.10.29 A47: no-protein guard (infeasible no-protein, never throws)

- 07:08 v0.10.30 A48: npm test serial like CI

- 07:08 v0.10.31 A50: TUNA extracted to core/tuna.js

- 07:10 v0.10.32 A51 plangrid determinism on every cell (split file)

- 07:10 v0.10.33 A52 remove orphan applyBudget comment and unused sum helper

- 07:11 v0.10.34 A53 export SHOP_ALIAS/twinOf; split fiber preference (plan/fiber.js, plan/day.js)

- 07:13 v0.10.35 sweet-potato variety cap (≤3 days/week) with 杂粮 staples and peas side

- 07:17 v0.10.36 VER-20 verify batch: 20 foods to FDC SR Legacy, 3 kept ≈
