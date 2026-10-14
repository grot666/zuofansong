# RESEARCH R9 — data quality, budget price refs, real-week check, PROMPT re-audit

Base: `main` @ `3e61689` (v0.9.5). Method: shallow clone + `node` (v20) running the shipped `js/core/plan.js` against `data/*.js`; FDC API (`api.nal.usda.gov`, DEMO_KEY, SR Legacy); Shanghai official price tables (dated). Docs only, no code changes. **估算** = estimate; **未核对** = unverified. Repro scripts: bot box `/workspace/r9/r9*.mjs` (copy into repo root, `node r9.mjs`).

Test grid used throughout: targets `{kcal:1800, protein:130|140|160}`, budgets `null|350|300|250|200|150`, seeds `0–3` (72 weeks); food index = `makeIndex({base:[FOODS,FOODS2,FOODS3], partials:[PRICE_REFS]})`.

## R9.1 Data quality — unverified foods ranked by real use

137 foods, **24** `verified:true`. Grams summed over the 72 generated weeks (all meals incl. breakfast/add-ons):

| rank | id | name | g (72 wk) | verified | note |
|---|---|---|---|---|---|
| 1 | tofuFirm | 北豆腐 | 90 222 | ✗ CFCT | ~1.25 kg/wk; Chinese product → needs 中国食物成分表 value |
| 2 | milk | 牛奶 | 88 335 | ✗ CFCT | breakfasts (燕麦牛奶粥, 面包+蛋+奶) |
| 3 | yogurt | 无糖酸奶 | 46 094 | ✗ CFCT | label-dependent |
| 4 | kiwi | 猕猴桃 | 42 200 | ✗ CFCT | **plan uses `kiwi`, not the verified `kiwiUSDA` (FDC 168153)** — `plan.js:72` |
| 5 | corn | 玉米(鲜) | 35 750 | ✗ CFCT | breakfast 水煮蛋+玉米+酸奶 |
| 6 | basa | 巴沙鱼 | 28 105 | ✗ CFCT | |
| 7 | porkLoin | 猪里脊 | 25 335 | ✗ CFCT | |
| 8 | seabass | 鲈鱼 | 20 275 | ✗ CFCT | |
| 9 | leanBeef | 瘦牛肉 | 14 295 | ✗ CFCT | |
| 10 | eggWhite | 蛋清 | 12 870 | ✗ "CFCT (未逐条核对)" | |
| 11 | wwBread | 全麦面包 | 11 790 | ✗ "USDA" (no id) | |
| 12 | tomato / frozenVeg / shanghaiQing … | | ≤ 11 250 each | ✗ | vegetables: small kcal share |

Add-ons named in the brief: `qianzhang` 1 800 g (only via recipes 毛豆/西芹拌千张), `shrimpCooked` verified, **`milk`/`qianzhang`/`doufugan` never chosen as an add-on** in 36 weeks (p130/140/160 × budget null/200/150 × seeds 0–3); add-on-days seen: tofuFirm 65, eggWhite 61, tunaLight 40, eggBoiled 37, yogurt 36, shrimpCooked 31. Canteen sets (`canteen*Set`) are not used by the generator; they are already labelled "估算…未核对".

### FDC check of the top unverified items (per 100 g; fetched 2026-10-15)

