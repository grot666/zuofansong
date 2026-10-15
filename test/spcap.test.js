import test from 'node:test';
import assert from 'node:assert/strict';
import { planWeek, FIBER_MIN, SP_ID, SP_MAX_PER_WEEK } from '../js/core/plan.js';
import { makeIndex } from '../js/core/foods.js';
import { PRICE_REFS } from '../data/prices.js';
import { FOODS } from '../data/foods.js'; import { FOODS2 } from '../data/foods2.js'; import { FOODS3 } from '../data/foods3.js';
import { RECIPES } from '../data/recipes.js';
const food = makeIndex({ base: [FOODS, FOODS2, FOODS3], partials: [PRICE_REFS] });
// 烤红薯 variety cap: ≤3 sweet-potato days per week; fiber share on the grid stays ≥ the pre-cap 75% (DECISIONS).
test('SP cap: ≤3 烤红薯 days/week, fiber ≥25 g on ≥75% of grid days, every short day carries fiberNote', () => {
  let n = 0, hi = 0, sp = 0;
  for (const [kcal, protein] of [[1400, 110], [1617, 160], [1800, 130], [1800, 145], [1800, 160], [2000, 100], [2200, 160]]) for (let seed = 0; seed < 6; seed++) {
    for (const budget of [undefined, 200]) {
      const w = planWeek({ kcal, protein }, food, RECIPES, { seed, budget }).week;
      assert.ok(w.filter(d => d.staple === SP_ID).length <= SP_MAX_PER_WEEK, `${kcal}/${protein}/${seed}/${budget}`);
      // R11-4: the fiber note uses the displayed (rounded) value, so 24.6 g shows no note
      for (const d of w) { n++; if (d.staple === SP_ID) sp++; if (d.tot.fiber >= FIBER_MIN) hi++; else if (Math.round(d.tot.fiber) < FIBER_MIN) assert.ok(d.fiberNote); if (d.spCap) assert.notEqual(d.staple, SP_ID); }
    }
  }
  // A55 batch staple + R11-2 peas side on any short day: 88.6% on this grid (v0.10.43)
  console.log('spcap fiber share', (hi / n).toFixed(3));
  assert.ok(hi / n >= 0.8, String(hi / n));
  assert.ok(sp / n <= 3 / 7 + 1e-9, String(sp / n)); // A60: restored
});
// A59: select.js schedules sweet potato on at most one 2-day batch (4 staples rotate over the 4 batches), so the cap
// in day.js is only a backstop; on this grid no day needs a staple swap (stapleSwap / spCap count pinned at 0, v0.10.48).
test('A59 selectWeek: ≤1 sweet-potato batch by construction; 0 staple swaps on the spcap grid', async () => {
  const { selectWeek, STAPLES } = await import('../js/core/plan.js');
  assert.equal(STAPLES.filter(s => s === SP_ID).length, 1); assert.ok(STAPLES.length >= 4);
  let swaps = 0;
  for (let seed = 0; seed < 12; seed++) assert.ok(selectWeek(food, RECIPES, { seed }).filter(d => d.staple === SP_ID).length <= 2, String(seed));
  for (const [kcal, protein] of [[1400, 110], [1617, 160], [1800, 130], [1800, 145], [1800, 160], [2000, 100], [2200, 160]]) for (let seed = 0; seed < 6; seed++)
    for (const budget of [undefined, 200]) swaps += planWeek({ kcal, protein }, food, RECIPES, { seed, budget }).week.filter(d => d.stapleSwap || d.spCap).length;
  assert.equal(swaps, 0);
});
