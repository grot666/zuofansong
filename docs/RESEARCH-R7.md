# RESEARCH round 7 — 2026-10-15 ~05:30 SGT
All nutrient values fetched today from the USDA FDC API (SR Legacy, `api.nal.usda.gov/fdc/v1/foods?fdcIds=…`). Page links: `https://fdc.nal.usda.gov/food-details/<id>/nutrients`.

## R7.1 R-11b 30-min evening one-tray template

### Ingredient values used (per 100 g, FDC)
| FDC | Food | kcal | fat g |
|---|---|---|---|
| 174277 | Soy sauce (shoyu) | 53 | 0.57 |
| 174529 | Oyster sauce, ready-to-serve | 51 | 0.25 |
| 171016 | Sesame oil | 884 | 100 |
| 169230 | Garlic, raw | 149 | 0.5 |
| 169231 | Ginger root, raw | 80 | 0.75 |
| 170005 | Scallions, raw | 32 | 0.19 |
| 170457 | Tomato, red, raw | 18 | 0.2 |
| 168556 | Catsup (ketchup) | 101 | 0.1 |
| 169655 | Sugar, granulated | 387 | 0 |
| 167747 | Lemon juice, raw | 22 | 0.24 |
| 172470 | Peanut butter, smooth, no salt | 598 | 51.4 |
| 173469 | Vinegar, cider (**proxy** for 米醋/陈醋 — not in FDC; unverified substitute) | 21 | 0 |

### Sauces (1 serving = 1 person/1 meal; gram amounts are recipe design choices; kcal/fat computed = Σ g/100 × FDC value)
| id | 名称 | family | recipe (g) | kcal | fat g |
|---|---|---|---|---|---|
| s1 | 葱姜酱油汁 | 咸鲜 | 酱油 10 + 姜 5 + 葱 10 + 香油 2 | 30.2 | 2.11 |
| s2 | 蒜蓉蚝油 | 蒜香 | 蚝油 15 + 蒜 6 + 酱油 5 (+水) | 19.2 | 0.10 |
| s3 | 番茄汁 | 番茄 | 番茄 150 + 番茄酱 10 + 糖 2 | 44.8 | 0.31 |
| s4 | 柠檬蒜汁 | 酸爽 | 柠檬汁 15 + 酱油 10 + 蒜 3 + 糖 3 | 24.7 | 0.11 |
| s5 | 花生酱拌汁 | 坚果 | 花生酱 8 + 酱油 8 + 醋 5 + 蒜 3 | 57.6 | 4.17 |
| s6 | 轻糖醋汁 | 糖醋 | 醋 15 + 酱油 5 + 糖 5 + 姜 3 | 27.6 | 0.05 |
Check math (s1): 5.3+4.0+3.2+17.68 = 30.18 kcal; 0.057+0.0375+0.019+2.0 = 2.11 g. (s5): 47.84+4.24+1.05+4.47 = 57.6; 4.112+0.046+0+0.015 = 4.17.
Notes: s5 contains peanut → `allergen:['花生']`. Sodium is high in soy/oyster sauce (FDC 174277: 5490 mg/100 g) — show "酱油类含盐高" note; low-sodium soy is FDC 172473 (3600 mg).

### Rotation rule (pure fn `rotateSauces(enabled, days, startIdx=0)`)
- Walk `enabled` in fixed order, cyclic; choose next sauce whose `family` ≠ previous day's family.
- If only 1 family enabled → repeat allowed, return `{repeatWarning:true}`.
- Fixtures: all 6, 7 days → `s1 s2 s3 s4 s5 s6 s1`. Without s5 (allergy) → `s1 s2 s3 s4 s6 s1 s2`. Only s1 → `s1×7` + repeatWarning. Assert no `out[i].family === out[i-1].family` when ≥2 families.

### Template steps (一盘烤 + 电饭煲 + 微波炉)
| # | Step | active min | new pot/device | 护腕 |
|---|---|---|---|---|
| 1 | 淘洗杂粮/米，电饭煲快煮（或取冷藏分装饭微波复热） | 3 | 电饭煲 (1) | ✅ |
| 2 | 鸡腿肉/虾/豆腐 + 冷冻或切好的蔬菜铺一盘，刷 ≤ 1 茶匙油 | 6 | 烤盘/空气炸锅 (2) | ✅ 用厨房剪刀剪块，不用大刀剁切 |
| 3 | 放入烤箱/空气炸锅，中途用夹子翻面（不颠锅） | 2 | — | ✅ |
| 4 | 微波蒸蛋或微波蔬菜 | 2 | 微波碗 (3) | ✅ |
| 5 | 调酱汁（按轮换） | 3 | — | ✅ |
| 6 | 装盘/分装明日午饭 | 3 | — | ✅ 双手端烤盘、戴隔热手套 |
Total active ≈ 19 min (design estimate, not timed); devices = 3; hands-off cook time depends on device — **no sourced time**; app must show “以中心温度为准”: poultry 74 °C/165 °F (USDA FSIS safe minimum internal temperature, https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/safe-temperature-chart).
护腕 flag rules (design rules for TFCC-friendly prep; **not clinical advice, no source verified this round**): flag false if step needs pan tossing (颠锅), hard chopping (剁骨/切南瓜), wringing, or lifting a full wok one-handed. Copy: “护腕：不颠锅、不用力剁切，重物双手端。若手腕疼痛请過医生/康复师建议。”

