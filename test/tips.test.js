import test from 'node:test';
import assert from 'node:assert/strict';
import { planTips } from '../js/core/plan.js';
test('planTips', () => {
  assert.deepEqual(planTips({ swaps: 0, week: [{ addon: [['eggWhite', 99]] }] }), []);
  const t = planTips({ swaps: 2, week: [{ addon: [['eggWhite', 99]] }, { addon: [['yogurt', 300]] }] });
  assert.match(t[0], /已按预算换更合适的蛋白（看评分）/); assert.match(t[1], /加餐已轮换，同一种最多约 4 天/);
});
