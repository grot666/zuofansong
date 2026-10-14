import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mealScores } from '../js/core/scores.js';
import { makeIndex } from '../js/core/foods.js';
import { FOODS } from '../data/foods.js'; import { FOODS2 } from '../data/foods2.js'; import { FOODS3 } from '../data/foods3.js';
const food = makeIndex(FOODS, FOODS2, FOODS3);
const s4 = m => { const { health, easy, cheap, tasty } = mealScores(m, food); return { health, easy, cheap, tasty }; };
test('A31 golden meal scores (change deliberately)', () => {
  assert.deepEqual(s4([['riceCooked', 150], ['thighRoasted', 120], ['shanghaiQing', 250], ['oil', 6]]), { health: 4, easy: 5, cheap: 5, tasty: 5 });
  assert.deepEqual(s4([['tofuFirm', 200], ['cabbage', 250]]), { health: 4, easy: 5, cheap: 5, tasty: 3 });
  assert.deepEqual(s4([['salmon', 400]]), { health: 3, easy: 4, cheap: 1, tasty: 4 });
});
test('A31 tasty comes from data, not a hardcoded id list', () => {
  assert.doesNotMatch(readFileSync('js/core/scores.js', 'utf8'), /'seabass'|'salmon'/);
  const custom = makeIndex([...FOODS, { id: 'cx', name: '自定义红烧', kcal: 150, protein: 15, fat: 8, carbs: 3, fiber: 0, tasty: true }]);
  assert.equal(mealScores([['cx', 100]], custom).tasty, mealScores([['tofuFirm', 100]], food).tasty + 1);
});
