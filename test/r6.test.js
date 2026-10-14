import test from 'node:test';
import assert from 'node:assert/strict';
import { paceCheck, normalizeProfile } from '../js/core/profile.js';
import { dinnerDeadline, caffeineCutoff, sleepNotes } from '../js/core/sleep.js';
import { applyBudget, planWeek, generateWeek, selectWeek } from '../js/core/plan.js';
import { startBreak, resolveBreak } from '../js/core/breaks.js';
import { MULTS, scaleItems } from '../js/core/portion.js';
import { FOODS } from '../data/foods.js';
import { FOODS2 } from '../data/foods2.js';
import { FOODS3 } from '../data/foods3.js';
import { RECIPES } from '../data/recipes.js';

const near = (a, b, eps = 1e-3) => assert.ok(Math.abs(a - b) <= eps, `${a} vs ${b}`);
const T = '2026-10-15';
test('R6.1 pace fixtures A–G', () => {
  let r = paceCheck({ currentKg: 74, goalKg: 58, today: T, goalDate: '2027-07-31' });
  assert.equal(r.status, 'ok'); assert.equal(r.days, 289); near(r.kgPerWeek, 0.3875); near(r.pctPerWeek, 0.5237);
  r = paceCheck({ currentKg: 74, goalKg: 58, today: T, goalDate: '2027-01-31' });
  assert.equal(r.status, 'fast'); assert.equal(r.days, 108); near(r.kgPerWeek, 1.0370); near(r.pctPerWeek, 1.4014);
  r = paceCheck({ currentKg: 74, goalKg: 72, today: T, goalDate: '2027-07-31' });
  assert.equal(r.status, 'slow'); near(r.kgPerWeek, 0.0484); near(r.pctPerWeek, 0.0655);
  assert.equal(paceCheck({ currentKg: 74, goalKg: 58, today: T, goalDate: T }).status, 'invalid-date');
  assert.equal(paceCheck({ currentKg: 74, goalKg: 74, today: T, goalDate: '2027-07-31' }).status, 'reached');
  assert.equal(paceCheck({ currentKg: 74, goalKg: 78, today: T, goalDate: '2027-07-31' }).status, 'gain');
  r = paceCheck({ currentKg: 66, goalKg: 58, today: '2027-03-01', goalDate: '2027-07-31' });
  assert.equal(r.status, 'ok'); assert.equal(r.days, 152); near(r.kgPerWeek, 0.3684); near(r.pctPerWeek, 0.5582);
  assert.equal(paceCheck({ currentKg: 74, goalKg: 0, today: T, goalDate: '' }).status, 'incomplete');
});
test('R6.2 deadlines wrap midnight', () => {
  for (const [b, g, d, c] of [['23:30', 3, '20:30', '17:30'], ['01:00', 3, '22:00', '19:00'], ['22:00', 2, '20:00', '16:00'], ['00:00', 3, '21:00', '18:00']]) {
    assert.equal(dinnerDeadline(b, g), d); assert.equal(caffeineCutoff(b, 6), c);
  }
});
test('R6.2 notes', () => {
  const p = normalizeProfile({});
  assert.equal(sleepNotes([{ id: 'coffee', time: '17:29', kcal: 2 }], p).lateCaffeine, null);
  assert.ok(sleepNotes([{ id: 'coffee', time: '17:31', kcal: 2 }], p).lateCaffeine);
  assert.ok(sleepNotes([{ id: 'x', time: '21:00', kcal: 300 }], p).lateMeal);
  assert.equal(sleepNotes([{ id: 'x', time: '21:00', kcal: 299 }], p).lateMeal, null);
  assert.equal(sleepNotes([{ id: 'x', time: '12:00', kcal: 900 }], p).lateMeal, null);
  assert.equal(sleepNotes([{ id: 'coffee', time: '21:00', kcal: 2 }], { ...p, sleepNudges: false }).lateCaffeine, null);
  const late = { ...p, bedtime: '01:00' };
  assert.ok(sleepNotes([{ id: 'x', time: '00:30', kcal: 400 }], late).lateMeal);
});
test('R6.3 budget fixture', () => {
  const P = { tuna: [19.4, 30], pork: [21.0, 18], thigh: [19.7, 15], egg: [12.6, 6], tofu: [17.3, 4] };
  const slotCost = id => 100 / (P[id][0] / 100) * P[id][1] / 500;
  const run = budget => applyBudget({ slots: Array(7).fill('tuna'), options: Object.keys(P), slotCost, fixed: 100, budget });
  const count = s => s.reduce((m, x) => ({ ...m, [x]: (m[x] || 0) + 1 }), {});
  let r = run(400); assert.equal(r.swaps, 0); near(r.cost, 316.50, 0.05); assert.equal(r.overBudget, false);
  r = run(200); assert.equal(r.swaps, 5); near(r.cost, 194.78, 0.05); assert.deepEqual(count(r.slots), { tofu: 3, egg: 2, tuna: 2 }); assert.equal(r.overBudget, false);
  r = run(150); assert.equal(r.swaps, 7); near(r.cost, 157.67, 0.05); assert.deepEqual(count(r.slots), { tofu: 3, egg: 3, thigh: 1 }); assert.equal(r.overBudget, true);
  [290.19, 263.89, 237.58, 216.18, 194.78, 173.37, 157.67].forEach((c, i) => near(r.steps[i], c, 0.05));
});
const all = [...FOODS, ...FOODS2, ...FOODS3]; const food = id => all.find(f => f.id === id);
test('A9 split equals generateWeek; dinner(d) == lunch(d+1)', () => {
  const sk = selectWeek(food, RECIPES, { seed: 2 });
  for (let d = 0; d < 7; d++) assert.equal(sk[(d + 1) % 7].pLunch, sk[d].pDinner);
  const w = generateWeek({ kcal: 1800, protein: 140 }, food, RECIPES, { seed: 2 });
  assert.equal(w.length, 7);
});
test('A9 planWeek reduces cost under tight budget and keeps protein', () => {
  const t = { kcal: 1800, protein: 140 };
  const free = planWeek(t, food, RECIPES, { seed: 0 });
  const tight = planWeek(t, food, RECIPES, { seed: 0, budget: free.cost * 0.85 });
  assert.ok(tight.cost <= free.cost);
  assert.ok(tight.swaps > 0);
  for (const d of tight.week) assert.ok(d.tot.protein >= 139.5);
  for (let d = 0; d < 6; d++) assert.equal(tight.week[d + 1].meals[1].items[1][0], tight.week[d].dinnerProtein);
});
test('A12 break resolves after until', () => {
  const s = startBreak({ deficitPct: 20 }, '2026-10-15');
  assert.deepEqual(s.breakState, { from: 20, until: '2026-10-21' }); assert.equal(s.profile.deficitPct, 0);
  assert.equal(resolveBreak(s.profile, s.breakState, '2026-10-21').restored, false);
  const r = resolveBreak(s.profile, s.breakState, '2026-10-22');
  assert.equal(r.restored, true); assert.equal(r.profile.deficitPct, 20); assert.equal(r.breakState, null);
  assert.equal(resolveBreak({ deficitPct: 15 }, null, '2026-10-22').profile.deficitPct, 15);
});
test('N-03 portion chips', () => {
  assert.deepEqual(MULTS, [0.5, 1, 1.5]);
  assert.deepEqual(scaleItems([['egg', 100], ['rice', 150]], 0.5), [['egg', 50], ['rice', 75]]);
  assert.deepEqual(scaleItems([['egg', 100]], 1.5), [['egg', 150]]);
  assert.deepEqual(scaleItems([['egg', 100]], 7), [['egg', 100]]);
});
import { mergeProfileEdit } from '../js/core/profile.js';
test('A21 mergeProfileEdit does not freeze defaults', () => {
  assert.deepEqual(Object.keys(mergeProfileEdit({}, { weight: '73' })), ['weight']);
  assert.deepEqual(mergeProfileEdit({ bedtime: '23:00' }, { evil: 1, weight: 'x', usesPowder: 'on' }), { bedtime: '23:00', usesPowder: true });
});
import { localDate, addDays } from '../js/core/dates.js';
test('A22 dates', () => {
  assert.equal(addDays('2026-10-31', 1), '2026-11-01'); assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2028-02-28', 1), '2028-02-29'); assert.equal(addDays('2026-10-15', -15), '2026-09-30');
  assert.equal(localDate(new Date(2026, 9, 15, 23, 59)), '2026-10-15'); assert.equal(localDate(new Date(2026, 9, 16, 0, 1)), '2026-10-16');
});
import { parseProfileForm } from '../js/core/profile.js';
test('UX-2 parseProfileForm', () => {
  assert.deepEqual(parseProfileForm({ bodyFatPct: '' }, { bodyFatPct: 20 }), { edits: {}, errors: [] });
  assert.deepEqual(parseProfileForm({ goalWeight: '' }, { goalWeight: 60 }).edits, {});
  assert.ok(parseProfileForm({ weight: '0' }, {}).errors.length);
  assert.equal(parseProfileForm({ height: '175.5' }, {}).edits.height, 175.5);
  assert.equal(parseProfileForm({ sex: 'female', evil: 1 }, {}).edits.sex, 'female');
  assert.equal(parseProfileForm({ evil: 1 }, {}).edits.evil, undefined);
});
