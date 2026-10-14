import test from 'node:test';
import assert from 'node:assert/strict';
import { fatWallet } from '../js/core/fat.js';
import { gutRisk } from '../js/core/protein.js';
import { shoppingList } from '../js/core/plan.js';
import { weekReview, plateau, lastNDates } from '../js/core/review.js';
import { normalizeProfile } from '../js/core/profile.js';
import { KNOWN_KEYS } from '../js/core/store.js';
import { readFileSync } from 'node:fs';
const food = id => ({ rice: { id: 'rice', name: '大米', cat: '主食', kcal: 346, protein: 7.4, fat: 0.8, carbs: 77.9, fiber: 0.7, priceCNYPer500g: 3 }, riceCooked: { id: 'riceCooked', kcal: 116, protein: 2.6, fat: 0.3, carbs: 25.9, fiber: 0.3 }, lard: { id: 'lard', kcal: 900, protein: 0, fat: 100, carbs: 0, fiber: 0, fatClass: 'low' }, oil: { id: 'oil', kcal: 899, protein: 0, fat: 99.9, carbs: 0, fiber: 0, fatClass: 'high' } }[id]);
test('A8 fatWallet over budget → negative left', () => {
  const w = fatWallet(50, [{ fat: 40, fatClass: 'low' }, { fat: 15, fatClass: 'high' }]);
  assert.equal(w.spent, 55); assert.equal(w.left, -5); assert.equal(w.low, 40); assert.equal(w.high, 15);
});
test('A8 gutRisk low case + monotonic non-increasing in fiber', () => {
  assert.equal(gutRisk({ fiber: 30, water: 2400, weight: 70, vegServings: 4, trainingDays: 3 }).level, 'low');
  let prev = Infinity;
  for (let f = 0; f <= 40; f += 2) { const s = gutRisk({ fiber: f, water: 1000, weight: 70 }).score; assert.ok(s <= prev); prev = s; }
});
test('A8 shoppingList rice raw = cooked / 2.3 exactly', () => {
  const l = shoppingList([{ meals: [{ items: [['riceCooked', 230]] }, { items: [['riceCooked', 460]] }] }], food);
  assert.equal(l.length, 1); assert.equal(l[0].id, 'rice'); assert.equal(l[0].g, 300);
});
test('A8 weekReview ±10% kcal boundary and lowFatPct', () => {
  const g = kcal => [{ id: 'oil', g: kcal / 8.99 }];
  const logs = { '2026-10-14': { items: g(1870) }, '2026-10-15': { items: g(1871) }, '2026-10-13': { items: [{ id: 'lard', g: 30 }, { id: 'oil', g: 10 }] } };
  const r = weekReview(['2026-10-13', '2026-10-14', '2026-10-15'], logs, food, { kcal: 1700, protein: 0 });
  assert.equal(r.kcalOkDays, 1); // 1870 = +10% inclusive, 1871 out, 297 kcal day out
  const only = weekReview(['2026-10-13'], logs, food, { kcal: 1700, protein: 0 });
  assert.ok(Math.abs(only.lowFatPct - 30 / (30 + 9.99) * 100) < 1e-9);
});
test('A8 plateau trend up label + flat', () => {
  const ds = lastNDates('2026-10-15', 14);
  assert.equal(plateau(ds.map((date, i) => ({ date, weight: 72 + (i >= 7 ? 0.5 : 0) })), '2026-10-15').trend, 'up');
  assert.equal(plateau(ds.map(date => ({ date, weight: 72 })), '2026-10-15').trend, 'flat');
});
test('A8 lastNDates window across month/year end', () => {
  assert.deepEqual(lastNDates('2026-11-02', 3), ['2026-10-31', '2026-11-01', '2026-11-02']);
  assert.deepEqual(lastNDates('2027-01-01', 2), ['2026-12-31', '2027-01-01']);
  assert.deepEqual(lastNDates('2028-03-01', 2), ['2028-02-29', '2028-03-01']);
  assert.equal(lastNDates('2026-10-15').length, 7);
});
test('A8 normalizeProfile clamps and coerces', () => {
  const p = normalizeProfile({ fatPct: 10, weight: '73.5', deficitPct: 50, proteinPerKg: '3' });
  assert.equal(p.fatPct, 20); assert.equal(p.weight, 73.5); assert.equal(p.deficitPct, 30); assert.equal(p.proteinPerKg, 2.0);
});
test('A8 sleepNoteDay is moot: not a known key and never written', () => {
  assert.ok(!KNOWN_KEYS.includes('sleepNoteDay'));
  for (const f of ['js/core/sleep.js', 'js/views/today.js', 'js/core/store.js']) assert.doesNotMatch(readFileSync(f, 'utf8'), /sleepNoteDay/);
});
