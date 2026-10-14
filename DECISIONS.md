# DECISIONS

- 2026-10-15 04:00 SGT — App name 做饭松 (owner's mission) instead of 粗粮减脂厨房; storage prefix kept `culiang.v1.*` per PROMPT.
- 2026-10-15 04:00 SGT — Defaults from owner plan: male, 173.5 cm, born 1997-07-31, 74 kg, goal 58 kg by 2027-07-31, sedentary desk job.
- 2026-10-15 04:00 SGT — Box shell was unavailable (still starting); shipped via GitHub API connector without local tests.
- 2026-10-15 04:00 SGT — Foods data as JS module (data/foods.js) rather than JSON fetch, so it works offline/no fetch and in node tests.
