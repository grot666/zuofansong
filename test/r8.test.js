import test from 'node:test';
import assert from 'node:assert/strict';
import { plateau, plateauAdvice } from '../js/core/review.js';
import { suggestFiber } from '../js/core/fiber.js';
import { addDays } from '../js/core/dates.js';
const T = '2026-10-15';
const A = Array.from({ length: 7 }, (_, i) => addDays('2026-10-02', i)), B = Array.from({ length: 7 }, (_, i) => addDays('2026-10-09', i));
const W = (a, b, na = 7, nb = 7) => [...A.slice(0, na).map(date => ({ date, weight: a })), ...B.slice(0, nb).map(date => ({ date, weight: b }))];
test('R8 plateau P1–P6', () => {
  assert.deepEqual([plateau(W(70.25, 70.1875), T).plateau, plateau(W(70.25, 70.1875), T).reason], [true, 'flat']);
  assert.equal(plateau(W(70.25, 70.125), T).plateau, false);
  assert.deepEqual([plateau(W(70, 70.25), T).plateau, plateau(W(70, 70.25), T).reason], [true, 'up']);
  assert.equal(plateau(W(70, 70, 7, 2), T).reason, 'sparse');
  assert.equal(plateau(W(70, 70, 4, 5), T).reason, 'sparse'); // 9 total
  assert.deepEqual([plateau(W(70.25, 70.1875, 7, 3), T).plateau, plateau(W(70.25, 70.1875, 7, 3), T).reason], [true, 'flat']);
  assert.equal(plateau(W(70, 70, 2, 7), T).reason, 'sparse');
  assert.equal(plateau(W(70, 70, 3, 7), T).plateau, true);
  // P6 edges: 10-01 excluded (would make A drop), 10-08 in A, 10-09 in B
  const e = [{ date: '2026-10-01', weight: 99 }, ...W(70.25, 70.1875)];
  assert.equal(plateau(e, T).reason, 'flat');
  const onlyEdge = [...W(70, 70, 2, 7), { date: '2026-10-08', weight: 70 }];
  assert.equal(plateau(onlyEdge, T).plateau, true);
});
test('R8 plateau P7–P9 advice', () => {
  const w = W(70.25, 70.1875);
  assert.deepEqual(plateauAdvice(w, T, { kcalOkDays: 3, logged: 7 }).actions, ['steps', 'keep']);
  assert.ok(plateauAdvice(w, T, { kcalOkDays: 6, logged: 7 }).actions.includes('minus'));
  assert.equal(plateauAdvice(w, T, { kcalOkDays: 6, logged: 7, reviews: { '2026-10-05': { decision: 'minus' } } }).show, false);
  assert.equal(plateauAdvice(w, T, { kcalOkDays: 6, logged: 7, reviews: { '2026-09-30': { decision: 'minus' } } }).show, true);
  assert.equal(plateauAdvice(w, T, { kcalOkDays: 6, logged: 7, breakState: { from: 20, until: '2026-10-10' } }).suppressed, 'break');
});
test('R8 N-04 fixtures F1–F8', () => {
  const ids = a => suggestFiber(a).map(s => s.id);
  assert.deepEqual(ids({ fiber: 15, kcal: 1782, kcalTarget: 1800, riceG: 400 }), ['sweetpot', 'spinach200', 'broc200']);
  assert.deepEqual(ids({ fiber: 10, kcal: 1200, kcalTarget: 1800, riceG: 0 }), ['spinach200', 'broc200', 'peas100']);
  assert.deepEqual(ids({ fiber: 12, kcal: 1880, kcalTarget: 1800, riceG: 200 }), ['sweetpot']);
  assert.deepEqual(ids({ fiber: 12, kcal: 1880, kcalTarget: 1800, riceG: 0 }), []);
  assert.deepEqual(ids({ fiber: 15, kcal: 1500, kcalTarget: 1800, riceG: 160 }), ['sweetpot', 'spinach200', 'broc200']);
  assert.deepEqual(ids({ fiber: 15, kcal: 1830, kcalTarget: 1800, riceG: 0 }), ['spinach200']);
  assert.deepEqual(ids({ fiber: 28, kcal: 1500, kcalTarget: 1800, riceG: 400 }), []);
  assert.deepEqual(ids({ fiber: 10, kcal: 1200, kcalTarget: 1800, riceG: 0, gutHigh: true }), ['spinach200', 'broc200', 'peas100', 'water']);
});
