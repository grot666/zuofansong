import test from 'node:test';
import assert from 'node:assert/strict';
import { makeIndex } from '../js/core/foods.js';
import { FOODS } from '../data/foods.js'; import { FOODS2 } from '../data/foods2.js'; import { FOODS3 } from '../data/foods3.js';
import { RECIPES } from '../data/recipes.js';
import { leftovers } from '../js/core/plan.js';
const food = makeIndex(FOODS, FOODS2, FOODS3);
test('A79 colliding pack keys: same result in both key orders; own key wins, else largest', () => {
  const L = [{ id: 'egg', name: '鸡蛋', g: 420 }, { id: 'chickenThigh', name: '鸡腿', g: 280 }];
  const a = leftovers(L, { egg: 300, eggUSDA: 500, thighRoasted: 200, chickenThigh: undefined }, RECIPES, [], food);
  const b = leftovers(L, { eggUSDA: 500, egg: 300, thighRoasted: 200 }, RECIPES, [], food);
  assert.deepEqual(a, b); assert.equal(a.find(x => x.id === 'egg').left, 180);
  const c = leftovers(L, { eggUSDA: 500, eggBoiled: 600 }, RECIPES, [], food), d = leftovers(L, { eggBoiled: 600, eggUSDA: 500 }, RECIPES, [], food);
  assert.deepEqual(c, d); assert.equal(c.find(x => x.id === 'egg').left, 180);
});
