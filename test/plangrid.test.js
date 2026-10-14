import test from 'node:test';
import assert from 'node:assert/strict';
import { planWeek, FITS } from '../js/core/plan.js';
import { makeIndex } from '../js/core/foods.js';
import { PRICE_REFS } from '../data/prices.js';
import { FOODS } from '../data/foods.js'; import { FOODS2 } from '../data/foods2.js'; import { FOODS3 } from '../data/foods3.js';
import { RECIPES } from '../data/recipes.js';
// A44d: arch-review grid invariants (determinism, lunch/dinner pairing, no silent non-ok day).
const food = makeIndex({ base: [FOODS, FOODS2, FOODS3], partials: [PRICE_REFS] });
const T = [[1400, 110], [1617, 160], [1800, 140], [2000, 100], [2200, 160]].map(([kcal, protein]) => ({ kcal, protein }));
test('A44d plan grid: paired, every non-ok day is flagged (determinism: plangrid-det.test.js)', () => {
  const t0 = performance.now();
  for (const t of T) for (let seed = 0; seed < 6; seed++) {
    const free = planWeek(t, food, RECIPES, { seed }).cost;
    for (const f of [null, 1, 0.9, 0.8, 0.7, 0.5]) {
      const o = { seed, budget: f == null ? undefined : f * free }; const r = planWeek(t, food, RECIPES, o);
      r.week.forEach((d, i) => { const lunch = r.week[(i + 1) % 7].meals[1].items[1][0]; assert.equal(lunch, d.dinnerProtein, `pair ${seed} ${i}`); assert.ok(FITS.includes(d.fit)); });
      if (r.week.some(d => d.fit !== 'ok')) assert.ok(r.overBudget || r.infeasible || r.unfit.length, `silent non-ok ${JSON.stringify(t)} ${seed} ${f}`);
    }
  }
  const ms = performance.now() - t0; console.log('plangrid ms', ms.toFixed(0)); assert.ok(ms < 4000, String(ms)); // AC ≤2 s locally; 4 s guard for slower CI runners (DECISIONS)
});
