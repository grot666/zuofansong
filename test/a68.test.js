import test from 'node:test';
import assert from 'node:assert/strict';
import { makeIndex, shopId } from '../js/core/foods.js';
import { FOODS } from '../data/foods.js'; import { FOODS2 } from '../data/foods2.js'; import { FOODS3 } from '../data/foods3.js';
import { RECIPES } from '../data/recipes.js';
import { leftovers, weekRecipeIds, planWeek, shoppingList } from '../js/core/plan.js';
const food = makeIndex(FOODS, FOODS2, FOODS3);
test('A68 shopId maps cooked/twin ids to the list id', () => {
  assert.equal(shopId('thighRoasted', food), 'chickenThigh'); assert.equal(shopId('eggUSDA', food), 'egg'); assert.equal(shopId('riceCooked', food), 'rice');
});
test('A68 multi-pack, pantry skipped, cooked-id pack key, small leftovers hidden', () => {
  const L = [{ id: 'chickenBreast', name: '鸡胸肉', g: 367 }, { id: 'rice', name: '大米', g: 165, pantry: true }, { id: 'chickenThigh', name: '鸡腿', g: 280 }, { id: 'qianzhang', name: '千张', g: 220 }];
  const r = leftovers(L, { chickenBreast: 300, rice: 5000, thighRoasted: 300, qianzhang: 250 }, RECIPES, [], food);
  assert.deepEqual(r.map(x => [x.id, x.left]), [['chickenBreast', 233]]);
});
test('A68 weekRecipeIds finds the week veg recipes', () => {
  const week = planWeek({ kcal: 1800, protein: 140 }, food, RECIPES, { seed: 0 }).week;
  const ids = weekRecipeIds(week, RECIPES); assert.ok(ids.length >= 2);
  assert.ok(shoppingList(week, food).length > 0);
});
