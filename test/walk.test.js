import test from 'node:test';
import assert from 'node:assert/strict';
import { suggestGoal } from '../js/core/profile.js';
test('walkthrough: onboarding goal suggestion ignores the demo goal for a heavier user', () => {
  assert.deepEqual(suggestGoal({ weight: 82, goalWeight: 58, goalDate: '2027-07-31' }, '2026-10-15'), { goalWeight: 76.5, goalDate: '2026-12-31' });
  assert.deepEqual(suggestGoal({ weight: 82, goalWeight: 75, goalDate: '2027-03-01' }, '2026-10-15'), { goalWeight: 75, goalDate: '2027-03-01' });
  assert.equal(suggestGoal({ weight: 60, goalWeight: 65, goalDate: '2027-03-01' }, '2026-10-15').goalWeight, 56);
});
import { canDeepen, computeTargets } from '../js/core/targets.js';
test('walkthrough 2: no "deficit +5%" below BMR or past 30%', () => {
  const p = { sex: 'male', birth: '1990-03-01', height: 176, weight: 84, activity: 'sedentary' };
  for (const d of [10, 15, 20, 25, 30]) { const ok = canDeepen({ ...p, deficitPct: d }).ok; const t = computeTargets({ ...p, deficitPct: d + 5 }); assert.equal(ok, d + 5 <= 30 && t.kcal >= t.bmr, String(d)); }
  assert.equal(canDeepen({ ...p, deficitPct: 30 }).ok, false);
});
