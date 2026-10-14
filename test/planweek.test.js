import test from 'node:test';
import assert from 'node:assert/strict';
import { planWeek, checkWeek } from '../js/core/plan.js';
import { makeIndex } from '../js/core/foods.js';
import { FOODS } from '../data/foods.js';
import { FOODS2 } from '../data/foods2.js';
import { FOODS3 } from '../data/foods3.js';
import { RECIPES } from '../data/recipes.js';
const food = makeIndex(FOODS, FOODS2, FOODS3);
const t = { kcal: 1800, protein: 140 };
test('A16 planWeek invariants over seeds × budgets', () => {
  for (const seed of [0, 1, 2, 3, 5, 8]) {
    const base = planWeek(t, food, RECIPES, { seed });
    for (const budget of [null, 400, base.cost, base.cost * 0.9, base.cost * 0.75, 100]) {
      const r = planWeek(t, food, RECIPES, { seed, budget: budget ?? undefined });
      const w = r.week; assert.equal(w.length, 7);
      for (let d = 0; d < 7; d++) assert.equal(w[(d + 1) % 7].meals[1].items[1][0], w[d].dinnerProtein, `seed ${seed} d${d}`); // incl. d=6 -> lunch(0)
      if (r.swaps) { const c = {}; for (const d of w) c[d.dinnerProtein] = (c[d.dinnerProtein] || 0) + 1; for (const n of Object.values(c)) assert.ok(n <= 3, JSON.stringify(c)); }
      for (const ck of checkWeek(w, t)) assert.ok(ck.proteinOk, `protein seed ${seed} budget ${budget}`);
      assert.ok(r.cost <= base.cost + 1e-6);
      if (budget != null) assert.equal(r.overBudget, r.cost > budget);
    }
  }
});
