import test from 'node:test';
import assert from 'node:assert/strict';
import { makeIndex } from '../js/core/foods.js';
import { FOODS } from '../data/foods.js'; import { FOODS2 } from '../data/foods2.js'; import { FOODS3 } from '../data/foods3.js';
import { RECIPES } from '../data/recipes.js';
import { planWeek, FIBER_MIN } from '../js/core/plan.js';
const food = makeIndex(FOODS, FOODS2, FOODS3);
// A84: R14-1 floors (rotate, seeds 0–11, no budget); measured 90.5 / 96.4 / 94.0 at v0.10.60.
test('A84 R14-1 fiber-day floors and 0 fit misses', () => {
  for (const [kcal, protein, floor] of [[1500, 140, 90.0], [1800, 140, 96.0], [1400, 110, 93.5]]) {
    let ok = 0, n = 0, miss = 0;
    for (let seed = 0; seed < 12; seed++) for (const d of planWeek({ kcal, protein }, food, RECIPES, { seed }).week) { n++; if (d.tot.fiber >= FIBER_MIN) ok++; if (d.fit !== 'ok') miss++; }
    const pct = ok / n * 100;
    assert.ok(pct >= floor, `${kcal}/${protein} ${pct.toFixed(1)}% < ${floor}%`); assert.equal(miss, 0, `${kcal}/${protein} fit misses ${miss}`);
  }
});
