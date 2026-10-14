import test from 'node:test';
import assert from 'node:assert/strict';
import { planWeek } from '../js/core/plan.js';
import { makeIndex } from '../js/core/foods.js';
import { computeTargets } from '../js/core/targets.js';
import { normalizeProfile } from '../js/core/profile.js';
import { FOODS } from '../data/foods.js'; import { FOODS2 } from '../data/foods2.js'; import { FOODS3 } from '../data/foods3.js';
import { RECIPES } from '../data/recipes.js';
const food = makeIndex(FOODS, FOODS2, FOODS3);
test('A32/A43 planWeek median of 7 < 25 ms (default profile, 3 scoops, tight budget)', () => {
  const t = computeTargets(normalizeProfile({}));
  for (let i = 0; i < 3; i++) planWeek(t, food, RECIPES, { seed: 10 + i, budget: 150, powderScoops: 3 }); // JIT warm-up (steady-state timing)
  const ms = [];
  for (let i = 0; i < 7; i++) { const t0 = performance.now(); planWeek(t, food, RECIPES, { seed: i, budget: 150, powderScoops: 3 }); ms.push(performance.now() - t0); }
  ms.sort((a, b) => a - b); console.log('planWeek ms', ms.map(x => x.toFixed(1)).join(' '));
  assert.ok(ms[3] < 25, `median ${ms[3]}`);
});
test('A43 grid p95 < 40 ms over 30 mixed runs (budgets incl. 0.5×)', () => {
  const T = [{ kcal: 1400, protein: 110 }, { kcal: 1800, protein: 140 }, { kcal: 2200, protein: 160 }]; const ms = [];
  for (let i = 0; i < 30; i++) {
    const t = T[i % 3], seed = i % 6, f = [null, 1, 0.9, 0.7, 0.5][i % 5];
    const free = f == null ? null : planWeek(t, food, RECIPES, { seed }).cost;
    const t0 = performance.now(); planWeek(t, food, RECIPES, { seed, budget: free == null ? undefined : f * free }); ms.push(performance.now() - t0);
  }
  ms.sort((a, b) => a - b); const p95 = ms[Math.ceil(0.95 * ms.length) - 1]; console.log('grid p95 ms', p95.toFixed(1), 'max', ms.at(-1).toFixed(1));
  assert.ok(p95 < 40, `p95 ${p95}`);
});
