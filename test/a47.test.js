import test from 'node:test';
import assert from 'node:assert/strict';
import { planWeek, PROTEINS } from '../js/core/plan.js';
import { makeIndex } from '../js/core/foods.js';
import { FOODS } from '../data/foods.js'; import { FOODS2 } from '../data/foods2.js'; import { FOODS3 } from '../data/foods3.js';
import { RECIPES } from '../data/recipes.js';
const food = makeIndex(FOODS, FOODS2, FOODS3); const t = { kcal: 1800, protein: 140 };
test('A47 no usable protein → infeasible no-protein, never throws', () => {
  const t0 = performance.now(); const r = planWeek(t, food, RECIPES, { seed: 0, proteins: [] });
  assert.ok(performance.now() - t0 < 50); assert.equal(r.infeasible.reason, 'no-protein'); assert.equal(r.week.length, 7);
  assert.ok(r.week.every(d => d.fit === 'protein-low' && d.dinnerProtein === null));
  const drop = new Set(PROTEINS); const f2 = id => (drop.has(id) ? undefined : food(id)); f2.all = food.all;
  const r2 = planWeek(t, f2, RECIPES, { seed: 0, budget: 50 }); assert.equal(r2.infeasible.reason, 'no-protein');
  assert.equal(planWeek(t, food, [], { seed: 0, proteins: [] }).infeasible.reason, 'no-protein');
});
