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
