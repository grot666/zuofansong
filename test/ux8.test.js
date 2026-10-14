import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldShowUpdate } from '../js/boot.js';
test('UX-8 update toast once per version', () => {
  assert.equal(shouldShowUpdate({ newVersion: '0.8.4', updateSeen: null }), true);
  assert.equal(shouldShowUpdate({ newVersion: '0.8.4', updateSeen: '0.8.4' }), false);
  assert.equal(shouldShowUpdate({ newVersion: '0.8.5', updateSeen: '0.8.4' }), true);
  assert.equal(shouldShowUpdate({ newVersion: null, updateSeen: null }), false);
});
