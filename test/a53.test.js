import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { generateWeek, twinOf, SHOP_ALIAS, COOKED_TO_RAW, portionDay, fiberNote } from '../js/core/plan.js';
import * as foods from '../js/core/foods.js';
import { makeIndex } from '../js/core/foods.js';
import { PRICE_REFS } from '../data/prices.js';
import { FOODS } from '../data/foods.js'; import { FOODS2 } from '../data/foods2.js'; import { FOODS3 } from '../data/foods3.js';
import { RECIPES } from '../data/recipes.js';
const food = makeIndex({ base: [FOODS, FOODS2, FOODS3], partials: [PRICE_REFS] });
// A53: ids with no everyday base row that may stay unaliased on the list.
const USDA_ALLOW = new Set([]);
test('A53 SHOP_ALIAS/twinOf exported next to COOKED_TO_RAW and via the facade', () => {
  assert.equal(foods.SHOP_ALIAS, SHOP_ALIAS); assert.equal(foods.twinOf, twinOf); assert.equal(foods.COOKED_TO_RAW, COOKED_TO_RAW);
  assert.ok(typeof portionDay === 'function' && /纤维/.test(fiberNote(10)));
});
test('A53 every generator *USDA id aliases to a base row or is allowlisted', () => {
  const ids = new Set();
  for (const [kcal, protein] of [[1400, 110], [1800, 140], [2200, 160]]) for (let seed = 0; seed < 6; seed++)
    for (const d of generateWeek({ kcal, protein }, food, RECIPES, { seed })) for (const m of d.meals) for (const [id] of m.items) if (/USDA$/.test(id)) ids.add(id);
  assert.ok(ids.size > 0);
  for (const id of ids) assert.ok(twinOf(id, food)[0] !== id || USDA_ALLOW.has(id), id);
});
test('A53 each js/core/plan/* file ≤ 100 lines', () => {
  const dir = new URL('../js/core/plan/', import.meta.url);
  for (const f of readdirSync(dir)) assert.ok(readFileSync(new URL(f, dir), 'utf8').trimEnd().split('\n').length <= 100, f);
});
