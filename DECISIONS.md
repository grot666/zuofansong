# DECISIONS

- 2026-10-15 04:00 SGT — App name 做饭松 (owner's mission) instead of 粗粮减脂厨房; storage prefix kept `culiang.v1.*` per PROMPT.
- 2026-10-15 04:00 SGT — Defaults from owner plan: male, 173.5 cm, born 1997-07-31, 74 kg, goal 58 kg by 2027-07-31, sedentary desk job.
- 2026-10-15 04:00 SGT — Box shell was unavailable (still starting); shipped via GitHub API connector without local tests.
- 2026-10-15 04:00 SGT — Foods data as JS module (data/foods.js) rather than JSON fetch, so it works offline/no fetch and in node tests.
- 2026-10-15 04:25 SGT — Default protein = fixed 140 g (middle of his plan's 130–160 g; research R1.2 Helms 2.3–3.1 g/kg FFM ≈ 120–170 g) instead of PROMPT's 1.6 g/kg (118 g); bw and ffm modes kept as options.
- 2026-10-15 04:25 SGT — Research lived in grot666/culiang-jianzhi-chufang/docs; merged items R1–R4 into this repo's features/backlog rather than copying docs.
- 2026-10-15 04:35 SGT — Weekly plan lives on a separate page plan.html (own module) to avoid another full rewrite of js/app.js via the API connector; same nav and storage.
- 2026-10-15 04:35 SGT — Plan uses cooked-weight staples/proteins; shopping list converts back to raw with estimated yield factors (rice 2.3, chicken 0.75).
