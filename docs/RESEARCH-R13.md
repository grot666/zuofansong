# RESEARCH R13 — 聚餐 fat levers (A65), storage class map (A66), fiber dip at 1500/140, takeaway/drink conclusions

Base: `main` @ `0f08c9f` (v0.10.52). Docs only. Method: fresh shallow clone + `node` on shipped core. Scripts: bot box `/workspace/r13/r13.mjs` (levers), `r13b.mjs` (fiber); copy to repo root and `node r13.mjs`. Sources: app data (`data/foods*.js`, sources as stated there), FDC API (DEMO_KEY, abridged, 2026-10-15).

## R13.1 A65 — levers that actually free fat on real plan days
Fixed shares today: `preAllocate({kcal:1800, protein:140, fat:50}, {meal:'dinner'}).reserveFatG = 16`; 1400/110 (fat 39) → 12. Real breakfast fat (1800/140 rotate, seeds 0–5, 42 days): median **20.1 g** (18.3–25.5); the fixed breakfast share after cut is 50×0.25×0.5 ≈ 6 g — not reachable by following the plan.

Per typical portion, swap at **equal protein** (values per 100 g from app data: eggUSDA 143/12.6/9.51 FDC 171287; eggWhite 52/10.9/0.17 FDC 172183; thighRoasted 179/24.8/8.15 FDC 172388; breastRoasted 165/31/3.57 FDC 171477; porkLoin 155/20.2/7.9 CFCT; qianzhang 262/24.5/16 平台#345; tofuFirm 99/12.2/4.8 平台#334; doufugan 143/16.2/3.6 平台#346; milk 61/3.15/3.25 FDC 171265; skim milk 34/3.37/0.08 **FDC 171269 — not in app data**):

| lever | portion → replacement | fat freed g | protein Δ | kcal Δ |
|---|---|---|---|---|
| whole egg → egg white | eggUSDA 100 g → eggWhite 116 g | 9.3 | 0 | −83 |
| | egg 50 g (1 个) → eggWhite 58 g | 4.7 | 0 | −41 |
| whole → skim milk | milk 250 g → skim 250 g (same g) | 7.9 | +0.55 | −68 |
| thigh → breast | thighRoasted 150 g → breastRoasted 120 g | 7.9 | 0 | −71 |
| pork loin → breast | porkLoin 150 g → breastRoasted 98 g | 8.4 | 0 | −71 |
| 千张 → 北豆腐 | qianzhang 50 g → tofuFirm 100 g | 3.2 | 0 | −32 |
| 北豆腐 → 豆干 | tofuFirm 150 g → doufugan 113 g | 3.1 | 0 | +13 |
| oil above MIN_OIL_G | per g above 5 g | 1.0 / g | 0 | −8.8 / g |

What each frees on real days (non-dinner meals incl. 加餐; `planWeek(T, food, RECIPES, {seed})`, seeds 0–5, 42 days):

| lever | 1800/140: days applicable · mean · median · max g | 1400/110: days · mean · median · max g |
|---|---|---|
| egg → white | 42 · 12.9 · 11.6 · 22.0 | 42 · 11.8 · 10.4 · 24.4 |
| milk → skim | 28 · 5.7 · 7.9 · 9.9 | 28 · 5.3 · 7.9 · 9.9 |
| pork → breast | 6 · 1.6 · 0 · 12.5 | 6 · 0.9 · 0 · 11.4 |
| tofu → 豆干 | 17 · 1.7 · 0 · 7.4 | 14 · 1.1 · 0 · 5.0 |
| thigh → breast | 4 · 0.8 · 0 · 9.5 | 4 · 0.5 · 0 · 7.1 |
| 千张 → 豆腐 | 4 · 0.3 · 0 · 3.2 | 4 · 0.3 · 0 · 3.2 |
| **oil > 5 g** | **10 · 0.2 · 0 · 1.0** | **5 · 0.1 · 0 · 1.0** |
| all levers | mean 23.1 · median 21.9 · max 44.0 | mean 20.1 · median 20.4 · max 32.3 |

Key finding: **the oil lever frees ~0 g** — planned lunches already use ≤ 5–6 g oil. Real reserve comes from eggs (every day) and milk (2/3 of days). Egg/pork/thigh swaps also free 40–116 kcal/day, which can move to the social meal.

## R13.2 A66 — storage class for every food
FoodKeeper (USDA FSIS, catalog.data.gov "FSIS - FoodKeeper Data", JSON `fsis.usda.gov/shared/data/EN/foodkeeper.json`) returned **Access Denied** from the box, so no FoodKeeper rows are cited; classifications below follow the A66 AC where it names an id, otherwise the rule. No shelf-life numbers.

Rule (in order): (1) name/tag says 冷冻/速冻 → `frozen`; (2) dry grain, pasta/noodle (dry), canned, powder, condiment, oil → `pantry`; (3) whole roots/tubers, whole gourds, head cabbages, eggs, hard fruit → `keeps`; (4) everything else raw and chilled (meat, fish, shellfish, tofu products, dairy, leafy/soft veg, mushrooms, fresh seaweed, sprouts, soft fruit) → `fresh`. Cooked ids inherit from their `COOKED_TO_RAW` raw id. Judgment calls marked †.

- **pantry**: rice, millet, cornGrits, oatRice, brownRice, blackRice, buckwheat, oats, oatsDry, pasta, wwPasta, noodle, tunaLight, tunaAlbacore, whey, garlic, soy, oyster, oil, oliveOil, sesamePaste, peanuts, walnut
- **frozen**: basa, sole, edamame, frozenVeg, peas
- **keeps**: sweetPotato, yam, potato, taro, cabbage, napa, carrot, winterMelon, pumpkin, lotusRoot†, egg, eggUSDA, eggBoiled (from raw egg), eggWhite† (separated at home), wwBread†, konjac† (sealed pack), apple, orange, kiwi, kiwiGold, kiwiUSDA
- **fresh**: chickenBreast, chickenThigh, chickenSkin, chickenGizzard, porkLoin, porkBelly, leanBeef, duckBlood, shrimp† (no 冷冻 tag → fresh; switch to frozen if the user buys frozen 虾仁), seabass, hairtail, pomfret, crucian, salmon, tofuFirm, tofuSilk, tofuUSDA, doufugan, qianzhang, soymilk, milk†, yogurt, shanghaiQing, jimaocai, spinach, spinachUSDA, lettuce, kongxincai, beansprout, shiitake, enoki, mushroom, woodEar (水发), kelp (鲜), broccoli, broccoliUSDA, cauliflower†, tomato, cucumber, loofah, zucchini, eggplant, greenPepper, celery, snowPea, bitterMelon, jiaobai, corn (鲜)†, mantou†, banana†, avocado†
- cooked → raw: riceCooked/brownRiceCooked/milletCooked → pantry; sweetPotatoBaked → keeps; thighRoasted/breastRoasted → fresh; shrimpCooked → shrimp (fresh)
- 外食/饮品: no `store` (not on shopping list).

Open decision for the engineer: today trip 2 takes only fish/seafood/leafy (`isPerishable`). With `store`, fresh **meat and tofu** would also qualify; R11-3 did not ask for that. Recommend: trip 2 = `store === 'fresh'` and cat in 鱼/海鲜/叶菜/菌菇/海藻 (keeps current behaviour + lettuce/mushrooms/kelp), meat/tofu stay trip 1 unless a later item decides otherwise.

## R13.3 Fiber dip at 1500/140 — investigation only
12 seeds each, no budget (`r13b.mjs`):

| target | rotate ≥25 g | oats ≥25 g | avg fiber rotate / oats |
|---|---|---|---|
| 1500/140 | 69.0% | 77.4% | 25.7 / 25.9 |
| 1800/140 | 95.2% | 88.1% | 28.5 / 28.2 |
| 1400/110 | 83.3% | 88.1% | 26.5 / 26.5 |

Breakfast fiber: 燕麦牛奶粥+鸡蛋 4.2 g (oatsDry 40 g, FDC 169705 10.6 g/100 g), 水煮蛋+玉米+酸奶 5.8 g, 全麦面包+鸡蛋+牛奶 4.2 g — **oats is not a high-fiber breakfast in this app**; it helps at 1500/140 only and hurts at 1800/140 (it replaces the corn breakfast).
Low days at 1500/140 rotate (26 days): avg breakfast 4.3 g, lunch 7.5, dinner 8.8, snack 3.7; **peas side already present on 22/26** (so "peas-first" is mostly spent); staple is **white rice on 12/26** despite `FIBER_ALT.riceCooked = [brownRiceCooked, sweetPotatoBaked]`; kiwi 0 g on 1/26. At 1500/140 protein is 37% of kcal (`protein*4/kcal`), leaving little kcal room — plausible cause, **未核对**: the fiber alt may lose to kcal fit or the 2-day staple batch (A55).
Levers to test (no numbers claimed yet): (a) why riceCooked survives on low days; (b) oats 40→50 g with milk cut; (c) corn-breakfast weight; (d) kiwi 200 g when kcal allows.

## R13.4 Takeaway / drinks — batch conclusions (≤15)
| id | conclusion |
|---|---|
| greenTea | app 1/0.2/0/0 = FDC 171917 (1/0.22/0/0) → set `verified:true` |
| chayedan 茶叶蛋 (147/12.5/10.1/1.1) | proxy FDC 173424 hard-boiled egg 155/12.6/10.6/1.12 (−5% kcal) → cite as proxy, keep ≈ (marinade/size) |
| latte | stay ≈ — milk:coffee ratio unknown; could derive from FDC 171265 + 171890 only once a ratio is chosen |
| milkTea | stay ≈ — brand/sugar dependent |
| huangmenji, luroufan, danchaofan, baozaifan, malatang, xiangguo, suancaiyu, congyoumian, lamian, shengjian, xiaolong | stay ≈ — composite vendor dishes; source is fatsecret.cn generic/user entries (R5.1), no FDC/CFCT equivalent |
Not listed (also ≈ for the same reason): jianbing, guanbing, roujiamo, fantuan, paomo, yangchunmian, gaijiaofan, wonton, xiaohuntun, dapai, canteen*Set.