| id | app value kcal/P/F/C(/fib) | FDC match | FDC kcal/P/F/C(/fib) | verdict |
|---|---|---|---|---|
| milk | 65/3.3/3.6/4.9 | 171265 Milk, whole, 3.25% | 61/3.15/3.25/4.8 | within ~7% → can mark verified with FDC id, or keep CFCT |
| yogurt | 72/3.2/3.5/6.7 | 171284 plain whole milk; 170886 plain low fat | 61/3.47/3.25/4.66; 63/5.25/1.55/7.04 | product-dependent; keep ≈, prefer label |
| kiwi | 61/0.8/0.6/14.5/2.6 | 168153 (already `kiwiUSDA`) | 61/1.14/0.52/14.66/3.0 | **use `kiwiUSDA` in plan** |
| corn | 112/4.0/1.2/22.8/2.9 | 169998 Corn, sweet, yellow, raw | 86/3.27/1.35/18.7/2.0 | kcal differs 30%; CFCT 鲜玉米 not checked → keep ≈ and verify vs 中国食物成分表 |
| porkLoin | 155/20.2/7.9/0.7 | 168249 Pork tenderloin, lean only, raw | 109/21.0/2.17/0 | kcal differs 42% (fat 7.9 vs 2.2); cut ambiguity (里脊 trimmed?) → verify |
| seabass | 105/18.6/3.4/0 | 175142 Sea bass, mixed species, raw | 97/18.4/2.0/0 | close → can cite FDC |
| leanBeef | 113/21.3/2.5/1.3 | 171746 Beef eye of round, lean+fat 0″, raw | 127/23.3/3.74/0 | cut-dependent; keep ≈ |
| eggWhite | 60/11.6/0.1/3.1 | 172183 Egg, white, raw, fresh | 52/10.9/0.17/0.73 | **switch to FDC 172183** (carbs 3.1 looks wrong) |
| tofuFirm | 116/12.2/4.8/2.0/0.5 | 172475 Tofu, firm, calcium sulfate | 144/17.3/8.72/2.78/2.3 | different product (US firm ≠ 北豆腐) → do NOT copy; needs 中国食物成分表 |
| basa | 90/15/3/0 | not found (SR Legacy search errored/rate-limited) | — | unverifiable here; Chinese frozen fillet often glazed → label value |
| qianzhang, doufugan | 262/24.5/16; 197/16.2/11.3 | Chinese-specific | — | need 中国食物成分表 (not accessible from box) |

URLs: `https://fdc.nal.usda.gov/food-details/<id>/nutrients`.

### Proposed verify-or-label rules
1. A food used by the generator (`PROTEINS`, `STAPLES`, `BREAKFASTS`, `ADDONS`, snack kiwi) must be `verified:true` with a `source` that names a table+id (`USDA FDC <id>` or `CFCT <edition> <page/code>`), **or** show ≈ everywhere it appears in plan/shopping list.
2. When a verified twin exists (`kiwi`/`kiwiUSDA`, `egg`/`eggUSDA`, `broccoli`/`broccoliUSDA`), generator uses the verified twin.
3. Chinese-specific products (北豆腐, 千张, 豆干, 巴沙鱼 fillet, 无糖酸奶) → CFCT value or package label; never copy a US analogue.
4. `source: 'USDA'` without an id counts as unverified (wwBread, frozenVeg).
5. Data test: if app and cited FDC value differ by >10% kcal or >1 g protein/100 g, test fails unless `note` explains (e.g. "CFCT cut differs").

## R9.2 Price refs — what the budget swap path actually uses

Swap candidates = `PROTEINS` (plan.js:12). Dinner-protein counts over 36 weeks (p130/140/160 × seeds 0–3):

| budget | picks |
|---|---|
| none | seabass 12, tofu 12, pork 12, basa 12, shrimp 9, beef 9, thigh 6, breast 6, tuna 6 |
| ¥200 | **tofu 29**, seabass 12, basa 12, pork 11, thigh 7, breast 6, shrimp 5, tuna 2 |
| ¥150 | **breast 36, tofu 36, thigh 12** only |

So the budget path really runs on **北豆腐, 鸡胸, 鸡腿**, then pork/basa/seabass. Only porkLoin has an official ref today.

Official Shanghai refs found — 上海市发改委《上海市主要主副食品品种价格信息表(2026年10月14日)》, 均价 row of the attached xls (`fgw.sh.gov.cn/fgw_jgjgdt/20261014/3244f2eefe23446d8ce6d997a550a4de.html`), ¥/500 g:

| app id | app price | official item (spec) | 均价 2026-10-14 | status |
|---|---|---|---|---|
| porkLoin | 17.55 (ref 10-13) | 鲜猪肉 精瘦肉 | 17.50 | ✓ ref exists; refresh |
| egg/eggUSDA | 5.91 | 鸡蛋 新鲜完整 | 5.89 | ✓ |
| rice | 3.0 (奉贤) | 粳米 特二散装 | 2.81 | city ref available |
| chickenBreast / chickenThigh | 10 / 13 估算 | 鸡肉 白条鸡、开膛、上等 (whole bird) | 13.82 | **gap**: no cut-level ref; whole bird is not a breast/thigh price |
| leanBeef | 40 估算 | 鲜牛肉 腱子肉 / 牛腩 | 52.29 / 44.70 | proxy only; **app 40 is below both** → likely under-priced |
| shrimp (虾仁) | 30 估算 | 基围虾 活 30–40只/500 g | 25.94 | different product (live shell-on) → gap for 虾仁 |
| tofuFirm | 3 估算 | — not in city table or 奉贤 table | — | **gap** |
| seabass | 22 估算 | — (table has 带鱼/黄鱼/草鱼/花鲢/鲫鱼 only) | — | **gap** |
| basa | 12 估算 | — | — | **gap** |
| tunaLight | 35 估算 | — | — | **gap** |
| milk | 7 估算 | 奉贤 2026-10-14: 光明鲜牛奶 980 ml 15.80–18.80; 纯牛奶 240 ml 2.00–2.50 | — | district, per-pack (convert with density ≈ 1.03 g/ml — 未核对) |

