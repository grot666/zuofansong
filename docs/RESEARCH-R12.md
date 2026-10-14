# RESEARCH R12 — oats breakfast check, takeaway-lunch day swap, next 15 foods, PROMPT gap scan (v0.10.43)

Base: `main` @ `3cd4958` (v0.10.43). Docs only. Method: fresh shallow clone; `node` with shipped `js/core/plan.js`. Scripts: bot box `/workspace/r12/r12.mjs`, `r12b.mjs` (copy to repo root, `node r12.mjs`). Sources: FDC API (DEMO_KEY, abridged, 2026-10-15); 中国疾控中心营养与健康所「食物营养成分查询平台」nlc.chinanutri.cn, cited 平台 #id (no edition/6-digit code shown → 版次未核对; kcal = kJ ÷ 4.184).

## R12.1 Oats-breakfast path — 1800 kcal / 140 g / ¥300
`planWeek({kcal:1800,protein:140}, food, RECIPES, {seed, budget:300, breakfast:'oats'})`

| seed | day kcal | day protein g | day fiber g | week cost ¥ | listLines |
|---|---|---|---|---|---|
| 0 | 1799/1794/1798/1797/1798/1797/1800 | 140.3/141.8/140.0/140.1/140.3/140.2/140.8 | 25.9/29.1/24.9/26.3/34.8/32.3/25.9 | 209.6 | 29 |
| 1 | 1803/1799/1803/1804/1803/1801/1805 | 140.9/140.2/140.8/141.9/141.7/141.5/140.6 | 26.4/24.6/27.1/25.5/31.0/27.2/25.5 | 221.5 | 30 |
| 2 | 1800/1801/1801/1799/1803/1798/1796 | 141.9/141.6/141.5/140.2/140.5/140.4/140.5 | 25.1/26.9/25.4/33.8/31.1/26.1/30.0 | 240.4 | 27 |

Rotate (default) for comparison: cost 215.8 / 223.2 / 240.1. **Oats breaks nothing**: every day `checkWeek` ok (kcal ±5%, protein ≥ 140), cost equal or lower, list equal or shorter. Fiber < 25 g on 2/21 days (24.9, 24.6), both with fiberNote. Breakfast scales with `bfMult`, e.g. seed 0 day 0 = 燕麦 50 g + 牛奶 313 g + 鸡蛋 125 g.
Side observation (not oats-specific): **8/42 lunch/dinner meals have staple < 100 g cooked** (seed 0 day 0 dinner: 白米饭 30 g + 鸡腿 60 g, while the snack is 370 kcal: 猕猴桃 200 g + 虾 100 g + 北豆腐 150 g). A real person would find a 30 g rice dinner odd → R12-3.

## R12.2 Eating out — status and takeaway-lunch day swap
R11-5 (聚餐/hotpot) is **not shipped** (no 聚餐/eat-out code in `js/core`). It covers evening social meals only. Not covered: the common workday case — **lunch is a canteen/takeaway meal**, and the rest of the day must rebalance. Takeaway foods already in data (`data/foods3.js`, `cat:'外食'`, `verified:false`, source "fatsecret.cn 估算 (R5.1)" or "估算") — all ≈.

Rule (proposed): keep the planned breakfast; lunch = the logged takeaway unit; snack → 猕猴桃 100 g; dinner = 300 g green veg (上海青) + 5 g oil + 鸡胸(熟) to close the protein gap (rounded up to 5 g) + 白米饭 only from leftover kcal (rounded down to 10 g). If breast > 250 g (MEAT_OVER_G), move the excess protein to the snack as 蛋清/酸奶 (existing add-ons). Values: breastRoasted 165 kcal/31 g P (FDC 171477), riceCooked 130 kcal (FDC 168880).

Worked examples (base: oats seed 0 day 0 breakfast 燕麦 50 + 牛奶 313 + 鸡蛋 125 g; `r12b.mjs`):

| lunch (app unit) | lunch kcal / P / F | bf+lunch+veg+kiwi | dinner add | day total | vs 1800 |
|---|---|---|---|---|---|
| 食堂套餐(一荤两素+饭) 550 g | 825 / 38.5 / 33.0 | 1533 kcal / 78.2 g P | 鸡胸 200 g, rice 0 g | 1863 kcal / 140.2 P / 71.8 F / 17.9 fib | +3.5% |
| 兰州拉面 500 g | 585 / 24.5 / 20.0 | 1293 / 64.2 | 鸡胸 245 g, rice 70 g | 1789 / 142.0 / 60.6 / 16.6 | −0.6% |
| 麻辣烫(不含汤) 500 g | 350 / 20.0 / 18.0 | 1058 / 59.7 | 鸡胸 260 g → split ≥10 g P to snack, rice 240 g | 1799 / 146.8 / 59.6 / 19.8 | 0.0% |

