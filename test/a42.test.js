import test from 'node:test';
import assert from 'node:assert/strict';
import { canDeepen, DEEPEN_COPY } from '../js/core/targets.js';
import { startBreak } from '../js/core/breaks.js';
const p = { sex: 'male', birth: '1990-03-01', height: 176, weight: 84, activity: 'light', deficitPct: 15 };
test('A42 canDeepen reasons', () => {
  assert.deepEqual(canDeepen(p), { ok: true, reason: null });
  assert.equal(canDeepen({}).reason, 'bmr-unknown');
  assert.equal(canDeepen({ ...p, birth: undefined, height: undefined }).reason, 'bmr-unknown');
  assert.equal(canDeepen({ ...p, deficitPct: 30 }).reason, 'cap');
  assert.equal(canDeepen({ ...p, activity: 'sedentary', deficitPct: 20 }).reason, 'below-bmr');
  for (const r of ['bmr-unknown', 'on-break', 'cap', 'below-bmr']) assert.ok(DEEPEN_COPY[r]);
  assert.match(DEEPEN_COPY['bmr-unknown'], /出生日期和身高/);
});
test('A42 break then minus within the break → not offered; after the break → offered again', () => {
  const r = startBreak(p, '2026-10-15');
  assert.equal(canDeepen(r.profile, { breakState: r.breakState, today: '2026-10-18' }).reason, 'on-break');
  assert.equal(canDeepen(p, { breakState: r.breakState, today: '2026-10-30' }).ok, true);
});
