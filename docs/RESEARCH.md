# RESEARCH.md — 需求与营养研究 (needs-research worker)

Docs only. Every number has a source URL or is marked as arithmetic / design assumption.
User (owner's plan doc): male, 29y, 173.5 cm, 74 kg, est. BF 25–30%, goal 58 kg by 2027-07-31, TFCC wrist injury, poor sleep, likes chicken thigh / rice / canned tuna / roasted veg, ~30 min evening batch prep.
Round 5 (takeaway table, fiber swaps, chart/review/template specs): docs/RESEARCH-R5.md.

---

## R1 — targets, safety, sleep, wrist

### R1.1 Goal feasibility: pace fine, end-point very lean
- 74 → 58 kg over ~41 weeks ≈ 0.39 kg/wk ≈ 0.53% BW/wk at start, ~0.67%/wk near the end (arithmetic).
- ISSN: ~0.5–1.0% BW/wk to retain lean mass; slower as people get leaner (Garthe: 0.7%/wk beat 1.4%/wk). https://pmc.ncbi.nlm.nih.gov/articles/PMC5470183/ ; https://www.tandfonline.com/doi/full/10.1080/15502783.2026.2740266
- At 25–30% BF: fat ≈ 18.5–22.2 kg, lean ≈ 51.8–55.5 kg. 58 kg with zero lean loss ⇒ ≈ 4–11% BF; BMI ≈ 19.3 (arithmetic). "58 kg AND keep all muscle" likely not both achievable → re-evaluate goal around 62–64 kg with waist/photos.

### R1.2 Protein
- Helms 2014: 2.3–3.1 g/kg fat-free mass in deficit. https://journals.humankinetics.com/view/journals/ijsnem/24/2/article-p127.xml
- Later review: 1.6–2.4 g/kg BW. https://journals.humankinetics.com/view/journals/ijsnem/28/2/article-p170.xml
- FFM 52–55 kg → ≈120–170 g/d; his plan 130–160 g fits; 1.6 g/kg × 74 ≈ 118 g is the bottom.

### R1.3 Batch-cooked rice safety
- UK FSA/NHS: cool within ~1 h (spread out, not in the cooker), fridge, eat within 24 h, reheat once until steaming. B. cereus toxins survive reheating. https://www.gov.uk/government/publications/home-food-fact-checker/home-food-fact-checker ; https://www.nhs.uk/best-start-in-life/baby/weaning/safe-weaning/storing-and-reheating-food/
- Weak evidence: rice chilled 24 h at 4°C then reheated: resistant starch 0.64→1.65 g/100 g, lower glycemic response (n=15). https://apjcn.qdu.edu.cn/24_4_24.pdf

### R1.4 Dinner timing and sleep
- ~700 kcal dinner 1 h before bed → shorter sleep vs 5 h before (n=13); another study (n=20) little change. https://link.springer.com/article/10.1186/s40101-026-00430-0 ; https://www.dovepress.com/effects-of-dinner-timing-on-sleep-stage-distribution-and-eeg-power-spe-peer-reviewed-fulltext-article-NSS

### R1.5 Wrist (TFCC) in the kitchen
- Avoid ulnar-side load + forearm rotation, forceful grip, heavy lifting, jar opening; keep wrist neutral. https://www.handtherapyacademy.com/treatments/management-of-a-tfcc-injury-in-hand-therapy/ ; https://ifsht.org/wp-content/uploads/2022/03/Hand-Therapy-contribution-from-EZINE-issue-45-february-2022.pdf
- Practical translation (not clinical): no wok tossing / one-hand heavy pans; sheet-pan/air-fryer, rice cooker, microwave; pre-cut 净菜, frozen veg, boneless thigh; pull-tab cans; two-handed lifts.

## R2 — coarse grains
- GI (Atkinson 2021 tables): white rice avg 73, brown 65, oat products 55; varies by product. https://ajcn.nutrition.org/article/S0002-9165(22)00494-4/fulltext
- Cooked kcal nearly equal (R3.1): coarse grains raise fiber, not lower kcal. 400 g cooked white rice ≈ 520 kcal ≈ 29% of 1800 kcal.

## R3 — verified data, fish, oil, sleep foods, plateaus, user pain points

### R3.1 + R4.1 USDA FDC values — verified via official API (SR Legacy, per 100 g)
Query: `https://api.nal.usda.gov/fdc/v1/foods?fdcIds=<ids>&format=abridged` (DEMO_KEY), 2026-10-15. Human link: `https://fdc.nal.usda.gov/food-details/<id>/nutrients`.

| Food (FDC) | kcal | P | F | C | fiber |
|---|---|---|---|---|---|
| Chicken thigh, meat only, roasted (172388) | 179 | 24.8 | 8.15 | 0 | 0 |
| Chicken breast, meat only, roasted (171477) | 165 | 31.0 | 3.57 | 0 | 0 |
| Tuna light, canned in water, drained (173709) | 86 | 19.4 | 0.96 | 0 | 0 |
| Tuna white, canned in water, drained (175158) | 128 | 23.6 | 2.97 | 0 | 0 |
| Rice white long-grain enriched, cooked (168878) | 130 | 2.69 | 0.28 | 28.2 | 0.4 |
| Rice brown long-grain, cooked (169704) | 123 | 2.74 | 0.97 | 25.6 | 1.6 |
| Millet, cooked (168871) | 119 | 3.51 | 1.00 | 23.7 | 1.3 |
| Broccoli, raw (170379) | 34 | 2.82 | 0.37 | 6.64 | 2.6 |
| Broccoli, boiled (169967) | 35 | 2.38 | 0.41 | 7.18 | 3.3 |
| Carrots, raw (170393) | 41 | 0.93 | 0.24 | 9.58 | 2.8 |
| Olive oil (171413) | 884 | 0 | 100 | 0 | 0 |
| Egg, whole, raw (171287) | 143 | 12.6 | 9.51 | 0.72 | 0 |
| Egg, hard-boiled (173424) | 155 | 12.6 | 10.6 | 1.12 | 0 |
| Shrimp, cooked (175180) | 99 | 24.0 | 0.28 | 0.20 | — |
| Tofu firm, CaSO4 (172475) | 144 | 17.3 | 8.72 | 2.78 | 2.3 |
| Salmon Atlantic farmed, cooked (175168) | 206 | 22.1 | 12.4 | 0 | 0 |
| Oats, dry (169705) | 389 | 16.9 | 6.90 | 66.3 | 10.6 |
| Sweet potato, baked flesh (168483) | 90 | 2.01 | 0.15 | 20.7 | 3.3 |
| Spinach, raw (168462) | 23 | 2.86 | 0.39 | 3.63 | 2.2 |
| White mushroom, raw (169251) | 22 | 3.09 | 0.34 | 3.26 | 1.0 |
| Peas, green, raw (170419) | 81 | 5.42 | 0.40 | 14.4 | 5.7 |
| Avocado, raw (171705) | 160 | 2.00 | 14.7 | 8.53 | 6.7 |

南豆腐 differs from US firm tofu → keep `verified:false` until a 中国食物成分表 value is added. Kiwi (FDC 168153) not yet verified.

### R3.2 Thigh vs breast
- Per 30 g protein: thigh ≈121 g → 217 kcal / 9.9 g fat; breast ≈97 g → 160 kcal / 3.5 g fat; Δ ≈ 57 kcal, 6 g fat (arithmetic). Fair trade for adherence; skin off.

### R3.3 Tuna and mercury (FDA/EPA)
- Canned light tuna (incl. skipjack 鲣鱼) = Best Choice; albacore/white (长鳍) & yellowfin = Good Choice (albacore ≈3× mercury of light); bigeye = avoid. Servings (2–3 × 113 g/wk Best, or 1 Good and no other fish) are written for pregnancy/children; DGA: ≥ 8 oz seafood/wk for adults. Use as conservative soft limit. https://www.fda.gov/food/consumers/advice-about-eating-fish ; https://www.fda.gov/food/consumers/questions-answers-fdaepa-advice-about-eating-fish-those-who-might-become-or-are-pregnant-or ; https://www.epa.gov/choose-fish-and-shellfish-wisely/epa-fda-advice-about-eating-fish-and-shellfish

### R3.4 Oil
- 10 g oil ≈ 88 kcal (FDC 171413). 中国居民膳食指南2022: oil 25–30 g/d, salt < 5 g/d. http://dg.cnsoc.org/article/04/ApX3_ozGTmSoqQaFFh5z_Q.html
- 300 g broccoli + 200 g carrot ≈ 184 kcal; +15 g oil = +133 kcal (~42% of tray) (arithmetic).

### R3.5 Sleep foods & caffeine
- 2 kiwis 1 h before bed × 4 wk: sleep onset −35%, total sleep +13% (n=24, uncontrolled). https://apjcn.qdu.edu.cn/20_2_22.pdf
- 400 mg caffeine even 6 h before bed cut sleep >1 h (n=12, placebo-controlled). https://europepmc.org/article/med/24235903

### R3.6 Plateaus / diet breaks
- MATADOR: 2 wk deficit / 2 wk maintenance beat continuous (fat loss 12.3 vs 8.0 kg), similar lean loss, better 6-mo retention; obese men, may not generalise. https://pmc.ncbi.nlm.nih.gov/articles/PMC5803575/

### R3.7 Chinese user pain points (public)
- DT财经 survey via 投资界: 12.7% cook daily; top barriers 没时间 / 食材准备太复杂 / 不想洗碗; light-meal takeaway ≈ ¥30+, DIY 人粮 < ¥10/meal. https://news.pedaily.cn/202607/565754.shtml
- 知乎: crash diets → binge after reward meal; fewer takeaways/奶茶 worked; track girth at plateaus. https://www.zhihu.com/pin/special/1490786628621201408
- Boredom with identical boxes; all-or-nothing after a slip; night eating after 21:00 (anecdotal). https://nutrola.app/zh/blog/why-meal-plans-dont-work-for-most-people ; https://yunshangyoupin.com/719713

## R4 — owner's sample day audit & evening workflow

### R4.2 Sample day (values from table above)
3 eggs (150 g raw) 215 kcal/18.9 P/14.3 F · 400 g white rice 520/10.8/1.1 · 360 g thigh 644/89.3/29.3 · 100 g light tuna 86/19.4/1.0 · 300 g broccoli + 200 g carrot 184/10.3/1.6 · 15 g oil 133/0/15.
**Total ≈ 1782 kcal / 149 g P / 62 g F / 153 g C / 15 g fiber.** Within his plan's kcal/protein/fat; **fiber far below 25–30 g**. Swapping 200 g of the white rice for brown adds only ≈2.4 g; oats 40 g (+4.2), peas 100 g (+5.7), more veg/fruit needed.

### R4.3 30-min wrist-friendly evening workflow (design proposal; timings to user-test)
1. 0–3 min rice cooker on (小米/燕麦米 no soak; soak 糙米 in the morning). 2. 3–10 min boneless thigh + pre-cut veg on one lined tray; weigh oil in a bowl, toss with spatula. 3. 10–30 min roast unattended; eat tonight's dinner. 4. Spread rice in shallow boxes to cool ≤ 1 h → fridge; portion tomorrow's boxes.
