import test from 'node:test';
import assert from 'node:assert/strict';
import { planWeek, FIBER_MIN, BREAKFASTS } from '../js/core/plan.js';
import { KNOWN_KEYS } from '../js/core/store.js';
import { makeIndex } from '../js/core/foods.js';
import { PRICE_REFS } from '../data/prices.js';
import { FOODS } from '../data/foods.js'; import { FOODS2 } from '../data/foods2.js'; import { FOODS3 } from '../data/foods3.js';
import { RECIPES } from '../data/recipes.js';
const food = makeIndex({ base: [FOODS, FOODS2, FOODS3], partials: [PRICE_REFS] });
const G = [[1400, 110], [1617, 160], [1800, 130], [1800, 145], [1800, 160], [2000, 100], [2200, 160]];
// Oats breakfast preference (07:15 order): opts.breakfast = 'oats' → 燕麦粥 every day; the week stays f(targets, seed, opts).
test('opts.breakfast oats: every day 燕麦粥, deterministic, fiber days not lower than rotate and ≥80%', () => {
  assert.ok(KNOWN_KEYS.includes('breakfastPref'));
  let n = 0, hiR = 0, hiO = 0;
  for (const [kcal, protein] of G) for (let seed = 0; seed < 6; seed++) {
    const t = { kcal, protein }, r = planWeek(t, food, RECIPES, { seed }).week, o = planWeek(t, food, RECIPES, { seed, breakfast: 'oats' });
    assert.deepEqual(planWeek(t, food, RECIPES, { seed, breakfast: 'oats' }), o);
    for (const d of o.week) assert.ok(d.meals[0].title.startsWith(BREAKFASTS[0].name));
    n += 7; hiR += r.filter(d => d.tot.fiber >= FIBER_MIN).length; hiO += o.week.filter(d => d.tot.fiber >= FIBER_MIN).length;
  }
  console.log('fiber days rotate', (hiR / n).toFixed(3), 'oats', (hiO / n).toFixed(3));
  assert.ok(hiO >= hiR && hiO / n >= 0.8);
});
