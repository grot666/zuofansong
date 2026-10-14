# PROGRESS

- 2026-10-15 ~04:45 SGT — v0.5.0: 每周复盘 page (review.html + js/core/review.js, N-06): 7-day adherence, avg kcal/protein/fat/fiber/water, daily oil vs 膳食指南 25–30 g (R-08b), low-value fat %, cost & takeaway count, tuna weekly counter light ≤339 g / albacore ≤113 g (R-09), plateau check (R-10: ≥10 logs in 14 d, MA flat), one decision (−125 kcal / steps / 维持周 / sauce) with confirm. SW caches only ok+basic responses. Nav: 菜单 tab in main nav; 复盘 link in footer. CI run #3 green.
- 2026-10-15 ~04:40 SGT — CI workflow (.github/workflows/ci.yml): node --check every JS + node --test. Runs #1–#3 all green (tests incl. plan generator, fiber, weight, review).
- 2026-10-15 ~04:35 SGT — v0.4.0: foods 127 (data/foods3.js: 20 Shanghai takeaway/breakfast estimates from R5.1 + kiwi USDA FDC 168153 + 12 CFCT items); recipes 34 (renamed r9 水煮冬瓜汤, r24 蒸山药胡萝卜; +微波南瓜, 清炒荷兰豆); fiber swaps (N-04, 糙米 corrected +2.4 g/−14 kcal per 200 g); MA7 weight chart (N-02); meal templates 1-tap + 撤销 (N-03 partial); takeaway tips; slip-recovery copy (R-13).
- 2026-10-15 ~04:25 SGT — v0.3.0: 一周菜单 (plan.html + js/core/plan.js), shopping list, 周日备餐.
- 2026-10-15 ~04:20 SGT — v0.2.0: 懒人蔬菜 32 recipes; foods ≈100 (22 USDA FDC verified); protein modes (default fixed 140 g); 记入我的计划日; fiber flag; rice safety notes.
- 2026-10-15 ~04:00 SGT — v0.1.0 scaffold: features 1–8 basic, PWA, export/import/reset, 更新日志.

All shipped via GitHub connector: box shell unavailable ("still starting up") since ~03:40 SGT → **GitHub Pages NOT enabled yet** (needs `gh api -X POST repos/grot666/zuofansong/pages -f 'source[branch]=main' -f 'source[path]=/'` or Settings → Pages). Tests run in CI only.

Known gaps: app.js in-app VERSION/更新日志 still say 0.4.0 (review page is 0.5.0) → A3; templates lack ×0.5/×1.5 chips; weekly plan ignores budget (A9); bedtime/caffeine nudge (R-04/R-12) not built.
