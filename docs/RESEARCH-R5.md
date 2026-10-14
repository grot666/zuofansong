# RESEARCH round 5 — 2026-10-15 (SGT)

## R5.1 Shanghai takeaway / breakfast — ESTIMATED energy (all `verified:false`, show ≈)
Source: fatsecret.cn Chinese food database search (generic entries), 2026-10-15, URL `https://www.fatsecret.cn/热量营养/search?q=<菜名>`. Same-name dishes vary ~10–20% per 百度健康 on 薄荷食物库 (https://health.baidu.com/m/detail/ar_6375304350607972256); oil-heavy dishes likely more.
"Source portion" = stated by source. "Default portion" = **design assumption** (editable; recommend weighing once).

| Dish | kcal/100 g | P/F/C | Source portion | Default (assumption) | ≈kcal |
|---|---|---|---|---|---|
| 生煎包 | 282 | 10.0/12.8/34.3 | 1个 = 70 | 4个 | 280 |
| 小笼包 | 238 | 12.3/11.5/22.6 | 1个 = 83 | 8个 | 664 |
| 鲜肉小馄飨 | 259 (馄飨 230) | 10.4/6.9/37.6 | 馄飨 1个 = 44 | 15个, 汤不计 | 660 |
| 葱油拌面 | 144 | 4.3/4.8/20.7 | — | 350 g | 504 |
| 兰州拉面 | 117 | 4.9/4.0/15.2 | 300 g = 350 | 500 g | 585 |
| 大排 (炸) | 250 | 17.1/17.9/4.5 | — | 120 g | 300 (+面) |
| 黄焖鸡米饭 | 167 | 14.1/7.8/9.5 | — | 500 g | 835 |
| 卤肉饭 | 187 | 5.9/9.6/18.9 | 120 g = 224 | 350 g | 655 |
| 蛋炒饭 | 164 | 5.1/7.9/17.8 | — | 350 g | 574 |
| 煲仔饭 | — | — | 300 g = 455 | 300 g | 455 |
| 麻辣烫 (不含汤) | 70 | 4.0/3.6/6.4 | — | 500 g | 350 (麻酱另计) |
| 麻辣香锅 | 99 | 4.6/5.2/9.7 | — | 500 g | 495 (+米饭) |
| 酸菜鱼 | 95 | 13.4/2.8/3.2 | — | 400 g | 380 (+米饭) |
| 煎饼果子 | 161 | 6.3/2.6/27.1 | — | 250 g | 403 |
| 鸡蛋灌饼 | 253 | 12.3/7.5/34.7 | 1个 200 g = 506 | 1个 | 506 |
| 肉夹馍 | 238 | 13.7/6.4/34.1 | 1个 200 g = 476 | 1个 | 476 |
| 饭团/粢饭团 | 163 (便利店 174–220) | 4.3/3.4/28.2 | 1个 = 179 | 1个 | 179–358 |
| 茶叶蛋 | 147 | 12.5/10.1/1.1 | 1个 60 g = 88 | 1个 | 88 |
| 羊肉泡馍 | 133 | 6.0/4.9/17.7 | 200 g = 265 | 500 g | 665 |
| 米饭 (参考) | 116 | 2.6/0.3/25.9 | 1碗 150 g = 174 | 1碗 | 174 |

Tips copy: 备注“少油少酱”、汤和红油不喝、麻酱/底油单放、蒸煮白灼优于炸/红烧 (oil/salt guideline: http://dg.cnsoc.org/article/04/ApX3_ozGTmSoqQaFFh5z_Q.html).

## R5.2 Fiber swaps — UI copy + rules (values: docs/RESEARCH.md table)
Rules: trigger when fiber < 60% target after 17:00 or projected day < target; rank by fiberGain / max(kcalDelta, 20); top 3; never push day > kcal target +5%; add water tip if gut-comfort risk high.

| id | Copy | fiberGain g | kcalDelta |
|---|---|---|---|
| oats40 | 早餐粥里加 40 g 燕麦片，纤维 +4.2 g | +4.2 | +156 |
| peas100 | 饭里拌 100 g 豌豆，纤维 +5.7 g | +5.7 | +81 |
| broc200 | 晚餐多一份 200 g 白灼西兰花，纤维 +6.6 g | +6.6 | +70 |
| spinach200 | 加一盘 200 g 菠菜，纤维 +4.4 g | +4.4 | +46 |
| sweetpot | 把 150 g 白米饭换成 150 g 烤红薯，纤维 +4.4 g，热量 −60 kcal | +4.4 | −60 |
| brown200 | 把 200 g 白米饭换成糙米，纤维 +2.4 g，热量 −14 kcal（帮助有限） | +2.4 | −14 |
| mushroom150 | 炒菜加 150 g 蘑菇，纤维 +1.5 g | +1.5 | +33 |
Kiwi: show only after FDC 168153 is verified.

## R5.3 Weight log + 7-day moving average chart
- Entry: one tap, 1 decimal, prefilled, back-fill date, one entry/date. Storage `weights:[{date,kg}]`, exported.
- MA7 = mean of entries in [date−6, date], shown only with ≥ 3 entries (else gap). (Current app uses last-7-entries average — switch to calendar window so sparse weighing doesn't span weeks.)
- Chart: inline SVG; raw dots light, MA7 line bold, dashed goal line, dotted projected pace; 4w/8w/12w/全部; tap tooltip (date, raw, MA7).
- Chips: 本周均值, 较上周 ±kg (±%), status 正常 0.25–1%/wk / 偏快 >1% / 持平 (<0.1 kg over 14 d with ≥5 logs/wk) (pace basis R1.1).
- Empty state: "每周称 2–3 次，早上空腹、如厕后"; text summary for screen readers; 360 px; dark mode.

## R5.4 Weekly review (Sunday, ~2 min, auto-filled)
1 体重 MA7 vs last week · 2 days logged & within ±10% kcal · 3 avg protein vs target · 4 avg fiber vs 25–30 g · 5 avg fat & % low-value · 6 avg water · 7 est. food cost & takeaway count · 8 evenings prepped · 9 optional sleep 1–5 + dinner-to-bed gap · 10 one decision: 保持 / −100–150 kcal / +步数 / 维持周 (R3.6) / 换调味. Missing data = "未记录", neutral tone.

## R5.5 Saved meal templates + 3-tap logging
- Model `{id,name,items:[{foodId,grams}],lastUsed,useCount}`.
- Create from plate builder / logged meal ("存为模板"); presets: 计划日·早餐 (3 eggs + oat porridge), 烤鸡腿饭 (120 g thigh + 200 g rice + 250 g veg + 5 g oil), 金枪鱼加餐 (100 g light tuna + veg).
- Flow: "+" → 常用/最近/搜索 sheet → template card → 记录 (×0.5/×1/×1.5) = 3 taps; undo toast. "复制昨天" with checkbox confirm. Takeaway search hits R5.1 rows with ≈.
