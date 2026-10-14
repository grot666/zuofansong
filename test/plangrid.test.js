import test from 'node:test';
import assert from 'node:assert/strict';
import { planWeek, FITS, SP_ID, SP_MAX_PER_WEEK, FIBER_SIDE } from '../js/core/plan.js';
import { makeIndex } from '../js/core/foods.js';
import { PRICE_REFS } from '../data/prices.js';
import { FOODS } from '../data/foods.js'; import { FOODS2 } from '../data/foods2.js'; import { FOODS3 } from '../data/foods3.js';
import { RECIPES } from '../data/recipes.js';
// A44d: arch-review grid invariants (determinism, lunch/dinner pairing, no silent non-ok day).
const food = makeIndex({ base: [FOODS, FOODS2, FOODS3], partials: [PRICE_REFS] });
const T = [[1400, 110], [1617, 160], [1800, 140], [2000, 100], [2200, 160]].map(([kcal, protein]) => ({ kcal, protein }));
// A58/A62: invariants per week — pairing, fit flags, 2-day batch, SP cap (incl. every budget), spCap ⇒ not SP, no staple 3 days running, fiberSide ⇒ peas side in lunch+dinner.
const inv = (r, L) => {
  r.week.forEach((d, i) => { const lunch = r.week[(i + 1) % 7].meals[1].items[1][0]; assert.equal(lunch, d.dinnerProtein, `pair ${L} ${i}`); assert.ok(FITS.includes(d.fit)); });
  if (r.week.some(d => d.fit !== 'ok')) assert.ok(r.overBudget || r.infeasible || r.unfit.length, `silent non-ok ${L}`);
  const s = r.week.map(d => d.staple);
  for (let k = 0; k < 3; k++) assert.equal(s[2 * k], s[2 * k + 1], `A55 batch ${L} ${k}`);
  for (let i = 2; i < 7; i++) assert.ok(!(s[i] === s[i - 1] && s[i] === s[i - 2]), `R11-2 run ${L} ${i}`);
  assert.ok(s.filter(x => x === SP_ID).length <= SP_MAX_PER_WEEK, `SP cap ${L}`);
  for (const d of r.week) {
    if (d.spCap) assert.notEqual(d.staple, SP_ID, `spCap ${L}`);
    if (d.fiberSide) for (const m of d.meals.slice(1, 3)) assert.ok(FIBER_SIDE.every(([id, g]) => m.items.some(([x, y]) => x === id && y === g)), `fiberSide ${L} ${d.day}`);
  }
};
test('A44d/A58/A62 plan grid invariants (rotate: all seeds; oats breakfast: seeds 0–2) — determinism in plangrid-det.test.js', () => {
  const t0 = performance.now();
  for (const t of T) for (let seed = 0; seed < 6; seed++) for (const breakfast of seed < 3 ? ['rotate', 'oats'] : ['rotate']) {
    const free = planWeek(t, food, RECIPES, { seed, breakfast }).cost;
    for (const f of [null, 1, 0.9, 0.8, 0.7, 0.5]) inv(planWeek(t, food, RECIPES, { seed, breakfast, budget: f == null ? undefined : f * free }), `${t.kcal}/${t.protein} s${seed} ${breakfast} ${f}`);
  }
  const ms = performance.now() - t0; console.log('plangrid ms', ms.toFixed(0)); assert.ok(ms < 4000, String(ms)); // ≤4 s guard (DECISIONS)
});
