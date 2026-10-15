import test from 'node:test';
import assert from 'node:assert/strict';
import { shoppingList, planWeek, TRIP2_FROM } from '../js/core/plan.js';
import { makeIndex } from '../js/core/foods.js';
import { FOODS } from '../data/foods.js'; import { FOODS2 } from '../data/foods2.js'; import { FOODS3 } from '../data/foods3.js';
import { RECIPES } from '../data/recipes.js';
const food = makeIndex(FOODS, FOODS2, FOODS3);
const day = (d, items) => ({ day: d, meals: [{ name: '晚餐', items }] });
test('R11-3 fixture: seabass on day 5 → trip 2; frozen basa trip 1; tuna/rice always trip 1', () => {
  const L = shoppingList([day(0, [['riceCooked', 230], ['basa', 200], ['tunaLight', 100]]), day(5, [['seabass', 200], ['basa', 100], ['shanghaiQing', 150]])], food);
  const by = id => L.find(x => x.id === id);
  assert.equal(TRIP2_FROM, 4);
  assert.deepEqual([by('seabass').g1, by('seabass').g2], [0, 200]);
  assert.equal(by('basa').g2, 0); assert.ok(by('basa').frozen);
  assert.equal(by('shanghaiQing').g2, 150);
  assert.equal(by('tunaLight').g2, 0); assert.equal(by('rice').g2, 0);
});
test('R11-3 total grams across trips = list grams (1800/140 seeds 0–5)', () => {
  for (let seed = 0; seed < 6; seed++) for (const x of shoppingList(planWeek({ kcal: 1800, protein: 140 }, food, RECIPES, { seed }).week, food)) {
    assert.equal(x.g1 + x.g2, x.g, x.id); assert.ok(x.g2 === 0 || x.perishable, x.id);
  }
});
