# CHANGELOG

## v0.10.63
- A84 pins R14-1/A61 fiber floors (≥90% overall, ≥80% per target; 90.0/96.0/93.5%)

## v0.10.62
- A79 deterministic leftover pack size on key collisions

## v0.10.61
- A70 release script re-tests after a code-bearing retry rebase; single conflict-marker helper

## v0.10.60
- R14-1 peas side 120 g (never trades fit); A61 measured fiber-days test (92.9%)

## v0.10.59
- A67 tripLists + per-trip costs in core; listLines = rendered rows

## v0.10.58
- A75 hardened source-citation tests; greenTea verified

## v0.10.57
- A68 leftover hints: shopId keys, multi-pack, pantry skipped, week recipe ids

## v0.10.56
- A66 closed store field (fresh/frozen/keeps/pantry); trip 2 reads it

## v0.10.55
- A65 social reserve from concrete planned-day levers; milkSkim

## v0.10.54
- A74 part 1: egg/broccoli USDA twins are aliases; schema v3 moves alias prices

## v0.10.53
- A64 plan-day fiber line (peas amount) + quoted-${ lint; A69 fiberNote floors value

## v0.10.52
- R11-6 rest: yam/jiaobai cite 平台 #525/#519; every verified food cites an FDC or 平台 id

## v0.10.51
- R11-4 opened-pack leftover hints (user pack sizes)

## v0.10.50
- R11-3 two-trip shopping list (perishables for Fri–Sun on trip 2; frozen fish trip 1)

## v0.10.49
- R11-5 聚餐/hotpot mode: fat pre-allocation, protein-first order, dip fat, neutral next-day line

## v0.10.48
- A59 sweet potato on ≤1 batch by construction (test); staple swaps 0 on grid

## v0.10.47
- A56 perf guards calibrated under parallel runs; CI strict

## v0.10.46
- A58/A62 plangrid invariants + snapshots cover SP cap, fiber side, breakfast mode

## v0.10.45
- A60 restore spcap share assertion; lint guard for asserts hidden in comments

## v0.10.44
- A57 release helper in repo (scripts/release.mjs), fail-closed

## v0.10.43
- UX: plan controls 2×2 grid at 375 px (no truncated selects)

## v0.10.42
- breakfast preference: rotate or oats every day (opts.breakfast)

## v0.10.41
- R11-2 no staple 3 days running; peas side on any fiber-short day (about 85–90% of days ≥25 g)

## v0.10.40
- R11-1 sweet potato ≤175 g per meal (≤350 g/day)

## v0.10.39
- A55 staple decided per 2-day batch; SP cap per batch; fiber days 77%→84%

## v0.10.38
- A54 single source for fiber targets; swap numbers computed from food data

## v0.10.37
- VER-15 verify batch: 8 FDC, 7 ≈ with source diff, Atwater coverage

## v0.10.36
- VER-20 verify batch: 20 foods to FDC SR Legacy, 3 kept ≈

## v0.10.35
- sweet-potato variety cap (≤3 days/week) with 杂粮 staples and peas side

## v0.10.34
- A53 export SHOP_ALIAS/twinOf; split fiber preference (plan/fiber.js, plan/day.js)

## v0.10.33
- A52 remove orphan applyBudget comment and unused sum helper

## v0.10.32
- A51 plangrid determinism on every cell (split file)

## v0.10.31
- A50: TUNA extracted to core/tuna.js

## v0.10.30
- A48: npm test serial like CI

## v0.10.29
- A47: no-protein guard (infeasible no-protein, never throws)

## v0.10.28
- R10-S2: per-meal meat cap via score penalty

## v0.10.27
- R10-S1: shorter shopping list (twins merged, 常备 line, small items flagged)

## v0.10.26
- R10-F2: weekly fiber line

## v0.10.25
- R10-F1: fiber-aware portioning (veg multiplier, staple alternatives, fiberNote)

## v0.10.24
- R10-D1: data fixes and citations, verified chip twins, Atwater test

## v0.10.23
- CI runs tests serially so perf guards measure the planner

## v0.10.22
- plangrid time guard for slower CI runners

## v0.10.21
- A46: bounded loops in core + grep test

## v0.10.20
- A45: split plan.js into plan/{select,portion,budget,shopping}.js behind facade

## v0.10.19
- A44: veg-reuse snapshots, revert fixture, plangrid invariants

## v0.10.18
- A43: perf guard median<25 ms, grid p95<40 ms

## v0.10.17
- A42: canDeepen {ok, reason} with per-reason copy; hidden during 维持周

## v0.10.16
- A41: afterImport sets lastExport = max(imported, today)

## v0.10.15
- A40: no-veg guard (pickReuse/selectWeek hang), infeasible no-veg

## v0.10.14
- Verify batch: top-10 generator foods FDC-verified or ≈ with FDC comparison

## v0.10.13
- R-11 remainder: per-weekday 30-min one-tray evening variant

## v0.10.12
- R-01 remainder: %BW/week pace in onboarding, fast-loss review warning

## v0.10.11
- BACKLOG Next line refreshed

## v0.10.10
- Review: no deeper deficit below BMR; no backup nag right after import

## v0.10.9
- planWeek ~10x faster (precomputed base); sole (龙利鱼) added to PROTEINS

## v0.10.8
- Walkthrough fixes: onboarding goal suggestion, select-on-focus, 44px checkbox/radio rows

## v0.10.7
- Weekly plan reuses vegetables (shorter shopping list); pasta/sweet potato FDC ids confirmed; budget overshoot revert

## v0.10.6
- A36 golden rankings/add-on scores; A37 explicit tasty booleans; A38 rankProteins documented as snapshot helper + seed-only test; A39 determinism tests.

## v0.10.5
- R9-10: maxPrepMin, distinct-veg metric, budget validation.

## v0.10.4
- R9-9: wristSafe:false + notes on 茭白切片 and 丝瓜削皮切块.

## v0.10.3
- R9-8: meatNote on lunch/dinner > 250 g cooked meat/fish.

## v0.10.2
- R9-7: removed never-chosen milk/千张/豆干 add-ons; 0.9.4 copy corrected; usage test.

## v0.10.1
- R9-6: price refs 2026-10-14 (porkLoin 17.50, egg 5.89, rice 2.81); estimate labels for unofficial protein prices.

## v0.10.0
- R9-4 verify-or-≈ for generator foods (milk, seabass FDC); R9-5 fdcCompare gap test + notes; budget rounds monotonic.

## v0.9.9
- R9-2 plan uses kiwiUSDA; R9-3 eggWhite = FDC 172183 verified.

## v0.9.8
- R9-1 (P0): budget loop on real regenerated cost (≤7 rounds); A34: unfit days reported + ⚠ tip.

## v0.9.7
- A33 (P0): one weekly tuna gram budget shared with review; tuna add-on only; grid test incl. 0.8× budget.

## v0.9.6
- Plan tips (planTips): budget swaps by score, add-on rotation; BACKLOG Next / PROGRESS gaps refreshed.

## v0.9.5
- Budget swaps weigh meal scores (best-scoring protein that fits budget; else cheapest).

## v0.9.4
- Snack variety: per-week repeat penalty on add-on items (≤4 days each), new add-ons 虾 (milk/千张/豆干 removed in v0.10.2: never chosen).

## v0.9.3
- A31: tasty flag in data (incl. canteen meat sets), scores.js reads it; golden score test.

## v0.9.2
- A30: drop dead data/makeIndex imports from views/app; review.js dates via dayNum/addDays; guard test.

## v0.9.1
- A28: fit 'protein-high' → 'protein-low'; export FITS.

## v0.9.0
- A29: persist onboarding step (onboardStep key); resumes at step 2/3 after reload.

## v0.8.9
- Meal scores steer plan: rankVeg by mealScores; seed 0 = 14 top recipes, seeds rotate by 14.

## v0.8.8
- Meat-lean planner: meat = protein floor, 0.5/g meat penalty, more add-ons, tuna ≤2/week; 1617/160 avg meat 283→233 g.

## v0.8.7
- UX-10: 3-step onboarding (onboardStep/saveOnboardStep saving only step keys, pace text, first-meal templates, skip).

## v0.8.6
- UX-12: quickChips (recents, foodUse counts, curated padding) + per-row log button in 食材库.

## v0.8.5
- UX-13 proteinFill (≤3 eggs, ≤1 serving others); UX-14 wristSafe on every recipe/tray step, 拌黄瓜片, gentler prep copy.

## v0.8.4
- UX-8 update toast once per version (updateSeen); UX-9 换一套 undo toast (regenWeek).

## v0.8.3
- UX-7: sticky 菜单/购物清单/备餐 anchors (#menu/#list/#prep), days in <details>, only today open.

## v0.8.2
- UX-6: pure saveProfile {ok, changed, clamped}; toast + scroll/highlight 每日目标.

## v0.8.1
- UX-4 shared nav (js/nav.js) + reviewDue card; UX-5 --nav-h + safe-area padding, toast; UX-11 5 icon items ≥44px with 搭配 sub-nav.

## v0.8.0
- G4: 4 canteen set-meal estimates (verified:false); 137 foods.

## v0.7.9
- G3: backup reminder (lastExport/backupSnooze keys, pure backupDue + test).

## v0.7.8
- G2: plan add-on may use whey powder when usesPowder (≤ maxScoops), after whole-food add-ons.

## v0.7.7
- G1: shared core mealScores; plan page shows 4-dimension scores per lunch/dinner.

## v0.7.6
- A26: compactStore is a no-op while backup.preImport exists; import→compact→undo round-trip test. Archives are not re-priced.

## v0.7.5
- A25: per-meal protein cap MAX_PROTEIN_G_PER_MEAL=300 g; egg-white/yogurt/egg/tofu add-ons (加餐) are tried before raising meat; tofu mains scale 1.5×.

## 0.7.4 — 2026-10-15
- A23 priceOf（熟重价×k 折算生重）；A24 foodIndexFromStore；A27 今日/菜单花费一致。

## 0.7.3 — 2026-10-15
- N-04 按 Rulings R8 排序；R-10 平台期 reason/依从度/14 天冷却/维持周抑制。

## 0.7.2 — 2026-10-15
- 375px UX 打磨、统一导航、无障碍（aria-current、焦点样式、页面标题）；R-10 平台期 ≥5 次/周；A8 剩余测试。

## 0.7.1 — 2026-10-15
- R-13 超标日显示 7 日平均；每元蛋白排序；N-05 外卖菜份量说明；A14 存储键文档同步测试。

## 0.7.0 — 2026-10-15
- R-11b 一盘烤晚餐模板 + 酱汁轮换（data/sauces.js，热量按 FDC 计算）；R7.3 价格参考（data/prices.js）；N-07 猕猴桃数据测试。

## 0.6.9 — 2026-10-15
- UX-1 首次使用示例目标提示；UX-2 资料空字段保留原值；UX-3 快速记录匹配与单位提示。

## 0.6.8 — 2026-10-15
- N-02 体重图时间范围；R-08b 今日用油。

## 0.6.7 — 2026-10-15
- 每种食材可自定价格（prices 键），全站花费计算使用。

## 0.6.6 — 2026-10-15
- A11 记录保留：>180 天的日记录压缩到 logArchive.YYYY-MM；A8 核心测试补齐。

## 0.6.5 — 2026-10-15
- A19：菜单份量求解（早餐 ×0.5–1.25、猕猴桃 0/100/200 g、主食、蛋白），不可行时提示。

## 0.6.4 — 2026-10-15
- A17 导入=替换+撤销；A18 迁移失败/非持久存储提示；A20 离线缓存逃生按钮、更新提示、预缓存绕过 HTTP 缓存；A21 资料保存不再固化默认值；A22 core/dates.js。

## 0.6.3 — 2026-10-15
- A6：app.js 拆为 js/ui.js + js/views/{today,plate,veg,rice,foods,me}.js（46 行路由）。

## 0.6.2 — 2026-10-15
- 导入无版本号的旧备份会运行迁移；迁移前备份失败则不升级；SW 后台更新用 waitUntil。

## 0.6.1 — 2026-10-15
- 食材页显示每元蛋白（g/¥）。内部：js/core/foods.js 统一索引与合计；test/data.test.js 数据自检。

## 0.6.0 — 2026-10-15
- 常用餐 ×0.5/×1/×1.5 份量；一周菜单按预算自动换便宜蛋白（晚餐+次日午餐一起换）。
- 目标节奏检查（%/周，偏快/偏慢/日期无效/已达成）。
- 睡前提醒：晚饭截止、咖啡因截止（可关）；新增咖啡/拿铁/奶茶/绿茶。
- 维持周 7 天后自动恢复缺口；存储失败提示；备份信封格式+白名单导入；Service Worker 策略更新。

## 0.2.0 — 2026-10-15
- 懒人蔬菜 32 道：油克数、步骤、时间、成本、营养；筛选 ≤5分钟 / 不开火 / 微波 / 护腕 / 一锅。
- 食材约 100 种，22 种按 USDA FDC API 核实（source: USDA FDC <id>），熟重条目（米饭/鸡腿/虾）。
- 蛋白目标模式：自定（默认 140 g，来自计划 130–160 g）/ 按体重 / 按去脂体重。
- 一键记入“我的计划日”；纤维不足提示（燕麦/青豆/猕猴桃）。
- 杂粮饭：食品安全提示（FSA：1 小时内冷藏、24 小时内吃完、只加热一次）；说明杂粮不更低热量。
- 体重 7 次平均；目标体重时体脂推算。本地日期修正（之前用 UTC 日期）。

## 0.1.0 — 2026-10-15
- 首个版本：我的目标、食材库、杂粮饭配比器、一餐搭配、今日饮食、脂肪预算、蛋白补充、饮水与如厕舒适度。
