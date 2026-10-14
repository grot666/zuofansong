import test from 'node:test';
import assert from 'node:assert/strict';
import { generateWeek } from '../js/core/plan.js';
import { makeIndex } from '../js/core/foods.js';
import { FOODS } from '../data/foods.js'; import { FOODS2 } from '../data/foods2.js'; import { FOODS3 } from '../data/foods3.js';
import { RECIPES } from '../data/recipes.js';
const food = makeIndex(FOODS, FOODS2, FOODS3);
test('snack variety: no add-on item on more than 4 days/week; week still f(targets, seed)', () => {
  for (const [k, p] of [[1617, 160], [1800, 140], [1400, 140], [2000, 100]]) for (let seed = 0; seed < 9; seed++) {
    const w = generateWeek({ kcal: k, protein: p }, food, RECIPES, { seed }); const c = {};
    for (const d of w) for (const id of new Set(d.addon.map(x => x[0]))) c[id] = (c[id] || 0) + 1;
    assert.ok(Math.max(0, ...Object.values(c)) <= 4, `${k}/${p}/${seed} ${JSON.stringify(c)}`);
    assert.deepEqual(generateWeek({ kcal: k, protein: p }, food, RECIPES, { seed }), w);
  }
});
