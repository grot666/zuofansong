import test from 'node:test';
import assert from 'node:assert/strict';
import { planWeek } from '../js/core/plan.js';
import { makeIndex } from '../js/core/foods.js';
import { computeTargets } from '../js/core/targets.js';
import { normalizeProfile } from '../js/core/profile.js';
import { FOODS } from '../data/foods.js'; import { FOODS2 } from '../data/foods2.js'; import { FOODS3 } from '../data/foods3.js';
import { RECIPES } from '../data/recipes.js';
const food = makeIndex(FOODS, FOODS2, FOODS3);
test('A32 planWeek median < 60 ms (default profile, 3 scoops, tight budget)', () => {
  const t = computeTargets(normalizeProfile({}));
  planWeek(t, food, RECIPES, { seed: 0, budget: 150, powderScoops: 3 }); // warm-up
  const ms = [];
  for (let i = 0; i < 5; i++) { const t0 = performance.now(); planWeek(t, food, RECIPES, { seed: i, budget: 150, powderScoops: 3 }); ms.push(performance.now() - t0); }
  ms.sort((a, b) => a - b); console.log('planWeek ms', ms.map(x => x.toFixed(1)).join(' '));
  assert.ok(ms[2] < 60, `median ${ms[2]}`);
});
