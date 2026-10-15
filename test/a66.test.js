import test from 'node:test';
import assert from 'node:assert/strict';
import { makeIndex } from '../js/core/foods.js';
import { FOODS } from '../data/foods.js'; import { FOODS2 } from '../data/foods2.js'; import { FOODS3 } from '../data/foods3.js';
import { STORES } from '../data/storage.js';
import { shoppingList, isPerishable, storeOf } from '../js/core/plan.js';
const food = makeIndex(FOODS, FOODS2, FOODS3);
const all = [...FOODS, ...FOODS2, ...FOODS3];
test('A66 every non-外食/饮品 food has a store class from the closed set', () => {
  assert.deepEqual(all.filter(f => !['外食', '饮品'].includes(f.cat) && !STORES.includes(f.store)).map(f => f.id), []);
  const is = (s, ids) => ids.split(' ').forEach(id => assert.equal(food(id).store, s, id));
  is('fresh', 'lettuce kelp enoki shiitake mushroom'); is('frozen', 'basa sole frozenVeg peas edamame');
  is('pantry', 'tunaLight rice oats'); is('keeps', 'cabbage napa carrot sweetPotato winterMelon');
  assert.equal(storeOf({ id: 'custom1' }), 'keeps');
  for (const [a, c] of [['eggUSDA', 'egg'], ['broccoliUSDA', 'broccoli']]) assert.equal(food(a).store, food(c).store);
});
test('A66 trip 2: lettuce on day 5 → g2 > 0; chickenBreast on day 5 → g2 = 0', () => {
  const days = [0, 1, 2, 3, 4, 5, 6].map(day => ({ day, meals: [{ name: '午餐', items: day === 5 ? [['lettuce', 200], ['chickenBreast', 150]] : [] }] }));
  const L = shoppingList(days, food);
  assert.ok(L.find(x => x.id === 'lettuce').g2 > 0); assert.equal(L.find(x => x.id === 'chickenBreast').g2, 0);
  assert.ok(isPerishable(food('kelp')) && !isPerishable(food('tofuFirm')));
});
