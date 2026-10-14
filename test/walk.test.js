import test from 'node:test';
import assert from 'node:assert/strict';
import { suggestGoal } from '../js/core/profile.js';
test('walkthrough: onboarding goal suggestion ignores the demo goal for a heavier user', () => {
  assert.deepEqual(suggestGoal({ weight: 82, goalWeight: 58, goalDate: '2027-07-31' }, '2026-10-15'), { goalWeight: 76.5, goalDate: '2026-12-31' });
  assert.deepEqual(suggestGoal({ weight: 82, goalWeight: 75, goalDate: '2027-03-01' }, '2026-10-15'), { goalWeight: 75, goalDate: '2027-03-01' });
  assert.equal(suggestGoal({ weight: 60, goalWeight: 65, goalDate: '2027-03-01' }, '2026-10-15').goalWeight, 56);
});
