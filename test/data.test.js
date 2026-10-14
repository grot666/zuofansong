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
import { priceOverrides } from '../js/core/foods.js';
test('price override merges over base food', () => {
  const f = makeIndex({ base: [ALL], partials: [priceOverrides({ eggUSDA: 9, bogus: 0, ghost: 5 })] });
  assert.equal(f('eggUSDA').priceCNYPer500g, 9); assert.equal(f('eggUSDA').protein, food('eggUSDA').protein); assert.ok(f('eggUSDA').priceUser);
  assert.equal(f.all().length, ALL.length);
});
import { matchFoods, gramsFor } from '../js/core/foods.js';
test('UX-3 matchFoods / gramsFor', () => {
  const m = matchFoods('鸡腿', ALL); assert.ok(m.length > 0 && m[0].name.includes('鸡腿'), m[0] && m[0].name);
  assert.ok(matchFoods('jidan', ALL).some(f => f.name.includes('蛋')));
  assert.deepEqual(matchFoods('zzzz不存在', ALL), []);
  assert.equal(gramsFor({ name: 'x' }, 1, 'unit'), null);
  assert.equal(gramsFor({ unit: { g: 50 } }, 2, 'unit'), 100);
  assert.equal(gramsFor({}, 120, 'g'), 120);
});
import { PRICE_REFS } from '../data/prices.js';
test('R7.3 protein per yuan fixtures + refs merge', () => {
  for (const [P, price, exp] of [[21.0, 17.55, 5.983], [12.6, 5.91, 10.660], [7.13, 3.00, 11.883], [20.1, 23.00, 4.370]]) assert.ok(Math.abs(proteinPerYuan({ protein: P, priceCNYPer500g: price }) - exp) < 1e-3);
  const f = makeIndex({ base: [ALL], partials: [PRICE_REFS, priceOverrides({ egg: 7 })] });
  assert.equal(f('porkLoin').priceCNYPer500g, 17.55); assert.ok(f('porkLoin').priceSource);
  assert.equal(f('egg').priceCNYPer500g, 7); assert.equal(f.all().length, ALL.length);
});
test('N-07 kiwi FDC 168153', () => {
  const k = food('kiwiUSDA'); assert.equal(k.source, 'USDA FDC 168153'); assert.equal(k.verified, true);
  assert.deepEqual([k.kcal, k.protein, k.fat, k.fiber], [61, 1.14, 0.52, 3.0]); assert.ok(Math.abs(k.carbs - 14.7) < 0.05);
});
test('R-08b 15 g olive oil = 132.6 kcal / 15 g fat, counted as oil', () => {
  const t = totals([['oliveOil', 15]], food); assert.ok(Math.abs(t.kcal - 132.6) < 0.05); assert.equal(t.fat, 15); assert.equal(t.oil, 15);
});
test('N-05 takeaway dishes carry type/defaultPortionG/portionNote, unverified', () => {
  const dishes = ALL.filter(f => f.type === 'dish');
  assert.ok(dishes.length >= 20);
  for (const d of dishes) { assert.equal(d.verified, false); assert.ok(d.defaultPortionG > 0 && d.portionNote, d.id); }
});
