import test from 'node:test';
import assert from 'node:assert/strict';
import { planWeek, generateWeek, checkWeek, planTips } from '../js/core/plan.js';
import { makeIndex } from '../js/core/foods.js';
import { FOODS } from '../data/foods.js'; import { FOODS2 } from '../data/foods2.js'; import { FOODS3 } from '../data/foods3.js';
import { RECIPES } from '../data/recipes.js';
const food = makeIndex(FOODS, FOODS2, FOODS3);
test('R9-1 greedy keeps swapping on real cost', () => {
  const r = planWeek({ kcal: 1800, protein: 130 }, food, RECIPES, { seed: 2, budget: 200 });
  assert.ok(r.cost <= 200 && !r.overBudget);
  for (let seed = 0; seed < 4; seed++) assert.equal(planWeek({ kcal: 1800, protein: 140 }, food, RECIPES, { seed, budget: 150 }).overBudget, true);
  assert.deepEqual(planWeek({ kcal: 1800, protein: 140 }, food, RECIPES, { seed: 1 }).week, generateWeek({ kcal: 1800, protein: 140 }, food, RECIPES, { seed: 1 }));
});
test('A34 never a silent fail: checkWeek ok, or unfit/overBudget set, with a visible tip', () => {
  for (const [k, p] of [[1617, 160], [1800, 140]]) for (let seed = 0; seed < 3; seed++) {
    const free = planWeek({ kcal: k, protein: p }, food, RECIPES, { seed }).cost;
    for (const f of [0.95, 0.85, 0.7]) {
      const r = planWeek({ kcal: k, protein: p }, food, RECIPES, { seed, budget: f * free });
      const base = generateWeek({ kcal: k, protein: p }, food, RECIPES, { seed });
      const silent = r.week.some((d, i) => base[i].fit === 'ok' && d.fit !== 'ok' && !r.unfit.includes(i));
      assert.ok(!silent, `${k}/${p}/${seed}/${f}`);
      if (r.unfit.length) assert.ok(planTips(r).some(t => t.startsWith('⚠')));
    }
  }
});
