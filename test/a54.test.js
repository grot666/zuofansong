import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { SWAPS, SWAP_DEFS, FIBER_TARGET, PEAS_SIDE_G } from '../js/core/fiber.js';
import { FIBER_MIN, FIBER_SIDE, fiberNote } from '../js/core/plan.js';
import { makeIndex, totals } from '../js/core/foods.js';
import { FOODS } from '../data/foods.js'; import { FOODS2 } from '../data/foods2.js'; import { FOODS3 } from '../data/foods3.js';
const food = makeIndex(FOODS, FOODS2, FOODS3);
test('A54 swap numbers are computed from food data', () => {
  assert.equal(SWAPS.length, SWAP_DEFS.length);
  for (const s of SWAPS) {
    const f = s.add ? totals(s.add, food).fiber : totals([[s.replace.to, s.replace.g]], food).fiber - totals([[s.replace.from, s.replace.g]], food).fiber;
    assert.ok(Math.abs(s.fiberGain - f) <= 0.1, s.id);
  }
});
test('A54 one fiber target: plan floor, side grams, note text share core/fiber.js', () => {
  assert.equal(FIBER_MIN, FIBER_TARGET.min); assert.deepEqual(FIBER_SIDE, [['peas', PEAS_SIDE_G]]);
  assert.ok(fiberNote(20).includes(`${FIBER_TARGET.min}–${FIBER_TARGET.max}`));
});
test('A54 grep: no literal 25/28/30 fiber targets outside core/fiber.js', () => {
  const files = []; const walk = d => { for (const f of readdirSync(d)) { const p = d + '/' + f; statSync(p).isDirectory() ? walk(p) : p.endsWith('.js') && files.push(p); } };
  walk(new URL('../js', import.meta.url).pathname);
  const bad = /(fiber|纤维)[^;,]{0,20}?(<|>=?|\/|目标)\s*2[58]\b|(fiber|纤维).{0,25}\b2[58]\s*[–-]\s*30\b|fiber:\s*2[58]\b/i;
  for (const p of files.filter(p => !/core\/(fiber|version)\.js$/.test(p))) readFileSync(p, 'utf8').split('\n').forEach((l, i) => assert.ok(!bad.test(l), `${p}:${i + 1} ${l.trim().slice(0, 80)}`));
});
