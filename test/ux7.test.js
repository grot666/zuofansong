import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { todayIndex } from '../js/core/dates.js';
test('UX-7 plan anchors and collapsed days', () => {
  const s = readFileSync('js/plan-page.js', 'utf8');
  for (const id of ['menu', 'list', 'prep']) { assert.ok(s.includes(`href="#${id}"`)); assert.ok(s.includes(`id="${id}"`)); }
  assert.match(s, /<details class="card day"\$\{i === ti \? ' open' : ''\}>/);
});
test('UX-7 todayIndex Mon=0..Sun=6', () => {
  assert.equal(todayIndex('2026-10-12'), 0); assert.equal(todayIndex('2026-10-15'), 3); assert.equal(todayIndex('2026-10-18'), 6);
});
