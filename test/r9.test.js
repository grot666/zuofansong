import test from 'node:test';
import assert from 'node:assert/strict';
import { generateWeek } from '../js/core/plan.js';
import { makeIndex } from '../js/core/foods.js';
import { FOODS } from '../data/foods.js'; import { FOODS2 } from '../data/foods2.js'; import { FOODS3 } from '../data/foods3.js';
import { RECIPES } from '../data/recipes.js';
const food = makeIndex(FOODS, FOODS2, FOODS3);
test('R9-2 plan snack uses verified kiwiUSDA', () => {
  let seen = false;
  for (let seed = 0; seed < 9; seed++) for (const d of generateWeek({ kcal: 1800, protein: 140 }, food, RECIPES, { seed })) {
    const ids = d.meals.flatMap(m => m.items.map(([id]) => id));
    assert.ok(!ids.includes('kiwi')); if (d.kiwiG > 0) { assert.ok(ids.includes('kiwiUSDA')); seen = true; }
  }
  assert.ok(seen);
});
test('R9-3 eggWhite = FDC 172183', () => {
  const e = food('eggWhite');
  assert.deepEqual([e.kcal, e.protein, e.fat, e.carbs, e.fiber, e.source, e.verified], [52, 10.9, 0.17, 0.73, 0, 'USDA FDC 172183', true]);
});
