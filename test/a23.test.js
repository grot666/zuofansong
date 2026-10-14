import test from 'node:test';
import assert from 'node:assert/strict';
import { planWeek, shoppingList } from '../js/core/plan.js';
import { makeIndex, priceOverrides, priceOf } from '../js/core/foods.js';
import { FOODS } from '../data/foods.js';
import { FOODS2 } from '../data/foods2.js';
import { FOODS3 } from '../data/foods3.js';
import { PRICE_REFS } from '../data/prices.js';
import { RECIPES } from '../data/recipes.js';
const idx = prices => makeIndex({ base: [FOODS, FOODS2, FOODS3], partials: [PRICE_REFS, priceOverrides(prices)] });
const t = { kcal: 1800, protein: 140 };
const cost = prices => planWeek(t, idx(prices), RECIPES, { seed: 0 }).cost;
test('A23 cooked-id override is honoured by plan cost and budget', () => {
  const base = cost({});
  assert.ok(cost({ thighRoasted: 999 }) > base + 100);
  const r = planWeek(t, idx({ thighRoasted: 999 }), RECIPES, { seed: 0, budget: 300 });
  assert.ok(r.swaps > 0); assert.ok(!r.week.some(d => d.dinnerProtein === 'thighRoasted'));
  assert.ok(cost({ chickenThigh: 999 }) > base + 100); // raw override still works
});
test('A23 priceOf: cooked override → ×k raw equivalent; raw override beats ref', () => {
  assert.equal(priceOf(idx({ thighRoasted: 40 }), 'thighRoasted').rawPrice, 30);
  assert.equal(priceOf(idx({ egg: 7 }), 'egg').rawPrice, 7);
  assert.equal(priceOf(idx({}), 'egg').rawPrice, 5.89);
  const l = shoppingList([{ meals: [{ items: [['riceCooked', 230]] }] }], idx({ riceCooked: 2 }));
  assert.ok(Math.abs(l[0].cost - 100 * 2 * 2.3 / 500) < 1e-9);
});
import { foodIndexFromStore, totals } from '../js/core/foods.js';
import { readFileSync } from 'node:fs';
import * as S from '../js/core/store.js';
test('A24 precedence estimate < ref < user; custom + override; base with priceSource kept', () => {
  S.useBackend(S.memoryBackend); S.resetAll();
  S.set('customFoods', [{ id: 'c1', name: '自制', kcal: 100, protein: 10, fat: 1, carbs: 1, fiber: 0, priceCNYPer500g: 8, priceSource: '自己记的' }]);
  S.set('prices', { porkLoin: 20, c1: 9 });
  const f = foodIndexFromStore(S);
  assert.equal(f('rice').priceCNYPer500g, 2.81); // ref over estimate (R9-6)
  assert.equal(f('porkLoin').priceCNYPer500g, 20); // user over ref
  assert.equal(f('c1').priceCNYPer500g, 9); assert.equal(f('c1').name, '自制');
  S.set('prices', {}); assert.equal(foodIndexFromStore(S)('c1').priceCNYPer500g, 8);
});
test('A24 pages build the index only via foodIndexFromStore', () => {
  for (const p of ['js/ui.js', 'js/plan-page.js', 'js/review-page.js']) { const s = readFileSync(p, 'utf8'); assert.match(s, /foodIndexFromStore\(/); assert.doesNotMatch(s, /makeIndex\(/); }
});
test('A27 today cost of cooked rice equals plan shopping cost', () => {
  const f = idx({});
  const a = totals([['riceCooked', 230]], f).cost, b = shoppingList([{ meals: [{ items: [['riceCooked', 230]] }] }], f)[0].cost;
  assert.ok(Math.abs(a - b) < 0.05);
});
