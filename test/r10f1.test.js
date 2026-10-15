import test from 'node:test';
import assert from 'node:assert/strict';
import { planWeek, checkWeek, FIBER_MIN } from '../js/core/plan.js';
import { makeIndex } from '../js/core/foods.js';
import { PRICE_REFS } from '../data/prices.js';
import { FOODS } from '../data/foods.js'; import { FOODS2 } from '../data/foods2.js'; import { FOODS3 } from '../data/foods3.js';
import { RECIPES } from '../data/recipes.js';
const food = makeIndex({ base: [FOODS, FOODS2, FOODS3], partials: [PRICE_REFS] });
test('R10-F1 grid 1800 × p130/145/160 × budget none/200 × seeds 0–5: ≥80% days ≥25 g fiber; the rest carry fiberNote; all ok', () => {
  let n = 0, hi = 0;
  for (const protein of [130, 145, 160]) for (const budget of [undefined, 200]) for (let seed = 0; seed < 6; seed++) {
    const t = { kcal: 1800, protein }; const r = planWeek(t, food, RECIPES, { seed, budget });
    for (const d of r.week) { n++; if (d.tot.fiber >= FIBER_MIN) hi++; else assert.ok(d.fiberNote && /纤维/.test(d.fiberNote), 'note'); }
    assert.ok(checkWeek(r.week, t).every(c => c.kcalOk && c.proteinOk), `${protein}/${budget}/${seed}`);
  }
  console.log('fiber ≥25 g days', hi, '/', n); assert.ok(hi / n >= 0.8, `${hi}/${n}`);
});
