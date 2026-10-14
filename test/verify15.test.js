import test from 'node:test';
import assert from 'node:assert/strict';
import { makeIndex } from '../js/core/foods.js';
import { FOODS } from '../data/foods.js'; import { FOODS2 } from '../data/foods2.js'; import { FOODS3 } from '../data/foods3.js';
const food = makeIndex(FOODS, FOODS2, FOODS3);
// VER-15 (PM 07:16): next most-used unverified planner foods (grams over 3 targets × 10 seeds, v0.10.36; quick-add chips were already all verified).
const V = { shanghaiQing: 170390, loofah: 168414, winterMelon: 170069, kongxincai: 169301, broccoli: 170379, pumpkin: 168448, garlic: 169230, oil: 171411 };
const APPROX = ['yam', 'kelp', 'soy', 'sesamePaste', 'oyster', 'jimaocai', 'woodEar'];
const atwater = f => 4 * f.protein + 4 * Math.max(0, f.carbs - (f.fiber || 0)) + 2 * (f.fiber || 0) + 9 * f.fat;
test('VER-15: 8 foods verified with the cited FDC id; 7 China-specific foods ≈ with an FDC source diff', () => {
  for (const [id, fdc] of Object.entries(V)) { const f = food(id); assert.ok(f.verified && f.source === `USDA FDC ${fdc}`, id); }
  for (const id of APPROX) { const f = food(id); assert.ok(!f.verified && f.fdcCompare?.id > 0 && f.fdcCompare.kcal > 0 && /≈/.test(f.fdcCompare.note), id); }
});
test('VER-15 Atwater: every batch food within 15% or 6 kcal (low-kcal veg below the r10d1 20-kcal floor included)', () => {
  for (const id of [...Object.keys(V), ...APPROX]) { const f = food(id); const e = atwater(f); assert.ok(f.atwaterNote || Math.abs(f.kcal - e) <= Math.max(6, 0.15 * f.kcal), `${id} ${f.kcal} vs ${e.toFixed(0)}`); }
});
