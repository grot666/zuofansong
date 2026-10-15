import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { makeIndex } from '../js/core/foods.js';
import { FOODS } from '../data/foods.js'; import { FOODS2 } from '../data/foods2.js'; import { FOODS3 } from '../data/foods3.js';
import { RECIPES } from '../data/recipes.js';
import { planWeek, shoppingList, tripLists, listLines, TRIP2_FROM, TRIP2_FROM_DAY, DAY_NAMES } from '../js/core/plan.js';
const food = makeIndex(FOODS, FOODS2, FOODS3);
test('A67 trip costs add up; listLines = rendered rows; heading from TRIP2_FROM', () => {
  for (let seed = 0; seed < 8; seed++) {
    const list = shoppingList(planWeek({ kcal: 1800, protein: 140 }, food, RECIPES, { seed }).week, food);
    const t = tripLists(list); const sum = a => a.reduce((s, x) => s + x.cost, 0);
    const main = list.filter(x => !x.pantry && !x.small);
    assert.ok(Math.abs(sum(t.trip1) + sum(t.trip2) - sum(main)) < 0.01, `seed ${seed}`);
    assert.equal(listLines(list), t.trip1.length + t.trip2.length + (t.small.length ? 1 : 0) + (t.pantry.length ? 1 : 0));
  }
  assert.equal(TRIP2_FROM_DAY, DAY_NAMES[TRIP2_FROM]);
  assert.ok(!readFileSync(new URL('../js/plan-page.js', import.meta.url), 'utf8').includes('周五起用'));
});
