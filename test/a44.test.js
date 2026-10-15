import test from 'node:test';
import assert from 'node:assert/strict';
import { selectWeek, planWeek, generateWeek, distinctVeg, BREAKFASTS } from '../js/core/plan.js';
import { makeIndex } from '../js/core/foods.js';
import { FOODS } from '../data/foods.js'; import { FOODS2 } from '../data/foods2.js'; import { FOODS3 } from '../data/foods3.js';
import { RECIPES } from '../data/recipes.js';
const food = makeIndex(FOODS, FOODS2, FOODS3);
const ids = s => selectWeek(food, RECIPES, { seed: s }).flatMap(d => [d.vegL.id, d.vegD.id]);
test('A44a veg-reuse snapshot seeds 0 and 1', () => {
  assert.deepEqual(ids(0), ['r16', 'r5', 'r7', 'r19', 'r23', 'r25', 'r26', 'r31', 'r32', 'r15', 'r3', 'r27', 'r14', 'r9']);
  assert.deepEqual(ids(1), ['r3', 'r9', 'r10', 'r8', 'r11', 'r13', 'r17', 'r22', 'r28', 'r29', 'r34', 'r1', 'r4', 'r6']);
});
test('A44b reuse never adds more distinct vegetables than reuse:false (seeds 0–5)', () => {
  const t = { kcal: 1800, protein: 140 };
  for (let seed = 0; seed < 6; seed++) assert.ok(distinctVeg(generateWeek(t, food, RECIPES, { seed }), food) <= distinctVeg(generateWeek(t, food, RECIPES, { seed, reuse: false }), food), String(seed));
});
test('A44c budget revert lowers an overshooting greedy week (1800/140 seed 2 @0.5×free; re-pinned v0.10.60 R14-1)', () => {
  const t = { kcal: 1800, protein: 140 }; const free = planWeek(t, food, RECIPES, { seed: 2 }).cost;
  const a = planWeek(t, food, RECIPES, { seed: 2, budget: 0.5 * free }), b = planWeek(t, food, RECIPES, { seed: 2, budget: 0.5 * free, revert: false });
  assert.ok(a.cost < b.cost - 1, `${a.cost} vs ${b.cost}`); assert.ok(a.swaps >= 0 && a.swaps === b.swaps - 1);
});
// A58/A62: per-day staple : fiberSide : breakfast index snapshot at 1800/140 (seeds 0, 1 rotate; seed 0 oats).
test('A58/A62 snapshot: staple, fiberSide, breakfast per day', () => {
  const t = { kcal: 1800, protein: 140 };
  const snap = o => planWeek(t, food, RECIPES, o).week.map(d => [d.staple, d.fiberSide ? 1 : 0, BREAKFASTS.findIndex(x => x.name === d.meals[0].title.split(' ×')[0])].join(':'));
  assert.deepEqual(snap({ seed: 0 }), ['riceCooked:0:0', 'riceCooked:1:1', 'brownRiceCooked:0:2', 'brownRiceCooked:0:0', 'milletCooked:0:1', 'milletCooked:0:2', 'sweetPotatoBaked:0:0']);
  assert.deepEqual(snap({ seed: 1 }), ['brownRiceCooked:0:1', 'brownRiceCooked:1:2', 'milletCooked:0:0', 'milletCooked:0:1', 'sweetPotatoBaked:0:2', 'sweetPotatoBaked:0:0', 'riceCooked:1:1']);
  assert.deepEqual(snap({ seed: 0, breakfast: 'oats' }), ['riceCooked:0:0', 'riceCooked:1:0', 'brownRiceCooked:0:0', 'brownRiceCooked:0:0', 'milletCooked:0:0', 'milletCooked:0:0', 'sweetPotatoBaked:0:0']);
});