## R7.2 N-07 Kiwi — **VERIFIED**
FDC 168153 “Kiwifruit, green, raw” (SR Legacy, 2019-04-01), per 100 g: **61 kcal, protein 1.14 g, fat 0.52 g, carbs 14.7 g, fiber 3.0 g** (fiber/protein/fat analytical). API: `https://api.nal.usda.gov/fdc/v1/foods?fdcIds=168153&format=abridged&nutrients=208,203,204,205,291&api_key=DEMO_KEY`. App may set `verified:true, source:'USDA FDC 168153'`. Per-fruit weight not verified here → use grams or label unit ≈.

## R7.3 Shanghai price reference (估算) + protein per yuan
Sources (official, retail, 元/500 g):
- [SH] 上海市发改委 主要主副食品价格信息表 2026-10-13 (city average): https://www.shanghai.gov.cn/nw17239/20261013/8489b0cbb4a14bd8a15a2c3b7eef5193.html
- [FX] 奉贤区 主副食品价格监测表 2026-10-12 (15 points incl. 大润发/世纪联华 + wet markets; range = min–max): https://www.fengxian.gov.cn/fgw/jbsj/20261012/114220.html (unit not printed on page; assumed 元/500 g like the city table — **assumption**)
- **盒马: no public dated price source found** → not used.

protein/¥ = P(g/100 g) × 5 / price; as-purchased, waste (shell, bone, head) **not adjusted**.
| food | price ¥/500 g | source | FDC P g/100 g | P per ¥ |
|---|---|---|---|---|
| 猪精瘦肉 | 17.55 avg (12.00–22.00) | SH / FX | 21.0 (168249 tenderloin, proxy) | 5.98 (4.77–8.75) |
| 鸡蛋 | 5.91 avg (5.00–7.00) | SH / FX | 12.6 (171287) | 10.66 (9.0–12.6) shell incl. |
| 鸡肉 (cut unspecified) | 9.00–19.00 | FX | 19.7 thigh (173627) only if cut = 去皮腿肉 — **mismatch, don't compute** | — |
| 基围虾 (whole) | 20.00–26.00 | FX | 20.1 (175179, edible) | 3.9–5.0 before shell/head loss |
| 牛腱子肉 | 39.80–62.00 | FX | not fetched | — |
| 牛腩 | 35.80–60.00 | FX | not fetched | — |
| 草鱼 / 花鲢 / 鲫鱼 (whole) | 9.80–13 / 10.50–14 / 8.80–16 | FX | not fetched (bone loss large) | — |
| 带鱼 / 黄鱼 | 25–35 / 19.80–35.80 | FX | not fetched | — |
| 粳米 特二散装 | 2.28–3.58 | FX | 7.13 (169756 long-grain raw, proxy) | 10.0–15.6 |
| 粳米 10 kg 袋 | 50–63 /袋 = 2.50–3.15 | FX | 7.13 | 11.3–14.3 |
| 切面 (湿) | 3.00–4.00 | FX | not fetched | — |
| 光明鲜牛奶 980 ml | 15.80–18.80 /瓶 | FX | 3.15 (171265 whole milk, proxy) | ≈1.7–2.0 per ¥ (assumes 980 ml ≈ 1009 g) |
| 西兰花 / 胡萝卜 / 西红柿 / 土豆 | 3.98–7.00 / 1.58–3.50 / 1.50–6.00 / 1.80–3.50 | FX | (veg, not protein) | — |
**No public source this round** for: 鸡胸肉, 去皮鸡腿肉, 豆腐, 金枪鱼罐头, 三文鱼, 燕麦, 小米, 糙米, 玉米糁, 蒛麦, 蛋白粉 → keep app estimates, label 估算, user override.
Test fixtures (deterministic): pork 21.0 @ 17.55 → 5.983; egg 12.6 @ 5.91 → 10.660; rice 7.13 @ 3.00 → 11.883; shrimp 20.1 @ 23.00 → 4.370 (tol 1e-3).

## R7.4 First-run UX audit (v0.6.0) — **code-based, not a click-through**
Read: live https://grot666.github.io/zuofansong/ (title only via fetch) + `js/app.js` @ e264de6.
Path to first log: open → `#today` (default) → tap a “常用餐” template button → logged with undo. **= 1 tap** ✅ (≤3 met). Typed quick-add = type + 添加 = 2 actions if exact name.
Friction (top 3):
1. **Silent default profile.** `profile()` = `normalizeProfile({})` → targets shown from DEFAULT_PROFILE with no notice; a new user sees kcal/protein targets that aren't theirs, and “记入我的计划日” / “计划早餐” are the owner's plan.
2. **Blank profile fields saved as 0.** `views.me.bind` onsubmit does `d[k] = +d[k]` for every non-text field; `+''` = 0, so leaving e.g. 体脂/目标体重/蛋白粉 blank overwrites the default with 0 (→ pace `incomplete`, projectedBodyFat on 0 %, protein mode values 0). No inline validation.
3. **Quick-add matching & silent 100 g.** Name must equal or `includes` a food name, else `alert()`; default unit “个/碗/份” falls back to **100 g** when a food has no `unit` without telling the user.
