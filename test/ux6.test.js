import test from 'node:test';
import assert from 'node:assert/strict';
import { saveProfile } from '../js/core/profile.js';
test('UX-6 saveProfile ok + changed keys', () => {
  const r = saveProfile({ weight: 74 }, { weight: '72', height: '173.5' }, { usesPowder: false });
  assert.equal(r.ok, true); assert.ok(r.changed.includes('weight')); assert.equal(r.profile.weight, 72);
});
test('UX-6 validation failure → not ok, nothing to save', () => {
  const r = saveProfile({}, { weight: 'abc' });
  assert.equal(r.ok, false); assert.ok(r.errors.length);
});
test('UX-6 unchanged save → changed empty', () => {
  assert.deepEqual(saveProfile({ weight: 74 }, { weight: '74' }).changed, []);
});
