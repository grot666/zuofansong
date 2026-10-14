import test from 'node:test';
import assert from 'node:assert/strict';
import { applyBudget } from '../js/core/plan.js';
const price = { A: 50, B: 20, C: 30 };
test('budget swap prefers best-scoring candidate that fits budget, else cheapest', () => {
  const base = { slots: ['A', 'A'], options: ['A', 'B', 'C'], slotCost: id => price[id] };
  assert.deepEqual(applyBudget({ ...base, budget: 80 }).slots, ['B', 'A']); // no score: cheapest
  assert.deepEqual(applyBudget({ ...base, budget: 80, score: id => ({ A: 1, B: 1, C: 5 })[id] }).slots, ['C', 'A']); // C fits (80) and scores higher
  assert.deepEqual(applyBudget({ ...base, budget: 65, score: id => ({ A: 1, B: 1, C: 5 })[id] }).slots, ['B', 'C']); // first swap can't fit → cheapest; second fits → best score
});
import { planWeek, proteinScore } from '../js/core/plan.js';
import { makeIndex, foodIndexFromStore } from '../js/core/foods.js';
import { FOODS } from '../data/foods.js'; import { FOODS2 } from '../data/foods2.js'; import { FOODS3 } from '../data/foods3.js';
import { RECIPES } from '../data/recipes.js';
const food = makeIndex(FOODS, FOODS2, FOODS3); const t = { kcal: 1800, protein: 140 };
const free = planWeek(t, food, RECIPES, { seed: 0 }).cost;
test('A35a real-data fixture 1800/140 seed 0 @0.85×free (pinned)', () => {
  const r = planWeek(t, food, RECIPES, { seed: 0, budget: 0.85 * free });
  assert.deepEqual(r.week.map(d => d.dinnerProtein), ['thighRoasted', 'breastRoasted', 'tofuFirm', 'tofuFirm', 'tofuFirm', 'breastRoasted', 'basa']);
  assert.equal(r.swaps, 3); assert.ok(Math.abs(r.cost - 183.00) <= 0.05, String(r.cost)); // re-pinned v0.10.37 (VER-15 FDC data)
});
test('A35b tie-break: equal scores → cheaper first, then options order', () => {
  const price = { A: 50, B: 20, C: 20, D: 30 };
  const r = applyBudget({ slots: ['A'], options: ['D', 'C', 'B'], slotCost: id => price[id], budget: 40, score: () => 1 });
  assert.deepEqual(r.slots, ['C']); // C and B both ¥20; C listed first among equals (stable sort)
});
test('A35c score only on a swap that alone reaches budget', () => {
  const price = { A: 50, B: 10, C: 40 }; const score = id => ({ A: 0, B: 0, C: 9 })[id];
  // budget 70 with 2 slots of A (100): no single swap reaches 70 except A→B (60); C (90) cannot → cheapest B chosen.
  assert.deepEqual(applyBudget({ slots: ['A', 'A'], options: ['B', 'C'], slotCost: id => price[id], budget: 70, score }).slots, ['B', 'A']);
});
test('A35d near-monotonic: cost never rises by more than ¥0.5 as the budget falls (greedy; see DECISIONS)', () => {
  let prev = Infinity;
  for (const f of [1, 0.95, 0.9, 0.85, 0.8, 0.7, 0.6]) { const c = planWeek(t, food, RECIPES, { seed: 0, budget: f * free }).cost; assert.ok(c <= prev + 0.5, `${f}`); prev = c; }
});
test('A35e a price override moves proteinScore (price → cheap coupling)', () => {
  const S = { get: (k, d) => (k === 'prices' ? { seabass: 200 } : d) };
  assert.ok(proteinScore('seabass', foodIndexFromStore(S)) < proteinScore('seabass', food));
});
