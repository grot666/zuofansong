import test from 'node:test';
import assert from 'node:assert/strict';
import { selectWeek, planWeek, generateWeek, distinctVeg } from '../js/core/plan.js';
import { makeIndex } from '../js/core/foods.js';
import { FOODS } from '../data/foods.js'; import { FOODS2 } from '../data/foods2.js'; import { FOODS3 } from '../data/foods3.js';
import { RECIPES } from '../data/recipes.js';
const food = makeIndex(FOODS, FOODS2, FOODS3);
const ids = s => selectWeek(food, RECIPES, { seed: s }).flatMap(d => [d.vegL.id, d.vegD.id]);
test('A44a veg-reuse snapshot seeds 0 and 1', () => {
  assert.deepEqual(ids(0), ['r16', 'r5', 'r7', 'r19', 'r23', 'r26', 'r31', 'r32', 'r15', 'r3', 'r27', 'r10', 'r14', 'r18']);
  assert.deepEqual(ids(1), ['r10', 'r22', 'r25', 'r28', 'r13', 'r17', 'r29', 'r1', 'r4', 'r6', 'r21', 'r12', 'r9', 'r11']);
});
test('A44b reuse never adds more distinct vegetables than reuse:false (seeds 0–5)', () => {
  const t = { kcal: 1800, protein: 140 };
  for (let seed = 0; seed < 6; seed++) assert.ok(distinctVeg(generateWeek(t, food, RECIPES, { seed }), food) <= distinctVeg(generateWeek(t, food, RECIPES, { seed, reuse: false }), food), String(seed));
});
test('A44c budget revert lowers an overshooting greedy week (1617/160 seed 0 @0.5×free)', () => {
  const t = { kcal: 1617, protein: 160 }; const free = planWeek(t, food, RECIPES, { seed: 0 }).cost;
  const a = planWeek(t, food, RECIPES, { seed: 0, budget: 0.5 * free }), b = planWeek(t, food, RECIPES, { seed: 0, budget: 0.5 * free, revert: false });
  assert.ok(a.cost < b.cost - 1, `${a.cost} vs ${b.cost}`); assert.ok(a.swaps >= 0 && a.swaps === b.swaps - 1);
});
