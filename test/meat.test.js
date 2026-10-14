import test from 'node:test';
import assert from 'node:assert/strict';
import { generateWeek, TUNA_MAX_PER_WEEK } from '../js/core/plan.js';
import { makeIndex } from '../js/core/foods.js';
import { FOODS } from '../data/foods.js'; import { FOODS2 } from '../data/foods2.js'; import { FOODS3 } from '../data/foods3.js';
import { RECIPES } from '../data/recipes.js';
const food = makeIndex(FOODS, FOODS2, FOODS3);
test('meat-lean: grid avg meat ≤180 g/meal (variety trade-off) (was ~258), 1617/160 ≤245 (eggWhite FDC values, v0.9.9), tuna ≤2 days/week', () => {
  let n = 0, g = 0, m = 0, mn = 0;
  for (const k of [1400, 1500, 1617, 1800, 2000, 2200]) for (const p of [100, 140, 160]) for (let seed = 0; seed < 9; seed++) {
    const w = generateWeek({ kcal: k, protein: p }, food, RECIPES, { seed });
    assert.ok(w.filter(d => d.addon.some(([id]) => id === 'tunaLight')).length <= TUNA_MAX_PER_WEEK);
    for (const d of w) { n++; g += d.proteinG; if (k === 1617 && p === 160) { m += d.proteinG; mn++; } }
  }
  assert.ok(g / n <= 180, `grid avg ${g / n}`); assert.ok(m / mn <= 245, `1617/160 avg ${m / mn}`);
});
