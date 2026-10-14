import test from 'node:test';
import assert from 'node:assert/strict';
import { paceCheck, paceLine } from '../js/core/profile.js';
import { fastNote } from '../js/core/weight.js';
test('R-01 onboarding pace line shows kg/wk and %BW/wk; >1% flagged', () => {
  const ok = paceLine(paceCheck({ currentKg: 74, goalKg: 58, today: '2026-10-15', goalDate: '2027-07-31' }));
  assert.match(ok, /0\.4 kg\/周，0\.5% 体重\/周）$/);
  const fast = paceLine(paceCheck({ currentKg: 80, goalKg: 70, today: '2026-10-15', goalDate: '2026-12-15' }));
  assert.match(fast, /偏快/); assert.match(fast, /建议 ≤1%/);
  assert.equal(paceLine({ status: 'incomplete' }), '');
});
test('R-01 review warns only when measured loss > 1%/wk', () => {
  assert.match(fastNote({ status: 'fast', pct: 1.34 }), /1\.3% 体重/);
  assert.equal(fastNote({ status: 'ok', pct: 0.6 }), ''); assert.equal(fastNote(null), '');
});
