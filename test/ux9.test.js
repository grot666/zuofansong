import test from 'node:test';
import assert from 'node:assert/strict';
import { regenWeek, planWeek } from '../js/core/plan.js';
import { makeIndex } from '../js/core/foods.js';
import { FOODS } from '../data/foods.js'; import { FOODS2 } from '../data/foods2.js'; import { FOODS3 } from '../data/foods3.js';
import { RECIPES } from '../data/recipes.js';
const food = makeIndex(FOODS, FOODS2, FOODS3); const t = { kcal: 1617, protein: 160 };
test('UX-9 regen then undo restores the exact week', () => {
  const before = planWeek(t, food, RECIPES, { seed: 3, budget: 300 });
  const r = regenWeek({ seed: 3 });
  assert.notDeepEqual(planWeek(t, food, RECIPES, { seed: r.seed, budget: 300 }).week, before.week);
  assert.deepEqual(planWeek(t, food, RECIPES, { seed: r.prevSeed, budget: 300 }), before);
});
