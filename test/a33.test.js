import test from 'node:test';
import assert from 'node:assert/strict';
import { planWeek, shoppingList } from '../js/core/plan.js';
import { weekReview } from '../js/core/review.js';
import { makeIndex } from '../js/core/foods.js';
import { addDays } from '../js/core/dates.js';
import { FOODS } from '../data/foods.js'; import { FOODS2 } from '../data/foods2.js'; import { FOODS3 } from '../data/foods3.js';
import { RECIPES } from '../data/recipes.js';
const food = makeIndex(FOODS, FOODS2, FOODS3);
const asLogs = week => { const dates = week.map((_, i) => addDays('2026-10-12', i)); const logs = {}; week.forEach((d, i) => { logs[dates[i]] = { items: d.meals.flatMap(m => m.items).map(([id, g]) => ({ id, g })) }; }); return { dates, logs }; };
test('A33 generated weeks never trip the review tuna note; albacore never chosen', () => {
  for (const [k, p] of [[1400, 110], [1617, 160], [1800, 140], [2200, 160], [1500, 140]]) for (let seed = 0; seed < 9; seed++) {
    const free = planWeek({ kcal: k, protein: p }, food, RECIPES, { seed });
    const freeCost = shoppingList(free.week, food).reduce((s, x) => s + x.cost, 0);
    for (const budget of [undefined, 0.8 * freeCost]) {
      const { week } = planWeek({ kcal: k, protein: p }, food, RECIPES, { seed, budget });
      const { dates, logs } = asLogs(week);
      assert.equal(weekReview(dates, logs, food, { kcal: k, protein: p }).tunaNotes.length, 0, `${k}/${p}/${seed}/${budget}`);
      assert.ok(!week.some(d => d.meals.some(m => m.items.some(([id]) => id === 'tunaAlbacore'))));
    }
  }
});
