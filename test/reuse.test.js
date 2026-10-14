import test from 'node:test';
import assert from 'node:assert/strict';
import { generateWeek, distinctVeg } from '../js/core/plan.js';
import { makeIndex } from '../js/core/foods.js';
import { FOODS } from '../data/foods.js'; import { FOODS2 } from '../data/foods2.js'; import { FOODS3 } from '../data/foods3.js';
import { RECIPES } from '../data/recipes.js';
const food = makeIndex([...FOODS, ...FOODS2, ...FOODS3]);
test('reuse: fewer distinct veg than plain rotation for every seed, no repeated recipe in a week', () => {
  let a = 0, b = 0;
  for (let seed = 0; seed < 6; seed++) {
    const t = { kcal: 1800, protein: 140 };
    const w = generateWeek(t, food, RECIPES, { seed }), w0 = generateWeek(t, food, RECIPES, { seed, reuse: false });
    const n = distinctVeg(w, food), n0 = distinctVeg(w0, food);
    assert.ok(n <= n0, `seed ${seed}: ${n} > ${n0}`); a += n; b += n0;
  }
  assert.ok(a < b, `total ${a} vs ${b}`);
});
test('FDC ids confirmed for pasta (169736) and sweet potato (168482)', () => {
  assert.equal(food('pasta').source, 'USDA FDC 169736'); assert.equal(food('pasta').verified, true); assert.equal(food('pasta').kcal, 371);
  assert.equal(food('sweetPotato').source, 'USDA FDC 168482'); assert.equal(food('sweetPotato').verified, true); assert.equal(food('sweetPotato').kcal, 86);
});
