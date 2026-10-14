# RESEARCH R10 — R-15 scope, data sources for top foods, R-01/R-11 status, real-week sanity (v0.10.10)

Base: `main` @ `8e6e1d5`–`a3ffb03` (v0.10.10). Docs only. Method: full clone, `node` running shipped `js/core/plan.js`; FDC API (DEMO_KEY, abridged, fetched 2026-10-15); 中国疾控中心营养与健康所「食物营养成分查询平台」(nlc.chinanutri.cn). Repro scripts: bot box `/workspace/r10/` (`r10.mjs`, `r10b.mjs`, `pf.py`); copy the `.mjs` into repo root and `node r10.mjs`.

## R10.0 Who pushed cbe10f9?
`cbe10f9` "test: A36-A39 golden scores, tasty coverage, determinism (v0.10.6)" — author **and** committer `grot666 <grot666@users.noreply.github.com>`, 2026-10-15 06:29 SGT, 11 files incl. `test/a36.test.js`, `test/data.test.js`.
Every needs-research commit (5206359, fe64837, 7274cc8, 12d5f2e, b4a51ce, d64fee0, ce83f23, 15d7f70, 41e8f9b, 3883509, afce1a2) is authored `yucheng <46624464+grot666@users.noreply.github.com>` (GitHub API) and touches only `BACKLOG.md` or `docs/*.md`. **cbe10f9 is not ours.**

## R10.1 R-15 (fiber) — what's left
Shipped: fiber-low flag, ranked swaps (N-04, Ruling R8). Not covered: **the plan generator itself ignores fiber.**
Grid 1800 kcal × protein {130,145,160} × budget {none, 200} × seeds 0–5 = 36 weeks / 252 days: **201 days (80%) < 25 g fiber, 153 (61%) < 20 g**, range 11–38 g. (PROMPT §2.1 target 25–30 g.) Breakfasts 水煮蛋+玉米+酸奶 and 白面包-free options carry little; low days are mostly white rice + low-fiber veg (e.g. 冬瓜, 生菜) + snack without kiwi (`KIWI_G` includes 0).
→ Items R10-F1/F2 in BACKLOG.

## R10.2 Unverified foods by real use + sources
Usage = grams across the 36 weeks above, plus `CURATED_CHIPS` membership. 137 foods, 27 verified. Unverified curated chips: `egg, broccoli, oats, tofuFirm` (verified twins `eggUSDA`, `broccoliUSDA`, `oatsDry` exist).

kcal from platform kJ ÷ 4.184. Platform pages give no edition or 6-digit CFCT food code — cite as "营养所查询平台 #id"; **edition/code 未核对**.

| # | id (app kcal/P/F/C) | g | source found | values (per 100 g edible) | action |
|---|---|---|---|---|---|
| 1 | tofuFirm 北豆腐 (116/12.2/4.8/2.0) | 45 389 | 平台 #334 豆腐(北) | 415 kJ ≈ **99** kcal / 12.2 / 4.8 / 2.0 | **fix kcal 116→99**, cite |
| — | 嫩豆腐 (not in app) | — | 平台 #335 豆腐(南); #336 内酯 | 240 kJ ≈ 57 / 6.2 / 2.5 / 2.6; 内酯 P 5.0 F 1.9 C 3.3 | add if wanted |
| 2 | yogurt 无糖酸奶 (72/3.2/3.5/6.7) | 22 841 | 平台 #958 酸奶均值; #959 脱脂 | 301 kJ ≈ 72 / 2.5 / 2.7 / 9.3; 241 kJ ≈ 58 / 3.3 / 0.4 / 10.0 | no 无糖 entry; both are sweetened-style carbs → stay ≈, label-based |
| 3 | corn 玉米(鲜) (112/4.0/1.2/22.8) | 18 850 | 平台 #292 (食部 46%) | 474 kJ ≈ 113 / 4.0 / 1.2 / 22.8 | matches → cite; note 46% edible (cob) |
| 4 | basa 巴沙鱼 (90/15/3) | 16 430 | none on platform; FDC SR search failed earlier | — | stay ≈ (glazed frozen fillet; use label) |
| 5 | porkLoin 猪里脊 (155/20.2/7.9) | 15 260 | FDC 168249 (lean only) 109/21.0/2.17 (R9) | — | platform id not found this round → stay ≈, note FDC gap |
| 6 | sole 龙利鱼 (80/16.0/1.5) | 8 990 | 平台 #1045 舌鳎 (食部 68%); FDC 174196 flatfish raw | 353 kJ ≈ 84 / 17.7 / 1.4 / Tr; FDC 70 / 12.4 / 1.93 / 0 | cite 平台 #1045; note retail "龙利鱼柳" species varies |
| 7 | leanBeef 瘦牛肉 | 6 535 | cut-dependent (R9) | — | stay ≈ |
| 8 | wwBread 全麦面包 (247/13/3.4/41/6) | 6 186 | FDC 172688 | 252 / 12.4 / 3.5 / 42.7 / 6.0 | cite FDC 172688 |
| 9 | tomato (20/0.9/0.2/4.0/0.5) | 5 550 | FDC 170457 | 18 / 0.88 / 0.2 / 3.89 / 1.2 | cite (fiber 0.5→1.2) |
| 10 | frozenVeg (64/3/0.4/13/4) | 4 650 | FDC 170471 mixed frozen unprepared | 72 / 3.33 / 0.52 / 13.5 / 4.0 | cite |
| 11 | lettuce | 4 350 | not fetched (FDC rate-limited) | — | next round |
| 12 | cabbage | 4 200 | FDC 169975 | 25 / 1.28 / 0.1 / 5.8 / 2.5 | cite |
| 13 | shanghaiQing 上海青 | 4 200 | Chinese veg; platform id not located | — | stay ≈ |
| 14 | cauliflower | 3 600 | FDC 169986 | 25 / 1.92 / 0.28 / 4.97 / 2.0 | cite |
| 15 | zucchini | 2 700 | FDC 169291 | 17 / 1.21 / 0.32 / 3.11 / 1.0 | cite |
| add-on | qianzhang 千张 (262/24.5/16/5.5) | — | 平台 #345 千张[百页] | 1093 kJ ≈ 261 / 24.5 / 16.0 / 5.5 | matches → cite |
| add-on | doufugan 豆干 (197/16.2/**11.3**/9.6) | — | 平台 #346 豆腐干(均值) | 597 kJ ≈ **143** / 16.2 / **3.6** / 11.5 | **fix: fat 11.3→3.6, kcal 197→143** |
| — | milk 牛奶 (65/3.3/3.6/4.9) | (breakfast) | 平台 #916 牛乳均值; FDC 171265 | 227 kJ ≈ 54 / 3.0 / 3.2 / 3.4; FDC 61 / 3.15 / 3.25 / 4.8 | pick one and cite (app matches neither exactly) |
| — | seabass 鲈鱼 (105/18.6/3.4) | — | 平台 #1050 | 442 kJ ≈ 106 / 18.6 / 3.4 | matches → cite |

