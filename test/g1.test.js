import test from 'node:test';
import assert from 'node:assert/strict';
import { mealScores } from '../js/core/scores.js';
import { makeIndex } from '../js/core/foods.js';
import { FOODS } from '../data/foods.js'; import { FOODS2 } from '../data/foods2.js'; import { FOODS3 } from '../data/foods3.js';
import { readFileSync } from 'node:fs';
const food = makeIndex(FOODS, FOODS2, FOODS3);
test('G1 mealScores: 1-5 ints, same result for {id,g} and [id,g]', () => {
  const a = mealScores([{ id: 'riceCooked', g: 150 }, { id: 'thighRoasted', g: 120 }, { id: 'shanghaiQing', g: 250 }, { id: 'oil', g: 6 }], food);
  const b = mealScores([['riceCooked', 150], ['thighRoasted', 120], ['shanghaiQing', 250], ['oil', 6]], food);
  assert.deepEqual(a, b);
  for (const k of ['health', 'easy', 'cheap', 'tasty']) assert.ok(Number.isInteger(a[k]) && a[k] >= 1 && a[k] <= 5, k);
});
test('G1 pricier meal scores lower on 便宜', () => {
  const cheap = mealScores([['tofuFirm', 200], ['cabbage', 250]].filter(([id]) => food(id)), food);
  const dear = mealScores([['salmon', 400]].filter(([id]) => food(id)), food);
  assert.ok(cheap.cheap > dear.cheap);
});
test('G1 plate view and plan page share mealScores', () => {
  for (const f of ['js/views/plate.js', 'js/plan-page.js']) assert.match(readFileSync(f, 'utf8'), /mealScores\(/);
});
