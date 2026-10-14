# RESEARCH R11 — real-week walkthrough (v0.10.35), R-15 close-out, eating out / hotpot, next 15 foods

Base: `main` @ `8577366` (v0.10.35). Docs only. Method: fresh shallow clone; `node` with shipped `js/core/plan.js`, `planWeek({kcal:1800, protein:140}, food, RECIPES, {seed, budget:300})`, seeds 0–7. Sources: FDC API (DEMO_KEY, abridged, 2026-10-15); 中国疾控中心营养与健康所「食物营养成分查询平台」nlc.chinanutri.cn (cited as 平台 #id; page shows no edition/6-digit code → **版次未核对**; kcal = kJ ÷ 4.184); 《中国居民膳食指南（2022）》. Scripts: bot box `/workspace/r11/` (`r11.mjs`, `r11b.mjs` → copy to repo root, `node r11.mjs`).

## R11.1 Real-week walkthrough (1800 / 140 g / ¥300)

| seed | cost ¥ | listLines (raw rows) | fiber g/day | staples Mon→Sun |
|---|---|---|---|---|
| 0 | 214 | 31 (37) | 25/34/29/27/26/26/34 | rice, SP, brown, brown, millet, millet, SP |
| 1 | 234 | 30 (38) | 32/25/27/26/31/31/27 | SP, brown, millet, millet, SP, SP, brown |
| 2 | 243 | 30 (36) | 25/24/26/36/27/32/29 | millet, millet, **SP, SP, SP**, rice, brown |
| 3 | 235 | 32 (40) | 26/38/25/24/26/35/26 | SP, SP, rice, brown, brown, SP, millet |
| 4 | 236 | 32 (39) | 25/25/27/27/33/26/34 | brown, brown, **SP, SP, SP**, millet, millet |
| 5 | 234 | 33 (39) | 26/29/28/34/27/34/25 | brown, brown, millet, millet, SP, SP, brown |
| 6 | 240 | 31 (39) | 24/25/28/33/26/24/24 | millet, millet, SP, SP, **brown ×3** |
| 7 | 228 | 30 (36) | 33/33/25/25/30/27/27 | SP, SP, rice, rice, brown, brown, millet |

All within ¥300; kcal/protein ok. Frictions a real person hits:

1. **Sweet potato volume.** The staple is used for both lunch and dinner, so an SP day = 290 g + 290 g baked 红薯 (seed 0 Tue) — **up to 660 g/day** across seeds. SP ≤3 days/week holds, but **3/8 weeks have the same staple 3 days running** (seeds 2, 4, 6). Staples are planned as 2-day rice-cooker batches, so 2 in a row is by design; the 3rd day comes from the batch + cap/fiber swaps (see arch A55). Seed 0 shopping list: 红薯 1 424 g raw.
2. **Trips / perishability.** Fresh fish and leafy greens land late in the week in every seed, e.g. seed 0 basa day 0+6, 上海青 day 6; seed 3 sole days 5–6, 鸡毛菜 day 3, 上海青 day 6; seed 7 seabass days 5–6, 生菜 day 6. One Sunday shop means 鲈鱼/leafy greens kept 5–6 days. The list has no "buy when" split. (Storage-time guidance not sourced this round → 未核对; the item only asks for a trip split, no shelf-life numbers.)
3. **Leftover opened packs.** 千张 0–100 g/week (seed 0: 50 g, seed 4: 0); 毛豆 150 g; 青椒 50 g; 鸡蛋 825–1 075 g/week. The data has no pack sizes, so the app can't tell the user "rest of the 千张 pack → use on day X". Pack sizes are not in any official source I found → leave as user-entered.
4. **Peas.** 青豆 side appears on ≤1 day/week (0 in seed 6) — fine, no friction.
5. List length: listLines 30–33 (pantry/small collapsed), 36–40 raw rows — R10-S1 target ≤32 met in 5/8 seeds.

## R11.2 R-15 — close
Shipped: fiber-low flag, N-04 swaps, R10-F1 (`FIBER_MIN 25`, staple alt, veg mult, peas side, `fiberNote`), R10-F2 (`weekFiber`). Walkthrough: 9/56 days < 25 g, all 23.5–24.9 g, **every one carries `fiberNote`**. At owner targets nothing further is needed → **R-15 done for 1800/140.** Caveat: the arch probe @8577366 (BACKLOG line 19) finds 221/756 days < 25 g on a wider target grid; that residual belongs to A55 and the planned oats-breakfast item, not to R-15. Only residual is cosmetic (24.9 g shows a "below target" note; the UI rounds to 25) — folded into R11-4.

## R11.3 Eating out / 聚餐 / hotpot

Guideline anchor: 《中国居民膳食指南（2022）》准则五 — adults ≤ 5 g salt and 25–30 g cooking oil per day (dg.cnsoc.org/article/04/ApX3_ozGTmSoqQaFFh5z_Q.html; cnsoc.org/notice/152220200.html). The same page says restaurant meals count toward the salt total.

Hotpot items, per 100 g edible (raw unless noted):

| item | source | kcal | protein | fat | carbs | protein g / 100 kcal |
|---|---|---|---|---|---|---|
| 鱿鱼(水浸) | 平台 #1131 | 76 | 17.0 | 0.8 | Tr | 22.3 |
| 牛肚 | 平台 #834 | 73 | 14.5 | 1.6 | Tr | 19.8 |
| 基围虾 (食部 60%) | 平台 #1093 | 102 | 18.2 | 1.4 | 3.9 | 17.8 |
| 牛肉(肥瘦,均值) | 平台 #823 | 126 | 19.9 | 4.2 | 2.0 | 15.8 |
| 鸭血(白鸭) | 平台 #899 | 109 | 13.6 | 0.4 | 12.4 | 12.5 |
| 北豆腐 | 平台 #334 | 99 | 12.2 | 4.8 | 2.0 | 12.3 |
| 墨鱼丸 | 平台 #1135 | 129 | 13.4 | 4.7 | 8.0 | 10.4 |
| 鱼丸 | 平台 #1067 | 108 | 11.1 | 1.3 | 12.7 | 10.3 |
| 腐竹 (dry) | 平台 #344 | 462 | 44.6 | 21.7 | 22.3 | 9.7 |
| 羊肉(肥瘦,均值) | 平台 #844 | 202 | 19.0 | 14.1 | Tr | 9.4 |
| 肥牛-type plate cut | FDC 172159 (inside skirt, choice, raw) | 195 | 20.1 | 12.8 | 0 | 10.3 |
| 午餐肉 | 平台 #807 | 228 | 9.4 | 15.9 | 12.0 | 4.1 |
| 金针菇 | 平台 #575 | 32 | 2.4 | 0.4 | 6.0 | — |
| 冬瓜 (食部 80%) | 平台 #419 | 12 | 0.4 | 0.2 | 2.6 | — |
| 芝麻油/香油 | 平台 #1508 | 882 | — | 99.7 | 0.2 | — |
| 芝麻酱 | app `sesamePaste` (CFCT) | 618 | 19.2 | 52.7 | 22.7 | — |

Dip arithmetic (from the rows above): 10 g 香油 ≈ 88 kcal / 10 g fat; 20 g 芝麻酱 ≈ 124 kcal / 10.5 g fat. **Not sourced:** how much fat a piece absorbs from red-oil (牛油) broth, and the 肥牛 actually served (FDC cut is a US proxy) → the app must show these as ≈ and not compute them precisely.

Strategy (for copy and logic; consistent with R-13 neutral tone — no "cheat", no red, no "补偿"):
- **Pre-allocate**: when the user marks a day 聚餐, move part of the day's fat into the dinner (lighter breakfast/lunch, keep protein), and keep the week's kcal in view (weekly average, as R-13 does).
- **Order protein first**: 鱿鱼/牛肚/虾/牛肉/鸭血/豆腐, then vegetables (金针菇/冬瓜/菌菇/绿叶), staple last. 午餐肉/肥羊/肥牛 are the low-protein-per-kcal end.
- **Broth & dip**: 清汤/番茄/菌汤 as the default suggestion; dip 香油 or 芝麻酱 is "measurable fat" — show it in g like the fat wallet.
- **Next day**: return to the normal plan. No kcal cut below target, no "punishment" deficit. Show the 7-day average and one line, e.g. "昨天聚餐，按计划吃就好".

## R11.4 Next 15 unverified foods by usage
Usage = meal-occurrences in 8 weeks (1800/140/¥300) + curated chips (chips now use verified twins). Already resolved in R10 excluded.

| # | id | uses | candidate | values (kcal/P/F/C/fib) | action |
|---|---|---|---|---|---|
| 1 | oil 食用油 | 112 | FDC 171411 soybean oil | 884/0/100/0/0 (app 899/0/99.9) | cite FDC or CFCT; diff < 2% |
| 2 | yogurt | 27 | — | — | stay ≈ (no 无糖 entry; R10) |
| 3 | soy 生抽 | 21 | FDC 174277 shoyu | 53/8.14/0.57/4.93/0.8 (app 63/5.6/0.1/10.1) | stay ≈: Chinese 生抽 ≠ US shoyu; use label |
| 4 | garlic | 19 | FDC 169230 | 149/6.36/0.5/33.1/2.1 (app 128/4.5) | cite FDC (small amounts) |
| 5 | egg (recipes) | 16 | twin eggUSDA FDC 171287 | — | recipes use `eggUSDA` (twinOf) |
| 6 | basa | 14 | none found | — | stay ≈ (label) |
| 7 | leanBeef | 14 | cut-dependent | — | stay ≈ |
| 8 | porkLoin | 12 | FDC 168249 lean (R9) | 109/21.0/2.17 | stay ≈ until cut decided |
| 9 | celery 西芹 | 8 | FDC 169988 | 14/0.69/0.17/2.97/1.6 (app 17/0.8/0.1/3.9/1.4) | cite FDC |
| 10 | enoki 金针菇 | 8 | 平台 #575 | 133 kJ ≈ 32/2.4/0.4/6.0 | matches → cite |
| 11 | shanghaiQing 上海青 | 6 | 平台 #457 油菜 (candidate) | 104 kJ ≈ 25/1.8/0.5/3.8 | equivalence 上海青=油菜 未核对 → stay ≈ or cite as proxy |
| 12 | cucumber | 6 | FDC 168409 | 15/0.65/0.11/3.63/0.5 | cite |
| 13 | edamame 毛豆 | 5 | FDC 168411 (frozen, prepared) | 121/11.9/5.2/8.91/5.2 (app 131/13.1/5/10.5/4) | cite FDC or CFCT 平台 #391 (not fetched) |
| 14 | broccoli (recipes) | 4 | twin broccoliUSDA | — | use twin |
| 15 | loofah 丝瓜 | 4 | 平台 #429 | 90 kJ ≈ 22/1.0/0.2/4.2 | matches → cite |
| also | napa #450, kongxincai #493, winterMelon #419, yam #525, jiaobai #519 | 2–3 | 平台 | match app within ~1 kcal | cite |

Not found: 蚝油, 芝麻酱 platform ids (not located this round); napa FDC id (my guess 169234 was hyacinth-beans — wrong, not used).