Confirmed FDC ids (abridged API): **pasta = FDC 169736** "Pasta, dry, enriched" 371/13.0/1.51/74.7/3.2 — app matches. **sweetPotato = FDC 168482** raw 86/1.57/0.05/20.1/3.0 — matches; **sweetPotatoBaked = FDC 168483** baked in skin 90/2.01/0.15/20.7/3.3.

Not accessible from a citable source this round: 无糖酸奶 (no entry), 巴沙鱼, 猪里脊/上海青 platform ids (not located), lettuce (rate limit).

## R10.3 R-01 / R-11 status
- **R-01b pace (R6)**: shipped — `paceCheck` in `js/core/profile.js:23`, used in `me.js:71` and onboarding (`today.js:81`); trend check `weeklyStatus` (`weight.js`, fast > 1 %/wk) used in `me.js` and `review-page.js`. Nothing left to spec.
- **R-11b one-tray (R7)**: shipped v0.7.0 — `data/sauces.js` (SAUCES, TRAY_STEPS) rendered by `plan-page.js`. Nothing left.
- Engineer marked R-01/R-11 done in a3ffb03 — consistent with this check.

## R10.4 Real-week sanity (v0.10.10, 1800 kcal)
- kcal/protein: `checkWeek` all ok, 36/36 weeks.
- **Cost**: no budget ¥191–216 (p130), ¥209–243 (p145), ¥219–257 (p160). With ¥200 budget: ¥176–197, never over.
- **Shopping list: avg 39.6 lines/week (38–42)**; avg 5.8 lines ≤ 50 g (e.g. 青椒 25 g, 千张 25 g, 生抽 5 g, 西芹 50 g, 香菇 50 g); `西兰花` and `西兰花(USDA)` appear as two lines (0.5 pairs/week). A real shopper would balk at 40 lines and 25 g items.
- Big volumes (1800/145, seed 0, budget 200): 北豆腐 1 412 g, 牛奶 1 376 g, 鸡蛋 1 000 g + 蛋清 198 g, 红薯 594 g, 猕猴桃 600 g per week.
- **Cooked protein per meal still reaches 280–300 g** at p145/p160 (cap 300).
- Veg-recipe active minutes (sum of recipe `min` for lunch+dinner veg): 78–101 min/week ≈ 11–14 min/day. Fine.
- TFCC: 1–3 `wristSafe:false` steps per week, all carry a wristNote. No unflagged 拍/剁/颠锅.

Repro: `node r10.mjs` (grid table) and `node r10b.mjs` → `{days:252, fiberLt25:201, fiberLt20:153, avgLines:39.6, avgSmallLe50g:5.8}`.
