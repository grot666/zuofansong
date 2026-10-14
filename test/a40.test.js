import test from 'node:test';
import assert from 'node:assert/strict';
import { pickReuse, selectWeek, planWeek } from '../js/core/plan.js';
import { makeIndex } from '../js/core/foods.js';
import { FOODS } from '../data/foods.js'; import { FOODS2 } from '../data/foods2.js'; import { FOODS3 } from '../data/foods3.js';
import { RECIPES } from '../data/recipes.js';
const food = makeIndex(FOODS, FOODS2, FOODS3); const t = { kcal: 1800, protein: 140 };
test('A40 no usable veg: no hang, null veg, infeasible no-veg', () => {
  const t0 = performance.now(); assert.deepEqual(pickReuse([], 0, food), []); assert.ok(performance.now() - t0 < 50);
  const w = selectWeek(food, [], { seed: 0 }); assert.ok(w.every(d => d.vegL === null && d.vegD === null));
  const r = planWeek(t, food, [], { seed: 0 }); assert.equal(r.infeasible.reason, 'no-veg'); assert.equal(r.week.length, 7);
  assert.equal(planWeek(t, food, [], { seed: 0, budget: 50 }).infeasible.reason, 'no-veg');
});
test('A40 one recipe → 14 picks of the same id', () => {
  const ids = selectWeek(food, [RECIPES[0]], { seed: 0 }).flatMap(d => [d.vegL.id, d.vegD.id]);
  assert.equal(ids.length, 14); assert.deepEqual([...new Set(ids)], [RECIPES[0].id]);
});
