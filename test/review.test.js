import test from 'node:test';
import assert from 'node:assert/strict';
import { weekReview, plateau, lastNDates, dayTotals } from '../js/core/review.js';
import { FOODS } from '../data/foods.js';
import { FOODS2 } from '../data/foods2.js';
import { FOODS3 } from '../data/foods3.js';

const all = [...FOODS, ...FOODS2, ...FOODS3];
const food = id => all.find(f => f.id === id);

test('lastNDates', () => { assert.deepEqual(lastNDates('2026-10-15', 3), ['2026-10-13', '2026-10-14', '2026-10-15']); });
test('oil total and kcal', () => { const t = dayTotals([{ id: 'oliveOil', g: 15 }], food); assert.equal(t.oil, 15); assert.ok(Math.abs(t.kcal - 132.6) < 0.01); });
test('takeaway 500 g huangmenji = 835 kcal', () => { assert.equal(Math.round(dayTotals([{ id: 'huangmenji', g: 500 }], food).kcal), 835); });
test('tuna counter', () => {
  const dates = lastNDates('2026-10-15');
  const logs = Object.fromEntries(dates.map(d => [d, { items: [{ id: 'tunaLight', g: 100 }, { id: 'riceCooked', g: 300 }], water: 2000 }]));
  const r = weekReview(dates, logs, food, { kcal: 1700, protein: 140 });
  assert.equal(r.logged, 7); assert.equal(r.tuna.light, 700); assert.equal(r.tunaNotes.length, 1); assert.equal(r.avgWater, 2000);
});
test('missing days are not failures', () => { const r = weekReview(lastNDates('2026-10-15'), {}, food, { kcal: 1700, protein: 140 }); assert.equal(r.logged, 0); assert.equal(r.avgKcal, null); });
test('plateau needs dense data', () => {
  const w = []; for (let i = 0; i < 14; i++) w.push({ date: lastNDates('2026-10-15', 14)[i], weight: 72 });
  assert.equal(plateau(w, '2026-10-15').plateau, true);
  assert.equal(plateau(w.filter((_, i) => i % 3 === 0), '2026-10-15').plateau, false);
  const down = w.map((x, i) => ({ ...x, weight: 72 - i * 0.07 }));
  assert.equal(plateau(down, '2026-10-15').plateau, false);
  const fourInWeek1 = w.filter((_, i) => i >= 3); // week1 has 4 logs, week2 has 7
  assert.equal(plateau(fourInWeek1, '2026-10-15').plateau, false);
  const fiveEach = w.filter((_, i) => ![0, 7].includes(i) && i !== 1 && i !== 8);
  assert.equal(plateau(fiveEach, '2026-10-15').plateau, true);
});
