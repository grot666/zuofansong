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
// A69: the note never rounds a below-target day up to the target ("约 25 g" for 24.6 g); threshold unchanged.
test('A69 fiberNote shows a below-target value, threshold unchanged', async () => {
  const { fiberNote, FIBER_MIN } = await import('../js/core/plan/fiber.js');
  for (const f of [24.1, 24.6, 24.99]) assert.ok(!fiberNote(f).includes(`约 ${FIBER_MIN} g`), String(f));
  assert.match(fiberNote(24.6), /约 24 g/);
});
