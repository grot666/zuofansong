import test from 'node:test';
import assert from 'node:assert/strict';
import { generateWeek, shoppingList, checkWeek } from '../js/core/plan.js';
import { FOODS } from '../data/foods.js';
import { FOODS2 } from '../data/foods2.js';
import { RECIPES } from '../data/recipes.js';

const all = [...FOODS, ...FOODS2];
const food = id => all.find(f => f.id === id);
const T = { kcal: 1800, protein: 140 };

test('week has 7 days within kcal ±5% and protein >= target', () => {
  const w = generateWeek(T, food, RECIPES);
  assert.equal(w.length, 7);
  for (const c of checkWeek(w, T)) { assert.ok(c.kcalOk, 'kcal day ' + c.day); assert.ok(c.proteinOk, 'protein day ' + c.day); }
});
test('shopping list converts cooked rice to raw', () => {
  const w = generateWeek(T, food, RECIPES);
  const list = shoppingList(w, food);
  assert.ok(!list.find(x => x.id === 'riceCooked'));
  assert.ok(list.every(x => x.g > 0));
});
