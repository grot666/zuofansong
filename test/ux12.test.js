import test from 'node:test';
import assert from 'node:assert/strict';
import { quickChips, CURATED_CHIPS } from '../js/core/foods.js';
test('UX-12 quickChips', () => {
  assert.deepEqual(quickChips([], {}), CURATED_CHIPS);
  const r = quickChips(['a', 'b', 'a'], { c: 5, b: 9, d: 1 });
  assert.deepEqual(r.slice(0, 4), ['a', 'b', 'c', 'd']); assert.equal(r.length, 8);
  const many = quickChips([...'abcdefghij'], Object.fromEntries([...'klmnopqrstu'].map((k, i) => [k, i])));
  assert.ok(many.length <= 16 && new Set(many).size === many.length); assert.deepEqual(many.slice(0, 8), [...'abcdefgh']);
  assert.deepEqual(quickChips(['zz'], {}, id => id !== 'zz'), CURATED_CHIPS.filter(id => id !== 'zz'));
});
