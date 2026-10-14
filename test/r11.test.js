import test from 'node:test';
import assert from 'node:assert/strict';
import { TRAY_STEPS, TRAY_BAKE, SAUCES } from '../data/sauces.js';
import { trayPlan } from '../js/core/sauces.js';
import { PROTEINS } from '../js/core/plan.js';
test('R-11 every planner protein has tray settings; each evening ≤ 30 min and wrist-safe', () => {
  const tp = trayPlan(PROTEINS, TRAY_STEPS, TRAY_BAKE, SAUCES);
  tp.forEach((x, i) => { assert.ok(x, PROTEINS[i]); assert.ok(x.totalMin <= 30, `${x.id} ${x.totalMin}`); assert.equal(x.wristSafe, true); assert.ok(x.temp >= 180 && x.temp <= 230); });
  assert.notEqual(tp[0].sauce.id, tp[1].sauce.id); // sauces rotate across evenings
});
