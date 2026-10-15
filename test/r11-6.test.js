import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FOODS } from '../data/foods.js';
import { FOODS2 } from '../data/foods2.js';

const all = [...FOODS, ...FOODS2];
test('R11-6: every verified food cites an FDC id or a 平台 id', () => {
  const bad = all.filter(f => f.verified && !/USDA FDC \d+|平台 #\d+/.test(f.source || '')).map(f => f.id);
  assert.deepEqual(bad, []);
});
test('R11-6: yam/jiaobai cite 平台 ids and keep the pinned values', () => {
  const by = Object.fromEntries(all.map(f => [f.id, f]));
  assert.match(by.yam.source, /平台 #525/); assert.match(by.jiaobai.source, /平台 #519/);
  assert.ok(Math.abs(by.yam.kcal - 57) <= 0.5); assert.ok(Math.abs(by.jiaobai.kcal - 26) <= 0.5);
});
