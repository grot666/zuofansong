import test from 'node:test';
import assert from 'node:assert/strict';
import { planWeek, shoppingList, listLines } from '../js/core/plan.js';
import { makeIndex } from '../js/core/foods.js';
import { PRICE_REFS } from '../data/prices.js';
import { FOODS } from '../data/foods.js'; import { FOODS2 } from '../data/foods2.js'; import { FOODS3 } from '../data/foods3.js';
import { RECIPES } from '../data/recipes.js';
const food = makeIndex({ base: [FOODS, FOODS2, FOODS3], partials: [PRICE_REFS] });
test('R10-S1 shopping list: twins merged, condiments in 常备, small flagged, ≤32 lines', () => {
  const week = planWeek({ kcal: 1800, protein: 145 }, food, RECIPES, { seed: 0 }).week; const l = shoppingList(week, food);
  const names = l.map(x => x.name); assert.equal(new Set(names).size, names.length);
  assert.ok(!l.some(x => /USDA$/.test(x.id) && food(x.id.replace(/USDA$/, ''))), 'twin merged');
  for (const id of ['soy', 'oil']) { const x = l.find(y => y.id === id); if (x) assert.ok(x.pantry, id); }
  for (const x of l) if (!x.pantry) assert.equal(x.small, x.g < 50, x.id);
  assert.ok(listLines(l) <= 32, String(listLines(l)));
  const fixture = [{ meals: [{ items: [['broccoli', 100], ['broccoliUSDA', 100], ['soy', 5]] }] }];
  const f = shoppingList(fixture, food); assert.equal(f.find(x => x.id === 'broccoli').g, 200); assert.equal(listLines(f), 2); // broccoli + 常备
});
