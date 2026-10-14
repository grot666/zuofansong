# BACKLOG (top = next)

1. **Enable GitHub Pages** (main, /): `gh api -X POST repos/grot666/zuofansong/pages -f 'source[branch]=main' -f 'source[path]=/'` — needs shell.
2. Run `node --test test/` and `node --check` on all JS; headless smoke test of index.html#{today,plate,veg,rice,foods,me} and plan.html; fix bugs.
3. Version string: app.js VERSION still 0.2.0 while plan page is 0.3.0 — bump + changelog entry in-app.
4. Expand foods to ≥120 (Shanghai takeaway/便利店: 面条, 馄饨, 食堂套餐, 饭团, 关东煮); price override per food.
5. Tuna weekly counter (light ≤3×113 g, albacore ≤1×113 g; R3.3).
6. Dinner-time nudge: bedtime setting, dinner ≥ 2–3 h before bed; caffeine cut-off (R1.4/R3.5).
7. Plateau logic: 7-day avg flat ≥2–3 weeks → −100–150 kcal or diet-break (R3.6).
8. Saved meal templates; 3-tap logging; “没关系，继续” recovery after over-target day.
9. Weekly review (adherence, avg macros, fiber, cost).
10. Fix recipe r24 name (蒸南瓜山药 uses carrot, not pumpkin) and r9 (虾皮 not in ingredients).
