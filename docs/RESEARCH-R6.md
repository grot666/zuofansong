# RESEARCH round 6 — 2026-10-15 (SGT)

## R6.1 R-01b Pace check — spec
**Correction:** earlier docs said ≈0.53%/wk. Recomputed from today: **0.52%/wk** (details below).

Formula (pure fn `paceCheck({currentKg, goalKg, today, goalDate})`):
- `days = (goalDate − today)` in whole local calendar days; `weeks = days / 7`
- `kgPerWeek = (currentKg − goalKg) / weeks`
- `pctPerWeek = kgPerWeek / currentKg × 100` (basis = current weight; recompute whenever a new weight is logged)
- Status: `pctPerWeek > 1` → `fast` (amber); `pctPerWeek < 0.25` → `slow` (info); else `ok`.
- Threshold basis: ISSN ~0.5–1.0% BW/wk to retain lean mass (https://pmc.ncbi.nlm.nih.gov/articles/PMC5470183/ ; https://www.tandfonline.com/doi/full/10.1080/15502783.2026.2740266). 0.25% info floor = design choice (not sourced).

Edge cases:
| Case | Result | Copy |
|---|---|---|
| goalDate ≤ today | `{status:'invalid-date'}` no numbers | 目标日期需晚于今天 |
| goalKg == currentKg | `{status:'reached'}` | 已达到目标体重，可以考虑维持热量 |
| goalKg > currentKg | `{status:'gain'}`; no deficit warnings | 当前是增重目标，本工具主要按减脂设计 |
| missing/≤0 inputs | `{status:'incomplete'}` | 填写当前体重、目标体重和目标日期后显示节奏 |

Copy (zh):
- ok: “到 {date} 需要每周约 {kg} kg（体重的 {pct}%），在可持续范围内。”
- fast (amber): “每周需减 {kg} kg（{pct}%），超过 1%/周，容易掉肌肉。建议把目标日期延后或先定一个阶段性目标。”
- slow (info): “每周只需 {kg} kg（{pct}%），节奏很宽松，可以少吃一点代价。”
Rounding for display: kg 2 dp, % 2 dp.

Fixtures (today = 2026-10-15 local; days computed by calendar):
| # | current | goal | goalDate | days | weeks | kg/wk | %/wk | status |
|---|---|---|---|---|---|---|---|---|
| A | 74 | 58 | 2027-07-31 | 289 | 41.286 | 0.3875 | 0.5237 | ok |
| B | 74 | 58 | 2027-01-31 | 108 | 15.429 | 1.0370 | 1.4014 | fast |
| C | 74 | 72 | 2027-07-31 | 289 | 41.286 | 0.0484 | 0.0655 | slow |
| D | 74 | 58 | 2026-10-15 | 0 | — | — | — | invalid-date |
| E | 74 | 74 | 2027-07-31 | — | — | — | — | reached |
| F | 74 | 78 | 2027-07-31 | — | — | — | — | gain |
| G (later) | 66 | 58 | 2027-07-31, today=2027-03-01 | 152 | 21.714 | 0.3684 | 0.5582 | ok |
Day counts: 2026-10-15→2027-07-31 = 16 (rest of Oct) + 30+31+31+28+31+30+31+30+31 = 289. → 2027-01-31 = 16+30+31+31 = 108. 2027-03-01→2027-07-31 = 30+30+31+30+31 = 152. Tests should assert with tolerance 1e-3 and must use local dates (app already fixed UTC-date bug).

## R6.2 R-04/R-12 Bedtime & caffeine — spec
Evidence:
- Large dinner 1 h before bed worsened sleep vs 5 h before (n=13 RCT); another study (n=20) found little change — evidence small/mixed. https://link.springer.com/article/10.1186/s40101-026-00430-0 ; https://www.dovepress.com/effects-of-dinner-timing-on-sleep-stage-distribution-and-eeg-power-spe-peer-reviewed-fulltext-article-NSS
- 400 mg caffeine at 0, 3 or 6 h before bed all reduced total sleep (>1 h even at 6 h; n=12, placebo-controlled). https://europepmc.org/article/med/24235903
- FDA: up to 400 mg/day not generally associated with negative effects for most adults; brewed coffee 113–247 mg (12 fl oz basis table), black tea 71 mg, green tea 37 mg; wide individual variation. https://www.fda.gov/consumers/consumer-updates/spilling-beans-how-much-caffeine-too-much
- −3 h / −6 h are design defaults derived from these studies, not clinical cut-offs.

Settings (profile): `bedtime` HH:MM default 23:30; `dinnerGapH` default 3 (range 2–4); `caffeineGapH` default 6 (range 4–8); `sleepNudges` on/off default on.
Pure fns: `dinnerDeadline(bedtime, gapH)`, `caffeineCutoff(bedtime, gapH)`; wrap around midnight (mod 24 h).

Triggers:
1. Today view after 17:00 shows card “🌙 晚餐建议 {HH:MM} 前吃完（离睡觉 {gap} 小时）”.
2. When a food/meal logged with time > dinnerDeadline and kcal ≥ 300 (design threshold) → soft note: “这顿离睡觉不到 {gap} 小时，有人会睡得浅。明天可以试着早一点吃，或把晚餐拆一部分到下午。” (no red, once/day).
3. Item tagged `caffeine` (咖啡/茶/奶茶/能量饮料/预锻) logged after caffeineCutoff → “☕ 已过咖啡因截止时间 {HH:MM}。研究显示睡前 6 小时的咖啡因仍可能缩短睡眠；可以换低因/无因。”
4. Evening batch-prep plan labels “备餐（明天吃）” vs “今晚吃”; tasting while cooking doesn't count.
Tests:
| bedtime | gap | dinnerDeadline | caffeine (6 h) |
|---|---|---|---|
| 23:30 | 3 | 20:30 | 17:30 |
| 01:00 | 3 | 22:00 | 19:00 |
| 22:00 | 2 | 20:00 | 16:00 |
| 00:00 | 3 | 21:00 | 18:00 |
Plus: log at 21:10 with 450 kcal, bedtime 23:30 → note fires; 21:10 with 150 kcal → no note; coffee at 17:29 → no; 17:31 → yes; `sleepNudges=false` → nothing.

## R6.3 A9 Weekly budget — algorithm fixture + price references

### Reference prices (context only; **wholesale, carcass/whole basis, not retail cuts** — app prices remain user-editable estimates)
| Item | Price (CNY/kg) | Date | Source |
|---|---|---|---|
| 白条鸡 (上海农产品中心批发市场) | 20.9 | 2026-10-14 | https://wap.21food.cn/price/market/1026.html |
| 白条鸡 (上海全市均价: 中心 21.0 / 江杨 15.3) | 18.15 | 2026-10-13 | https://www.askci.com/news/data/price/20261013/231315279190439524317276.shtml |
| 白条猪 (上海中心批发) | 13.0 | 2026-10-14 | https://wap.21food.cn/price/market/1026.html |
| 牛肉 (上海中心批发) | 80.18 | 2026-10-14 | same |
| 鸡蛋 (上海) | 8.00 | 2026-10-14 | https://www.100ppi.com/mprice/detail-22577006.html |
| 全国均价: 猪肉 15.92 / 牛肉 72.82 / 鸡蛋 9.69 / 白条鸡 17.33 / 鲫鱼 19.37 | — | 2026-10-14 | 农业农村部 https://scs.moa.gov.cn/jcyj/202610/t20261014_6488599.htm |
| 草鱼 周均价 (全国) | 17.23 | 2026-10-05–11 | 农业农村部 via http://news.cccbn.com/contents/4/32720.html |
Retail boneless/skinless cuts, canned tuna, shrimp: **no reliable public source found this round** → keep app's per-food `priceCNYPer500g` (marked 估算) + user override; don't hard-code wholesale values as retail.

Protein per yuan formula: `proteinPerYuan = (proteinPer100g × 5) / priceCNYPer500g` (raw/as-purchased basis; egg shell & bone waste not adjusted — flag).

### Deterministic test fixture (synthetic prices — test-only, not shown to users)
Protein values: FDC raw/drained, verified via FDC API: thigh raw 173627 = 19.7 g; pork tenderloin raw 168249 = 21.0 g; egg raw 171287 = 12.6 g; firm tofu 172475 = 17.3 g; light tuna drained 173709 = 19.4 g.

| id | P g/100 g | test price CNY/500 g | g needed for 100 g P | cost/day | P per ¥ |
|---|---|---|---|---|---|
| tuna_light | 19.4 | 30 | 515.46 | 30.928 | 3.23 |
| pork_tenderloin | 21.0 | 18 | 476.19 | 17.143 | 5.83 |
| chicken_thigh | 19.7 | 15 | 507.61 | 15.228 | 6.57 |
| egg | 12.6 | 6 | 793.65 | 9.524 | 10.50 |
| tofu_firm | 17.3 | 4 | 578.03 | 4.624 | 21.63 |

Setup: 7 days, each day's protein slot = 100 g protein, all start as `tuna_light`; fixed non-protein cost (rice/veg/oil) = 100.00 CNY/week. Start cost = 7×30.928 + 100 = **316.50**.
Algorithm (`generateWeek(..., {budget})` swap phase):
1. While cost > budget: pick the day with the highest protein cost (tie → lowest day index).
2. Replace its protein with the cheapest-per-protein-g option that (a) is cheaper than the current one and (b) is used on < 3 days that week (variety cap = 3, design choice).
3. Re-scale grams so day protein stays 100 g. If no eligible swap remains → stop, `overBudget = true`.

Expected:
| budget | swaps | final mix (days) | cost | overBudget |
|---|---|---|---|---|
| 400 | 0 | tuna×7 | 316.50 | false |
| 200 | 5 | tofu×3, egg×2, tuna×2 | 194.78 | false |
| 150 | 7 | tofu×3, egg×3, thigh×1 | 157.67 | true |
Step costs: 290.19 → 263.89 → 237.58 → 216.18 → 194.78 → 173.37 → 157.67. Assert protein/day = 100 ± 0.5 g after every swap; total within 0.05 CNY.
