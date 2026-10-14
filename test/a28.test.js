import test from 'node:test';
import assert from 'node:assert/strict';
import { generateWeek, FITS } from '../js/core/plan.js';
import { makeIndex } from '../js/core/foods.js';
import { FOODS } from '../data/foods.js'; import { FOODS2 } from '../data/foods2.js'; import { FOODS3 } from '../data/foods3.js';
import { RECIPES } from '../data/recipes.js';
const food = makeIndex(FOODS, FOODS2, FOODS3);
test('A28 protein-short days are protein-low', () => {
  // Since v0.8.8 add-ons close the gap on some days; every short day must still read 'protein-low'.
  const w = generateWeek({ kcal: 1400, protein: 220 }, food, RECIPES, { seed: 0, proteins: ['tofuFirm'] });
  const short = w.filter(d => d.tot.protein < 219.5);
  assert.ok(short.length >= 3);
  for (const d of short) assert.equal(d.fit, 'protein-low');
});
test('A28 every grid fit in FITS', () => {
  for (const k of [1400, 1617, 1800, 2200]) for (const p of [100, 140, 160]) for (let seed = 0; seed < 3; seed++)
    for (const d of generateWeek({ kcal: k, protein: p }, food, RECIPES, { seed })) assert.ok(FITS.includes(d.fit), d.fit);
});
