import test from 'node:test';
import assert from 'node:assert/strict';
import { FOODS } from '../data/foods.js';
import { FOODS2 } from '../data/foods2.js';
import { FOODS3 } from '../data/foods3.js';
import { RECIPES } from '../data/recipes.js';
import { makeIndex, totals, proteinPerYuan } from '../js/core/foods.js';
import { computeTargets } from '../js/core/targets.js';
import { DEFAULT_PROFILE, normalizeProfile } from '../js/core/profile.js';

const ALL = [...FOODS, ...FOODS2, ...FOODS3];
const food = makeIndex(ALL);
test('A10 unique food ids across files', () => {
  const ids = ALL.map(f => f.id); const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
  assert.deepEqual(dup, []); assert.ok(ALL.length >= 120);
});
test('A10 every food has source + verified flag + numeric macros', () => {
  for (const f of ALL) {
    assert.ok(f.source, f.id); assert.equal(typeof f.verified, 'boolean', f.id);
    for (const k of ['kcal', 'protein', 'fat', 'carbs', 'fiber']) assert.ok(Number.isFinite(f[k]) && f[k] >= 0, `${f.id}.${k}`);
  }
});
test('A10 kcal ≈ 4P+4C+9F within 15% (or ±10 kcal, or noted)', () => {
  const bad = ALL.filter(f => { const e = 4 * f.protein + 4 * f.carbs + 9 * f.fat; return Math.abs(e - f.kcal) > Math.max(10, 0.15 * f.kcal) && !f.kcalNote; }).map(f => f.id);
  assert.deepEqual(bad, []);
});
test('A10 every recipe ingredient exists', () => {
  for (const r of RECIPES) { assert.ok(r.items.length, r.id); for (const [id] of r.items) assert.ok(food(id), `${r.id}: ${id}`); }
});
test('A5 totals accepts both item shapes', () => {
  const a = totals([['eggUSDA', 100]], food), b = totals([{ id: 'eggUSDA', g: 100 }], food);
  assert.deepEqual(a, b); assert.equal(a.kcal, food('eggUSDA').kcal);
});
test('P2 protein per yuan', () => {
  assert.ok(Math.abs(proteinPerYuan({ protein: 12.6, priceCNYPer500g: 6 }) - 10.5) < 1e-9);
  assert.equal(proteinPerYuan({ protein: 10, priceCNYPer500g: 0 }), null);
});
test('A4 normalizeProfile({}) gives same targets as defaults', () => {
  assert.deepEqual(computeTargets(normalizeProfile({})), computeTargets(DEFAULT_PROFILE));
  assert.equal(normalizeProfile({ deficitPct: 'x' }).deficitPct, 20);
});
