import test from 'node:test';
import assert from 'node:assert/strict';
import { planWeek } from '../js/core/plan.js';
import { makeIndex } from '../js/core/foods.js';
import { computeTargets } from '../js/core/targets.js';
import { normalizeProfile } from '../js/core/profile.js';
import { FOODS } from '../data/foods.js'; import { FOODS2 } from '../data/foods2.js'; import { FOODS3 } from '../data/foods3.js';
import { RECIPES } from '../data/recipes.js';
const food = makeIndex(FOODS, FOODS2, FOODS3);
// A56: perf guards robust to a busy box / parallel `node --test`. Each timed run is preceded by a fixed CPU loop
// (CAL_BASE_MS on an idle box); locally the sample is divided by max(1, cal / CAL_BASE_MS). CI (env CI=true) stays strict.
const CAL_BASE_MS = 5.2;
const calLoop = () => { const t0 = performance.now(); let x = 0; for (let i = 0; i < 3e6; i++) x += Math.sqrt(i) * ((i & 7) + 1); globalThis.__cal = x; return performance.now() - t0; };
const STRICT = process.env.CI === 'true' || process.env.PERF === '1';
const timed = fn => { const scale = STRICT ? 1 : Math.max(1, calLoop() / CAL_BASE_MS); const t0 = performance.now(); fn(); return (performance.now() - t0) / scale; };
for (let i = 0; i < 3; i++) calLoop();
test('A32/A43 planWeek median of 7 < 25 ms (default profile, 3 scoops, tight budget)', () => {
  const t = computeTargets(normalizeProfile({}));
  for (let i = 0; i < 3; i++) planWeek(t, food, RECIPES, { seed: 10 + i, budget: 150, powderScoops: 3 }); // JIT warm-up (steady-state timing)
  const ms = [];
  for (let i = 0; i < 7; i++) ms.push(timed(() => planWeek(t, food, RECIPES, { seed: i, budget: 150, powderScoops: 3 })));
  ms.sort((a, b) => a - b); console.log(STRICT ? 'strict' : 'calibrated', 'planWeek ms', ms.map(x => x.toFixed(1)).join(' '));
  assert.ok(ms[3] < 25, `median ${ms[3]}`);
});
test('A43 grid p95 < 40 ms over 30 mixed runs (budgets incl. 0.5×)', () => {
  const T = [{ kcal: 1400, protein: 110 }, { kcal: 1800, protein: 140 }, { kcal: 2200, protein: 160 }]; const ms = [];
  for (let i = 0; i < 30; i++) {
    const t = T[i % 3], seed = i % 6, f = [null, 1, 0.9, 0.7, 0.5][i % 5];
    const free = f == null ? null : planWeek(t, food, RECIPES, { seed }).cost;
    ms.push(timed(() => planWeek(t, food, RECIPES, { seed, budget: free == null ? undefined : f * free })));
  }
  ms.sort((a, b) => a - b); const p95 = ms[Math.ceil(0.95 * ms.length) - 1]; console.log('grid p95 ms', p95.toFixed(1), 'max', ms.at(-1).toFixed(1));
  assert.ok(p95 < 40, `p95 ${p95}`);
});
