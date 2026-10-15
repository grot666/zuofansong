# RESEARCH R14 — fiber-dip probe (R13-3), greenTea/≈ test rules (R13-4), post-A74 alias scan, remaining unverified

Base: `main` @ `9b73550` (v0.10.57). Docs only; data/code changes are specs for the engineer. Method: fresh shallow clone + `node`; levers applied by mutating exported arrays **in the probe process only** (`STAPLES`, `FIBER_SIDE`, `VEG_MULTS`, `KIWI_G`), never in the repo. Script: bot box `/workspace/r14/r14.mjs` (`K=1500 PR=140 node r14.mjs <lever>`).

## R14.1 Fiber dip probe (12 seeds × 7 days = 84 days, no budget, breakfast rotate unless noted)

| lever (1500/140) | ≥ 25 g days | avg fiber g | fit misses | avg protein | cost ¥/wk |
|---|---|---|---|---|---|
| base | 69.0% | 25.7 | 0/84 | 140.8 | 229 |
| brown rice forced over white (STAPLES riceCooked→brownRiceCooked) | 77.4% | 25.9 | 0 | 140.9 | 228 |
| **peas side 80 → 120 g/meal** | **90.5%** | 26.8 | 0 | 141.0 | 226 |
| peas side 80 → 160 g/meal | 91.7% | 28.6 | 0 | 140.9 | 228 |
| more veg (VEG_MULTS + ×2.5, ×3) | 70.2% | 25.9 | 0 | 140.9 | 229 |
| high-fiber fruit (KIWI_G + 300 g) | 72.6% | 25.7 | 0 | 140.9 | 230 |
| lower protein share: 1500/130 | 85.7% | 26.2 | 0 | 130.9 | 214 |
| lower protein share: 1500/120 | 85.7% | 26.7 | 0 | 121.0 | 201 |
| oats breakfast | 77.4% | 25.9 | 0 | 140.8 | 225 |
| brown + kiwi 300 | 81.0% | 25.9 | 0 | 140.9 | 230 |
| peas 120 + brown | 88.1% | 27.2 | 0 | 141.0 | 226 |

Peas 120 g/meal at other targets: 1800/140 95.2% → **96.4%**; 1400/110 83.3% → **94.0%**; 0 fit misses; cost 1800 ¥229 → 229, 1400 ¥185 → 187.
Side effect to watch: peas grams on peas days (incl. recipe 青豆玉米粒): base avg 160 g/day (max 235); peas 120 → avg 235 g/day (max 315), on 48/84 days at 1500/140. Peas = FDC 170419 (app, verified). Palatability/gas tolerance of ~235 g peas/day is **not sourced** → mitigation in R14-1 AC (alternate with 毛豆/速冻什锦蔬菜).
Why veg ×3 barely helps: the extra veg portions are mostly low-fiber leafy/gourd recipes and they compete for kcal room; why "peas-first" ≈ "more peas": the side is already applied on 22/26 low days (R13-3), so its size, not its order, is the limit.

## R14.2 R13-4 spec — greenTea + ≈ lock
- greenTea: app 1/0.2/0/0; FDC 171917 "Beverages, tea, green, brewed, regular" 1/0.22/0.0/0.0/0.0 (API 2026-10-15) → set `verified:true`, protein 0.22.
- Test rules: (a) every food with `verified:false` has non-empty `source` and, if `cat` is 外食/饮品, a `reason` (or source text containing 估算/estimate) — composite dishes: "组合菜，商家差异大，无 FDC/CFCT 对应"; (b) any `verified:true` food's source matches `/USDA FDC \d+|平台 #\d+/`; (c) no `cat:'外食'` food is `verified:true` unless its source matches (b); (d) chayedan source mentions "proxy FDC 173424".

## R14.3 Post-A74 alias scan
- `matchFoods` (8 results): 菠菜 → `spinach, spinachUSDA`; 猕猴桃 → `kiwi, kiwiUSDA, kiwiGold`; 鸡蛋 → `egg` only ✓; 西兰花 → `broccoli` only ✓. Duplicate display names after stripping brackets: 菠菜 (spinach/spinachUSDA), 猕猴桃 (kiwi/kiwiUSDA); 鸡胸肉/去皮鸡腿肉 raw vs (熟) are intentional (raw vs cooked).
- Values: spinach CFCT 28/2.6/0.3/4.5/1.7 vs spinachUSDA FDC 168462 23/2.86/0.39/3.63/2.2; kiwi CFCT 61/0.8/0.6/14.5/2.6 vs kiwiUSDA FDC 168153 61/1.14/0.52/14.66/3.0. Code uses the USDA ids: `portion.js` snack `kiwiUSDA`, `fiber.js` swaps `spinachUSDA`/`kiwiUSDA`, recipe r17 `spinachUSDA`.
- Alias choice (same as A74 egg/broccoli): canonical = everyday id (`spinach`, `kiwi`) carrying the FDC values; `spinachUSDA`/`kiwiUSDA` get `aliasOf`. Not identical values → this changes numbers slightly (spinach −5 kcal/100 g, kiwi fiber +0.4) → note in DECISIONS.
- A77: r5/r10/r16/r19 use `egg`, r23 `broccoli` — **both canonical after A74, so that part of A77 is already met**. Remaining A77 work appears only after the spinach/kiwi collapse: r17 `spinachUSDA`, `fiber.js` and `portion.js` references must move to canonical ids.

## R14.4 Remaining unverified foods reached by the planner
Grid 1400/110, 1500/140, 1800/140 × rotate/oats × seeds 0–5: only 10 unverified ids: soy 84, basa 72, porkLoin 72, leanBeef 60, yogurt 57, sesamePaste 12, oyster 12, woodEar 6, jimaocai 6, kelp 6 (verified 69/136). Conclusions already in R12-4: woodEar 平台 #580 and kelp #605 match app → cite; **jimaocai → 平台 #460 (19/2.7/0.2/2.6/2.1) still unapplied**; the other seven stay ≈ (reasons in RESEARCH-R12 §R12.3). No new 15-batch is needed — the planner set is exhausted.
