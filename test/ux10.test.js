import test from 'node:test';
import assert from 'node:assert/strict';
import { onboardStep, saveOnboardStep } from '../js/core/profile.js';
import { readFileSync } from 'node:fs';
test('UX-10 onboardStep', () => {
  assert.equal(onboardStep({ storedProfile: null, onboardSeen: false }), 1);
  assert.equal(onboardStep({ storedProfile: null, onboardSeen: true }), 0);
  assert.equal(onboardStep({ storedProfile: { weight: 70 }, onboardSeen: false }), 0);
  assert.equal(onboardStep({ storedProfile: { weight: 70 }, onboardSeen: false, savedStep: 2 }), 2);
  assert.equal(onboardStep({ storedProfile: { weight: 70 }, onboardSeen: false, savedStep: 3 }), 3);
  for (const s of [null, 2, 3]) assert.equal(onboardStep({ storedProfile: null, onboardSeen: true, savedStep: s }), 0);
});
test('UX-10 step 1 saves only its edited keys', () => {
  const r = saveOnboardStep(null, 1, { sex: 'female', birth: '1995-01-01', height: '165', weight: '62', goalWeight: '50' });
  assert.equal(r.ok, true);
  assert.deepEqual(Object.keys(r.profile).sort(), ['birth', 'height', 'sex', 'weight']);
  assert.equal(saveOnboardStep(null, 1, { height: '', weight: '' }).ok, false);
});
test('UX-10 skip copy and button names', () => {
  const s = readFileSync('js/views/today.js', 'utf8');
  assert.match(s, /跳过，先看看/); assert.doesNotMatch(s, />去设置<|>先用示例</);
});