Takeaways: (1) a 食堂套餐 lunch leaves no room for staple at dinner and the day lands at +3.5% (inside ±5%); (2) every takeaway day falls below 25 g fiber (16.6–19.8 g) → show fiberNote; (3) 黄焖鸡米饭 500 g (835 kcal / 70.5 g P) leaves 31 kcal room and already exceeds the protein still needed → dinner = veg + kiwi only, or the user eats half the rice (copy neutral). (4) takeaway foods have `priceCNYPer500g: 0`, so a takeaway day lowers the week's "cost" — misleading.

## R12.3 Remaining unverified foods by planner usage
Grid: 1800 × protein {130,140,160} × breakfast {rotate, oats} × seeds 0–5, ¥300 (36 weeks). Verified: 68/137. Only **12 unverified foods** are reached by the planner (meal-occurrences): soy 84, yogurt 82, basa 72, porkLoin 72, leanBeef 60, sesamePaste 12, oyster 12, yam 12, woodEar 6, jimaocai 6, kelp 6, jiaobai 6. Three more are used for shopping-list raw weights / cost (`COOKED_TO_RAW`): rice, millet, brownRice, plus oats (quick-add/rice mixer).

| # | id (app kcal/P/F/C/fib) | source checked | values | verdict |
|---|---|---|---|---|
| 1 | soy 生抽 (63/5.6/0.1/10.1) | FDC 174277 shoyu 53/8.14/0.57/4.93 (R11) | — | stay ≈ (product differs; label) |
| 2 | yogurt | 平台 #958/#959 (R10) | — | stay ≈ (no 无糖 entry) |
| 3 | basa | none | — | stay ≈ (label) |
| 4 | porkLoin (155/20.2/7.9) | FDC 168249 lean 109/21.0/2.17 | — | stay ≈ until cut decided |
| 5 | leanBeef | cut-dependent | — | stay ≈ |
| 6 | sesamePaste | platform id not located | — | stay ≈ |
| 7 | oyster 蚝油 | platform id not located | — | stay ≈ (label) |
| 8 | yam 山药 (57/1.9/0.2/12.4) | 平台 #525 | 243 kJ ≈ 58/1.9/0.2/12.4 | cite |
| 9 | woodEar 木耳(水发) (27/1.5/0.2/6.0) | 平台 #580 | 112 kJ ≈ 27/1.5/0.2/6.0 | cite |
| 10 | jimaocai 鸡毛菜 (17/1.8/0.3/2.8/1.1) | 平台 #460 | 79 kJ ≈ **19/2.7/0.2/2.6/2.1** | **fix** to platform |
| 11 | kelp 海带(鲜) (13/1.2/0.1/2.1) | 平台 #605 | 55 kJ ≈ 13/1.2/0.1/2.1 | cite |
| 12 | jiaobai 茭白 (26/1.2/0.2/5.9) | 平台 #519 | 111 kJ ≈ 27/1.2/0.2/5.9 | cite |
| 13 | rice 大米 (346/7.4/0.8/77.9/0.7) | 平台 #281 粳米(标一); FDC 169756 long-grain | 1464 kJ ≈ 350/7.7/0.6/77.4; FDC 365/7.13/0.66/80.0/1.3 | cite #281 (粳米 matches Shanghai use) |
| 14 | millet 小米 (361/9.0/3.1/75.1/1.6) | FDC 169702 | 378/11.0/4.22/72.8/8.5 | platform id not located; FDC fiber 8.5 vs 1.6 → keep CFCT ≈, add fdcCompare note |
| 15 | brownRice 糙米 (348/7.7/2.7/75.0/3.4) | FDC 169703 | 367/7.54/3.2/76.2/3.6 | cite FDC or keep ≈ (kcal +5%) |
| + | oats 燕麦片 (377/15.0/6.7/66.9/5.3) | FDC 173904 | 379/13.2/6.52/67.7/10.1 | use twin `oatsDry` in quick-add (already) ; keep CFCT ≈ |

## R12.4 PROMPT.md gap scan vs v0.10.43
Spot-checked as present (grep in `js/`, `css/`): one-bowl kcal (`views/rice.js`), water incl. powder note (`views/me.js`), dark mode (`prefers-color-scheme`), 复制昨天, backup reminder, maxPrepMin, fiber/water, plateau, changelog. Missing/partial for daily use:
- §6 "食堂套餐 / takeaway" exists as foods, but **no day rebalance after a takeaway lunch** (R12.2) — partial.
- §3.10 "within a weekly budget": **takeaway/canteen foods have price 0**, so eating-out days understate cost — partial.
- §6 "better plan generator": staple < 100 g in 8/42 meals; R11-3 (2 trips), R11-4 (leftovers), R11-5 (聚餐) still open.
- §2.6 data: 69/137 unverified; only 12 reach the planner (above).
