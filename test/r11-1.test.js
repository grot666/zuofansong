import test from 'node:test';
import assert from 'node:assert/strict';
import { planWeek, checkWeek, SP_ID, SP_MAX_PER_WEEK, STAPLE_MAX_G } from '../js/core/plan.js';
import { makeIndex } from '../js/core/foods.js';
import { PRICE_REFS } from '../data/prices.js';
import { FOODS } from '../data/foods.js'; import { FOODS2 } from '../data/foods2.js'; import { FOODS3 } from '../data/foods3.js';
import { RECIPES } from '../data/recipes.js';
const food = makeIndex({ base: [FOODS, FOODS2, FOODS3], partials: [PRICE_REFS] });
// R11-1: an SP day used up to 660 g 烤红薯; now ≤ 350 g/day (175 g per meal), cap ≤3 days still holds, all days ok.
test('R11-1 sweet potato ≤ 350 g/day on 1800/140 seeds 0–7 (budget none/¥300)', () => {
  assert.equal(STAPLE_MAX_G[SP_ID] * 2, 350);
  const t = { kcal: 1800, protein: 140 };
  for (let seed = 0; seed < 8; seed++) for (const budget of [undefined, 300]) {
    const w = planWeek(t, food, RECIPES, { seed, budget }).week;
    for (const d of w) assert.ok(d.meals.flatMap(m => m.items).filter(([id]) => id === SP_ID).reduce((s, [, g]) => s + g, 0) <= 350, `${seed} ${d.day}`);
    assert.ok(w.filter(d => d.staple === SP_ID).length <= SP_MAX_PER_WEEK);
    assert.ok(checkWeek(w, t).every(c => c.kcalOk && c.proteinOk), `seed ${seed}`);
  }
});
