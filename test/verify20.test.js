import test from 'node:test';
import assert from 'node:assert/strict';
import { makeIndex } from '../js/core/foods.js';
import { FOODS } from '../data/foods.js'; import { FOODS2 } from '../data/foods2.js'; import { FOODS3 } from '../data/foods3.js';
const food = makeIndex(FOODS, FOODS2, FOODS3);
// VER-20 (07:15 order): 20 fruits/veg/nuts/eggs/meat with clear FDC SR Legacy equivalents now verified; Chinese-specific ones stay ≈ with an FDC note.
const V20 = { apple: 171688, banana: 173944, orange: 169097, cucumber: 168409, eggplant: 169228, celery: 169988, snowPea: 170010, bitterMelon: 168393, shiitake: 169242, enoki: 169382, potato: 170026, peanuts: 172430, walnut: 170187, egg: 171287, chickenBreast: 171077, chickenThigh: 173627, beansprout: 169957, napa: 169979, kiwiGold: 168211, edamame: 168411 };
test('VER-20: 20 foods verified against the cited FDC id', () => {
  for (const [id, fdc] of Object.entries(V20)) { const f = food(id); assert.ok(f.verified && f.source === `USDA FDC ${fdc}`, id); }
  assert.equal(food('chickenBreast').protein, 22.5); assert.equal(food('walnut').kcal, 654); assert.equal(food('egg').kcal, 143);
});
test('VER-20: Chinese-specific twins stay ≈ with an FDC comparison note', () => {
  for (const id of ['shrimp', 'taro', 'lotusRoot']) { const f = food(id); assert.ok(!f.verified && f.fdcCompare?.id && /≈/.test(f.fdcCompare.note), id); }
});
