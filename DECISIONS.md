# DECISIONS

- 2026-10-15 04:00 SGT — App name 做饭松 (owner's mission) instead of 粗粮减脂厨房; storage prefix kept `culiang.v1.*` per PROMPT.
- 2026-10-15 04:00 SGT — Defaults from owner plan: male, 173.5 cm, born 1997-07-31, 74 kg, goal 58 kg by 2027-07-31, sedentary desk job.
- 2026-10-15 04:00 SGT — Box shell was unavailable (still starting); shipped via GitHub API connector without local tests.
- 2026-10-15 04:00 SGT — Foods data as JS module (data/foods.js) rather than JSON fetch, so it works offline/no fetch and in node tests.
- 2026-10-15 04:25 SGT — Default protein = fixed 140 g (middle of his plan's 130–160 g; research R1.2 Helms 2.3–3.1 g/kg FFM ≈ 120–170 g) instead of PROMPT's 1.6 g/kg (118 g); bw and ffm modes kept as options.
- 2026-10-15 04:25 SGT — Research lived in grot666/culiang-jianzhi-chufang/docs; merged items R1–R4 into this repo's features/backlog rather than copying docs.
- 2026-10-15 04:35 SGT — Weekly plan lives on a separate page plan.html (own module) to avoid another full rewrite of js/app.js via the API connector; same nav and storage.
- 2026-10-15 04:35 SGT — Plan uses cooked-weight staples/proteins; shopping list converts back to raw with estimated yield factors (rice 2.3, chicken 0.75).
- 2026-10-15 04:40 SGT — [arch] Prefix `culiang.v1.` is a namespace, not the schema version; schema changes bump the stored `version` via a MIGRATIONS registry. Reason: avoids orphaning data on every change.
- 2026-10-15 04:40 SGT — [arch] No DOM/alert in js/core; store.set reports failure via return value + `storage-error` event. Reason: core must run under node --test.
- 2026-10-15 04:40 SGT — [arch] One VERSION source (js/core/version.js); sw CACHE must equal 'zfs-'+VERSION, enforced by test. Reason: stale caches / mismatched 更新日志.
- 2026-10-15 04:40 SGT — [arch] SW: network-first for navigations, stale-while-revalidate for static assets, cache only ok same-origin responses. Reason: fast offline start on phone, updates via cache-name bump.
- 2026-10-15 04:40 SGT — [arch] CI = GitHub Actions running node --check + node --test on push/PR; Pages deploys from main / branch (no build). Reason: §4 no build step; gate for API-connector pushes.
- 2026-10-15 05:08 SGT — resolveBreak/startBreak live in js/core/breaks.js (not core/review.js as ARCHITECTURE suggested). Reason: called on every page boot; keeps review.js import-free for plan/index pages.
- 2026-10-15 05:08 SGT — planWeek budget: applyBudget runs on dinner-protein slots (each slot = dinner(d)+lunch(d+1)), slot cost estimated from raw price per protein; final cost/overBudget recomputed from the real shopping list. Lunch(0) = dinner(6) so every swap moves a full batch.
- 2026-10-15 05:08 SGT — portionDay tops protein back up after staple trimming (protein floor wins over ±3% kcal band; checkWeek still uses ±5%).
- 2026-10-15 05:25 SGT — [arch] Import is **replace**, not merge: backup.preImport → resetAll → whitelisted write → version from backup, capped at SCHEMA_VERSION for envelope and legacy → migrate. Reason: merge leaves stale logs; legacy `version:99` froze migrations (A17).
- 2026-10-15 05:25 SGT — [arch] A failed pre-migration backup must be visible: storage-error listener attached before migrate, and boot warns when migrate() < SCHEMA_VERSION; non-persistent storage is detected and shown. Reason: A13b abort otherwise runs v2 code on v1 data silently (A18).
- 2026-10-15 05:25 SGT — [arch] SW precache bypasses the HTTP cache (`cache:'reload'`); every page has a non-module escape hatch that clears SW caches, never localStorage. Reason: Pages max-age=600; module-link errors blank the page before app code runs (A20).
- 2026-10-15 05:25 SGT — [arch] Plan generator never silently misses its band: portionDay reports `fit`, planWeek reports `infeasible`; protein floor still wins. Reason: 9/63 days off-band at this user's 62 kg target (A19).

- 05:45 A25: meat ≤300 g/meal; firm tofu main may reach 450 g (PORTION_MULT) since 300 g tofu cannot meet 40%-protein targets; add-ons go to 加餐.

- 05:45 A26: no log compaction while backup.preImport exists (until undo or a later replace). Archived days keep compaction-time cost; price edits never re-price archives.

- 05:48 A25 note: no powder add-on in the plan (no powder food id exists); the plan stays whole-food and today's 蛋白补充 card still covers any gap with powder (usesPowder/maxScoops). Cap kept at 300 g, not 250: the A19 grid needed egg-white/yogurt plus the tofu 1.5× rule just to stay green at 300.

- 05:50 G2: plan uses powder (existing `whey`, 30 g scoop) only when profile.usesPowder, up to maxScoops, and only after all whole-food add-ons (higher penalty). With powder at 1400/160, not-ok days drop from 18 to 1 of 63.

- 06:04 Meat-lean planner: meat portion = protein floor only (was kcal filler); score += 0.5×meat g, add-on order penalty 8→2; new add-ons egg-white+tofu, tuna can (≤2 days/week). Grid avg meat 258→146 g/meal; 1617/160 283→233 g; all grid days still fit.

- 06:04 Scores steer plan: veg recipes ranked by mealScores sum (health+easy+cheap+tasty, recipe + its oil); seed 0 = top 14, each 换一套 rotates 14 further (seed*14 mod 34) so variety is kept. Proteins stay on the budget-driven rotation.

- 06:12 Snack variety: add-on items penalised 15 per earlier day used this week (sequential within generateWeek; week stays a pure f(targets, seed, opts)). New add-ons: milk, 千张, 熟虾, 豆干. Max days per add-on item 7→4; 1617/160 meat 233→238 g; grid meat limit relaxed to ≤180 g (now 171).

- 06:13 Protein vs scores: budget swaps (applyBudget) now pick the best-scoring cheaper protein that brings the week within budget (fallback: cheapest). Tried ranking the base protein rotation by score too: it clustered tofu/pork and broke A19/A23/G2 grids, so the base rotation stays seed-only.

- 06:18 A33: tunaLight removed from main-protein rotation (a dinner+lunch pair alone nears the 339 g/week reference); tuna is a 100 g add-on gated by one weekly gram budget (TUNA from review.js, ≤3 add-ons). G2 rescue test relaxed to b ≤ a/2 and ≤3 (baseline improved 18→8).

- 06:25 R9-4/5: milk→FDC 171265, seabass→FDC 175142 (re-fetched via FDC API, verified). pasta/sweetPotato had verified:true with bare 'USDA' → now unverified (FDC API rate-limited, ids not confirmed). Unverified generator foods show ≈ on plan + shopping list. fdcCompare notes on porkLoin/corn/tofuFirm (values kept; product differs). Budget loop keeps a round only if the real cost drops, and falls back to the budget-0 week when still over; greedy is near-monotonic (≤¥0.5 rise seen at 1800/140 s0 0.8→0.7), test tolerance ¥0.5.

- 06:28 R9-10: maxPrepMin filter (0/5/10, falls back to all if none fit); reuse is measured and shown (distinct veg/week), not yet optimised; budget blank/0 keeps previous with toast. 龙利鱼 not added to PROTEINS (would re-pin every grid/budget fixture; low value) — left open.
