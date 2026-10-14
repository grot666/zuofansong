import test from 'node:test';
import assert from 'node:assert/strict';
import { planWeek, FITS } from '../js/core/plan.js';
import { makeIndex } from '../js/core/foods.js';
import { PRICE_REFS } from '../data/prices.js';
import { FOODS } from '../data/foods.js'; import { FOODS2 } from '../data/foods2.js'; import { FOODS3 } from '../data/foods3.js';
import { RECIPES } from '../data/recipes.js';
// A51: full-grid determinism (split from A44d so each file stays under the CI time guard) (determinism, lunch/dinner pairing, no silent non-ok day).
const food = makeIndex({ base: [FOODS, FOODS2, FOODS3], partials: [PRICE_REFS] });
const T = [[1400, 110], [1617, 160], [1800, 140], [2000, 100], [2200, 160]].map(([kcal, protein]) => ({ kcal, protein }));
function run(half) {
  const t0 = performance.now();
  for (const t of T) for (let seed = half; seed < 6; seed += 2) {
    const free = planWeek(t, food, RECIPES, { seed }).cost;
    for (const f of [null, 1, 0.9, 0.8, 0.7, 0.5]) {
      const o = { seed, budget: f == null ? undefined : f * free }; const r = planWeek(t, food, RECIPES, o);
      assert.deepEqual(planWeek(t, food, RECIPES, o), r); // A51: every cell
    }
  }
  const ms = performance.now() - t0; console.log('plangrid-det ms', ms.toFixed(0)); assert.ok(ms < 4000, String(ms)); // AC ≤2 s locally; 4 s guard for slower CI runners (DECISIONS)
}
test('A51 plan grid determinism, even seeds', () => run(0));
test('A51 plan grid determinism, odd seeds', () => run(1));
