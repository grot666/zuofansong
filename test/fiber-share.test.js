import test from 'node:test';
import assert from 'node:assert/strict';
import { makeIndex } from '../js/core/foods.js';
import { FOODS } from '../data/foods.js'; import { FOODS2 } from '../data/foods2.js'; import { FOODS3 } from '../data/foods3.js';
import { RECIPES } from '../data/recipes.js';
import { planWeek, FIBER_MIN } from '../js/core/plan.js';
const food = makeIndex(FOODS, FOODS2, FOODS3);
// A61: share of plan days with fiber ≥ FIBER_MIN over 8 targets × seeds 0–5 × budget {none, 0.8×free}.
const TARGETS = [[1400, 110], [1500, 140], [1617, 160], [1800, 130], [1800, 140], [1800, 160], [2000, 100], [2200, 160]];
test('A61 fiber-days share: overall ≥ 90%, each target ≥ 80% (A84)', () => {
  let ok = 0, n = 0; const rows = [];
  for (const [kcal, protein] of TARGETS) {
    let o = 0, m = 0;
    for (let seed = 0; seed < 6; seed++) {
      const free = planWeek({ kcal, protein }, food, RECIPES, { seed });
      const cost = free.cost ?? free.week.reduce((s, d) => s + (d.tot.cost || 0), 0);
      for (const opts of [{ seed }, { seed, budget: Math.round(cost * 0.8) }]) for (const d of planWeek({ kcal, protein }, food, RECIPES, opts).week) { m++; if (d.tot.fiber >= FIBER_MIN) o++; }
    }
    rows.push(`${kcal}/${protein} ${(o / m * 100).toFixed(1)}%`); ok += o; n += m;
    assert.ok(o / m >= 0.8, `${kcal}/${protein} ${(o / m * 100).toFixed(1)}%`);
  }
  console.log(`A61 fiber days ≥${FIBER_MIN} g: overall ${(ok / n * 100).toFixed(1)}% | ${rows.join(' | ')}`);
  assert.ok(ok / n >= 0.9, `overall ${(ok / n * 100).toFixed(1)}%`);
});
