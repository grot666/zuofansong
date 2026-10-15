import test from 'node:test';
import assert from 'node:assert/strict';
import { preAllocate, nextDayTargets, socialCopy, NEXT_DAY_LINE, BANNED_WORDS, HOTPOT_PROTEIN, HOTPOT_LOW, DIPS, SOCIAL_TYPES, MIN_OIL_G } from '../js/core/social.js';
const T = { kcal: 1800, protein: 140, fat: 50 };
test('R11-5/A65 preAllocate without a planned day gives no number', () => {
  const r = preAllocate(T, { meal: 'dinner' });
  assert.equal(r.reserveFatG, null); assert.deepEqual(r.levers, []); assert.equal(r.kcal, T.kcal); assert.ok(MIN_OIL_G >= 5);
  assert.throws(() => preAllocate(T, { meal: 'snack' }));
});
test('R11-5 next day = normal targets', () => assert.deepEqual(nextDayTargets(T), T));
test('R11-5 copy is neutral: no banned words anywhere', () => {
  const all = [NEXT_DAY_LINE, ...Object.keys(SOCIAL_TYPES).flatMap(t => ['dinner', 'lunch'].flatMap(m => [12, null, 0].flatMap(r => Object.values(socialCopy(t, m, r, 80)))))].join('\n');
  for (const w of BANNED_WORDS) assert.ok(!all.includes(w), w);
  assert.match(all, /≈/); assert.match(all, /无法精确估算/);
});
test('R11-5 hotpot data cite 平台 ids (FDC proxy marked) and protein-first order', () => {
  for (const x of [...HOTPOT_PROTEIN, ...HOTPOT_LOW]) assert.match(x.src, /平台 #\d+|FDC \d+/);
  const d = x => x.protein / x.kcal; assert.ok(Math.min(...HOTPOT_PROTEIN.map(d)) > Math.max(...HOTPOT_LOW.map(d)));
  assert.deepEqual(DIPS.map(x => x.fat), [10, 10.5]);
});
