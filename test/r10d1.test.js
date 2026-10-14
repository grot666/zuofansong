import test from 'node:test';
import assert from 'node:assert/strict';
import { makeIndex, CURATED_CHIPS } from '../js/core/foods.js';
import { FOODS } from '../data/foods.js'; import { FOODS2 } from '../data/foods2.js'; import { FOODS3 } from '../data/foods3.js';
const all = [...FOODS, ...FOODS2, ...FOODS3]; const food = makeIndex(FOODS, FOODS2, FOODS3);
const near = (a, b, msg) => assert.ok(Math.abs(a - b) <= 0.5, `${msg}: ${a} vs ${b}`);
test('R10-D1 pinned values (±0.5)', () => {
  const pins = { tofuFirm: [99, 12.2, 4.8, 2.0], doufugan: [143, 16.2, 3.6, 11.5], qianzhang: [262, 24.5, 16.0, 5.5], corn: [112, 4.0, 1.2, 22.8], sole: [84, 17.7, 1.4, 0],
    wwBread: [252, 12.4, 3.5, 42.7], tomato: [18, 0.88, 0.2, 3.89], frozenVeg: [72, 3.33, 0.52, 13.5], cabbage: [25, 1.28, 0.1, 5.8], cauliflower: [25, 1.92, 0.28, 4.97], zucchini: [17, 1.21, 0.32, 3.11] };
  for (const [id, [k, p, f, c]] of Object.entries(pins)) { const x = food(id); near(x.kcal, k, id); near(x.protein, p, id); near(x.fat, f, id); near(x.carbs, c, id); assert.ok(x.verified, id); assert.ok(x.source, id); }
  near(food('tomato').fiber, 1.2, 'tomato fiber');
  for (const id of ['tofuFirm', 'doufugan', 'qianzhang', 'corn', 'sole']) assert.match(food(id).source, /营养所查询平台 #\d+ \(版次未核对\)/, id);
});
test('R10-D1 curated chips use verified foods', () => { for (const id of CURATED_CHIPS) if (!['riceCooked', 'thighRoasted', 'tunaLight'].includes(id)) assert.ok(food(id)?.verified, id); });
// Carbs here are total carbs incl. fiber (USDA convention); fiber ≈ 2 kcal/g.
const atwater = f => 4 * f.protein + 4 * Math.max(0, f.carbs - (f.fiber || 0)) + 2 * (f.fiber || 0) + 9 * f.fat;
test('R10-D1 kcal ≈ 4P + 4C + 9F within 15% for every food', () => {
  const bad = all.filter(f => f.kcal >= 20 && !f.atwaterNote).filter(f => { const e = atwater(f); return Math.abs(f.kcal - e) / f.kcal > 0.15; }).map(f => `${f.id} ${f.kcal} vs ${Math.round(atwater(f))}`);
  assert.deepEqual(bad, []);
});