District cross-check: 奉贤区 2026-10-14 table (`fengxian.gov.cn/fgw/jbsj/20261014/114307.html`) 鸡肉 9.00–19.00, 鲜猪精瘦肉 12.00–22.00, 基围虾 20.00–26.00. Pudong publishes a daily list (`pudong.gov.cn/pudong-interaction-front/fgw/food-price/list`) — not parsed this round.

## R9.3 Real-week check (generateWeek/planWeek, owner targets)

Results over 72 weeks:
- **kcal**: every day within ±5% of 1800 (range 1790–1807); `checkWeek` all ok; `fit` never non-ok. Protein ≥ target every day.
- **Weekly cost (estimate prices)**: no budget → ¥192–228 (p130), ¥205–246 (p140), ¥225–281 (p160). Default `weeklyBudget` is 300 (`plan-page.js:37`), so for the owner the budget path **never runs by default**.
- **Budget ¥150** is infeasible at p140/p160 for every seed (cost ¥153–167, flagged "仍超出预算" — shown, not silent).
- **Cooked protein per meal hits the 300 g cap** (`MAX_PROTEIN_G_PER_MEAL`) at p160 in 12/24 weeks (e.g. 300 g cooked 鸡胸 one meal) — realistic? flag.
- **TFCC**: no 拍/剁/砸/颠锅 in steps used by the plan. Steps still marked `wristSafe:true` but needing knife force on firmer veg: r18 "茭白切片", r10 "丝瓜削皮切块", r24 handled. Softer (番茄/蘑菇/豆腐/白菜 切块) judged fine. Judgment, no source.

### Silent / premature misses (exact repro)
1. **Budget greedy stops early.** `planWeek({kcal:1800,protein:130}, food, RECIPES, {seed:2, budget:200})` → `cost 206.34, overBudget:true, swaps:1` (dinners shrimp,seabass,tofu,pork,basa,**tofu**,tuna). `applyBudget` estimates the post-swap cost with `fixed` held constant, declares fit, stops; the regenerated week (portions/add-ons re-optimised) costs more. Same with budget 150 it reaches ¥159.6 with 6 swaps, so ≤¥200 is reachable. UI shows "仍超出预算 ¥6", but the algorithm could have fixed it. Also seen: p160/b200/seed2 ¥203.0 (3 swaps).
2. **Plan uses unverified `kiwi`** although `kiwiUSDA` exists (plan.js:72) — every snack, 42 kg in grid.
3. **0.9.4 changelog says add-ons rotate among 酸奶/豆腐/牛奶/千张/虾/豆干** but at owner targets milk, 千张, 豆干 add-ons were selected 0 times in 36 weeks.
4. `$('#budget').onchange`: `+value || 300` turns ¥0/blank into 300 silently (minor).

## R9.4 PROMPT.md re-audit vs v0.9.4–0.9.5

PROMPT (Drive 13rBn3HwIg4ZBDm2Bp8608PB1VGwyyjUB) items present in code: 复制昨天, 便利店/馄饨/盖浇饭/食堂 foods, water, export/backup + reminder, BMI-based protein, fat floor, BMR warning, 如厕 risk, 更新日志, 杂粮饭 mixer, scoop cap. Gaps for daily use:
- §3.10/§6 "**prep-time limits**" in the plan generator: no `prepMin`/time cap anywhere in plan.js.
- §3.10 "**reusing ingredients to cut waste**": no reuse term in `selectWeek` (each day picks a different veg recipe). Not measured precisely this round → 未核对.
- §2.6 "never invent precise-looking numbers": canteen sets show precise kcal on ≈ values; plan uses unverified kiwi (above).
- §2.5 protein sources list includes 龙利鱼 — not in `PROTEINS`.
- Docs: RESEARCH-R7 price table predates the 10-14 city xls; leanBeef 40 vs 腱子 52.29.
