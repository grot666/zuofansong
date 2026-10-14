import test from 'node:test';
import assert from 'node:assert/strict';
import { selectWeek, parseBudget, distinctVeg, generateWeek } from '../js/core/plan.js';
import { makeIndex } from '../js/core/foods.js';
import { FOODS } from '../data/foods.js'; import { FOODS2 } from '../data/foods2.js'; import { FOODS3 } from '../data/foods3.js';
import { RECIPES } from '../data/recipes.js';
const food = makeIndex(FOODS, FOODS2, FOODS3);
test('R9-10 maxPrepMin=5 picks only recipes ≤5 min', () => {
  for (let seed = 0; seed < 4; seed++) for (const d of selectWeek(food, RECIPES, { seed, maxPrepMin: 5 })) assert.ok(d.vegL.min <= 5 && d.vegD.min <= 5);
});
test('R9-10 budget validation', () => {
  for (const v of ['', ' ', '0', '-5', 'abc']) assert.equal(parseBudget(v).ok, false, v);
  assert.deepEqual(parseBudget('250'), { ok: true, value: 250 });
});
test('R9-10 reuse metric', () => {
  const n = distinctVeg(generateWeek({ kcal: 1800, protein: 140 }, food, RECIPES, { seed: 0 }), food);
  assert.ok(n > 0 && n <= 28);
});
