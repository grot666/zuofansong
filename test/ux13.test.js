import test from 'node:test';
import assert from 'node:assert/strict';
import { proteinFill } from '../js/core/protein.js';
test('UX-13 eggs ≤3, every other item ≤1 serving', () => {
  for (const g of [5, 10, 30, 60, 90, 200]) for (const x of proteinFill(g).items) assert.ok(x.id === 'egg' ? x.n <= 3 : x.n === 1);
});
test('UX-13 small gap → single suggestion; huge gap → tomorrow note', () => {
  assert.equal(proteinFill(10).items.length, 1); assert.equal(proteinFill(10).text, '2 个鸡蛋');
  assert.equal(proteinFill(0).items.length, 0);
  assert.match(proteinFill(200).text, /明天/);
  assert.equal(proteinFill(60).rest, 0);
});
