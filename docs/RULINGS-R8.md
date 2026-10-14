# Rulings R8 — addendum (2026-10-15 ~05:45 SGT)
Supplements BACKLOG § “Rulings R8” (commit ce83f23). Where this file and BACKLOG differ, **this file wins**.

## N-04 — tiebreak, stated explicitly
Shipped (fiber.js @2ecd053): sort = **replacements first** (`replace:true` before adds), then score `fiberGain / max(kcalDelta, 20)` desc.
Recomputed with corrected brown200 (+2.4 g, −14 kcal → score 2.4/20 = 0.120) and sweetpot (+4.4 g, −60 → 4.4/20 = 0.220). Both replacements already score above every add (best add = spinach200 0.0957), so on current data the pre-sort **does not change the order**: sweetpot, brownhalf, spinach200, broc200, peas100, kiwi2, mushroom150, oats40.
**Ruling:**
1. Primary key: score desc. **No replacements-first pre-sort** (remove it; it would wrongly lift a future low-value replacement above a better add).
2. Tiebreak 1: lower kcalDelta first. Tiebreak 2: `id` ascending (deterministic).
3. Filters before sorting: fiberGain ≥ 3 g; kcalDelta ≤ kcalTarget×1.05 − kcal; replace swaps only if `riceG` ≥ 150 (sweetpot) / 200 (brownhalf); max one rice-replacement in the output.
4. Take top n = 3; if gutHigh append `water` as item 4. fiber ≥ fiberTarget → [].

Rewritten AC (N-04): `suggestFiber({fiber, fiberTarget=28, kcal, kcalTarget, riceG=0, gutHigh=false}, n=3)` returns ids in exactly this order:
| # | fiber | kcal | kcalTarget | room | riceG | gutHigh | expected |
|---|---|---|---|---|---|---|---|
| F1 | 15 | 1782 | 1800 | 108 | 400 | no | sweetpot, spinach200, broc200 |
| F2 | 10 | 1200 | 1800 | 690 | 0 | no | spinach200, broc200, peas100 |
| F3 | 12 | 1880 | 1800 | 10 | 200 | no | sweetpot |
| F4 | 12 | 1880 | 1800 | 10 | 0 | no | (empty) |
| F5 | 15 | 1500 | 1800 | 390 | 160 | no | sweetpot, spinach200, broc200 |
| F6 | 15 | 1830 | 1800 | 60 | 0 | no | spinach200 |
| F7 | 28 | 1500 | 1800 | — | 400 | no | (empty) |
| F8 | 10 | 1200 | 1800 | 690 | 0 | yes | spinach200, broc200, peas100, water |
Check F2: spinach 0.0957 > broc 0.0943 > peas 0.0704 > kiwi 0.0489 (oats 0.0269; mushroom excluded <3 g). F6: only spinach (46) ≤ 60.

## R-10 — P5 fixture (replaces the garbled P5 line in BACKLOG)
- P5a: A has 7 daily entries, B has 2 (total 9) → `{plateau:false, reason:'sparse'}`.
- P5b: A 7 entries at 70.25, B 3 entries at 70.1875 (total 10) → `{plateau:true, reason:'flat'}`.
- P5c: A 2 entries, B 7 entries + 1 extra on 10-15? (one entry per date) → A 2 / B 7 = 9 → sparse; A 3 / B 7 = 10 flat → plateau true.
