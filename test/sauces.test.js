import test from 'node:test';
import assert from 'node:assert/strict';
import { SAUCES } from '../data/sauces.js';
import { sauceNutrition, rotateSauces } from '../js/core/sauces.js';
test('R-11b sauce kcal/fat computed from FDC', () => {
  const exp = { s1: [30.2, 2.11], s2: [19.2, 0.10], s3: [44.8, 0.31], s4: [24.7, 0.11], s5: [57.6, 4.17], s6: [27.6, 0.05] };
  for (const s of SAUCES) { const n = sauceNutrition(s); assert.ok(Math.abs(n.kcal - exp[s.id][0]) <= 0.1, s.id + ' kcal ' + n.kcal); assert.ok(Math.abs(n.fat - exp[s.id][1]) <= 0.1, s.id + ' fat ' + n.fat); }
});
test('R-11b rotation fixtures', () => {
  const ids = r => r.out.map(s => s.id).join(' ');
  assert.equal(ids(rotateSauces(SAUCES, 7)), 's1 s2 s3 s4 s5 s6 s1');
  assert.equal(ids(rotateSauces(SAUCES.filter(s => s.id !== 's5'), 7)), 's1 s2 s3 s4 s6 s1 s2');
  const one = rotateSauces(SAUCES.filter(s => s.id === 's1'), 7); assert.equal(ids(one), Array(7).fill('s1').join(' ')); assert.equal(one.repeatWarning, true);
  const two = rotateSauces([SAUCES[0], { ...SAUCES[1], family: '咸鲜' }, SAUCES[2]], 7).out;
  for (let i = 1; i < two.length; i++) assert.notEqual(two[i].family, two[i - 1].family);
});
