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
// A75: citation rules over FOODS + FOODS2 + FOODS3.
import { FOODS3 } from '../data/foods3.js';
const ALL3 = [...FOODS, ...FOODS2, ...FOODS3];
// Every 平台 #N food pins its values here (kcal, protein, fat, carbs, fiber).
export const PLATFORM_PINS = { corn: [292, 112, 4, 1.2, 22.8, 2.9], yam: [525, 57, 1.9, 0.2, 12.4, 0.8], tofuFirm: [334, 99, 12.2, 4.8, 2, 0.5], doufugan: [346, 143, 16.2, 3.6, 11.5, 0.8], qianzhang: [345, 262, 24.5, 16, 5.5, 1], sole: [1045, 84, 17.7, 1.4, 0, 0], jiaobai: [519, 26, 1.2, 0.2, 5.9, 1.9] };
test('A75 verified ⇒ source starts with an FDC or 平台 id; unverified ids say 近似/≈/CFCT/估算', () => {
  assert.deepEqual(ALL3.filter(f => f.verified && !/^(USDA FDC \d+|营养所查询平台 #\d+)/.test(f.source || '')).map(f => f.id), []);
  assert.deepEqual(ALL3.filter(f => !f.verified && /(FDC|#) ?\d+/.test(f.source || '') && !/近似|≈|CFCT|估算/.test(f.source)).map(f => f.id), []);
});
test('A75 each FDC id cited by at most one non-alias verified food', () => {
  const seen = {};
  for (const f of ALL3.filter(f => f.verified && !f.aliasOf)) { const m = (f.source || '').match(/^USDA FDC (\d+)/); if (m) { assert.ok(!seen[m[1]], `${m[1]}: ${seen[m[1]]} + ${f.id}`); seen[m[1]] = f.id; } }
});
test('A75 every 平台 food has a value pin', () => {
  const plat = ALL3.filter(f => f.verified && /平台 #\d+/.test(f.source));
  assert.deepEqual(plat.map(f => f.id).sort(), Object.keys(PLATFORM_PINS).sort());
  for (const f of plat) { const [n, ...v] = PLATFORM_PINS[f.id]; assert.match(f.source, new RegExp(`#${n}\\b`)); ['kcal', 'protein', 'fat', 'carbs', 'fiber'].forEach((k, i) => assert.ok(Math.abs(f[k] - v[i]) <= 0.5, `${f.id}.${k}`)); }
});
