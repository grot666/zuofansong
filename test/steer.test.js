import test from 'node:test';
import assert from 'node:assert/strict';
import { selectWeek, vegScore, rankVeg, REUSE_WINDOW } from '../js/core/plan.js';
import { makeIndex } from '../js/core/foods.js';
import { FOODS } from '../data/foods.js'; import { FOODS2 } from '../data/foods2.js'; import { FOODS3 } from '../data/foods3.js';
import { RECIPES } from '../data/recipes.js';
const food = makeIndex(FOODS, FOODS2, FOODS3);
test('scores steer: seed 0 uses 14 distinct, near-top-ranked (reuse window) veg recipes', () => {
  const w = selectWeek(food, RECIPES, { seed: 0 });
  const ids = w.flatMap(d => [d.vegL.id, d.vegD.id]);
  assert.equal(new Set(ids).size, 14);
  const ranked = rankVeg(RECIPES, food); const top = new Set(ranked.slice(0, 14 + REUSE_WINDOW - 1).map(r => r.id));
  assert.ok(ids.every(id => top.has(id)));
  const avg = a => a.reduce((s, r) => s + vegScore(r, food), 0) / a.length;
  assert.ok(avg(w.flatMap(d => [d.vegL, d.vegD])) >= avg(RECIPES));
});
