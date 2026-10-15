import test from 'node:test';
import assert from 'node:assert/strict';
import { leftovers, shoppingList, FIBER_MIN } from '../js/core/plan.js';
import { KNOWN_KEYS } from '../js/core/store.js';
import { makeIndex } from '../js/core/foods.js';
import { FOODS } from '../data/foods.js'; import { FOODS2 } from '../data/foods2.js'; import { FOODS3 } from '../data/foods3.js';
import { RECIPES } from '../data/recipes.js';
const food = makeIndex(FOODS, FOODS2, FOODS3);
const L = shoppingList([{ day: 0, meals: [{ name: '午餐', items: [['qianzhang', 50], ['celery', 250]] }] }], food);
test('R11-4 pack 千张 250 g, need 50 → leftover 200 g with a recipe that uses 千张', () => {
  const r = leftovers(L, { qianzhang: 250 }, RECIPES);
  assert.equal(r.length, 1); assert.equal(r[0].left, 200);
  assert.ok(RECIPES.find(x => x.id === r[0].recipeId).items.some(([id]) => id === 'qianzhang'));
  assert.equal(leftovers(L, { qianzhang: 250 }, RECIPES, [r[0].recipeId])[0].recipeId !== r[0].recipeId, true); // prefers a recipe not in the week
  assert.deepEqual(leftovers(L, {}, RECIPES), []); // no packG → no hint
  assert.ok(KNOWN_KEYS.includes('packs'));
});
test('R11-4 fiber note threshold uses the displayed (rounded) value', async () => {
  const { planWeek } = await import('../js/core/plan.js');
  for (let seed = 0; seed < 6; seed++) for (const d of planWeek({ kcal: 1800, protein: 140 }, food, RECIPES, { seed }).week) assert.equal(!!d.fiberNote, Math.round(d.tot.fiber) < FIBER_MIN);
});
