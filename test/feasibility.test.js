import test from 'node:test';
import assert from 'node:assert/strict';
import { generateWeek, checkWeek, planWeek } from '../js/core/plan.js';
import { makeIndex } from '../js/core/foods.js';
import { FOODS } from '../data/foods.js';
import { FOODS2 } from '../data/foods2.js';
import { FOODS3 } from '../data/foods3.js';
import { RECIPES } from '../data/recipes.js';
const food = makeIndex(FOODS, FOODS2, FOODS3);
test('A19 feasibility grid', () => {
  let bad = [];
  for (const kcal of [1400, 1500, 1617, 1800, 2000, 2200]) for (const protein of [110, 140, 160]) for (let seed = 0; seed < 9; seed++) {
    const t = { kcal, protein }; const w = generateWeek(t, food, RECIPES, { seed }); const ck = checkWeek(w, t);
    w.forEach((d, i) => {
      const ok = ck[i].kcalOk && ck[i].proteinOk;
      if (protein * 4 <= 0.40 * kcal) { if (!ok) bad.push(`${kcal}/${protein}/s${seed}/d${i}`); }
      else if (!ok) assert.notEqual(d.fit, 'ok');
    });
  }
  assert.deepEqual(bad, []);
});
test('A19 planWeek flags infeasible targets', () => {
  assert.ok(planWeek({ kcal: 1200, protein: 160 }, food, RECIPES, { seed: 0 }).infeasible);
  assert.equal(planWeek({ kcal: 1800, protein: 140 }, food, RECIPES, { seed: 0 }).infeasible, null);
});
