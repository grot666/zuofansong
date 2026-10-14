import test from 'node:test';
import assert from 'node:assert/strict';
import { suggestFiber, SWAPS } from '../js/core/fiber.js';
import { ma7, weeklyStatus } from '../js/core/weight.js';
import { FOODS } from '../data/foods.js';
import { FOODS2 } from '../data/foods2.js';
import { FOODS3 } from '../data/foods3.js';

const all = [...FOODS, ...FOODS2, ...FOODS3];
test('>=120 foods, unique ids', () => { assert.ok(all.length >= 120, 'count ' + all.length); assert.equal(new Set(all.map(f => f.id)).size, all.length); });
test('swap add ids exist', () => { const ids = new Set(all.map(f => f.id)); for (const s of SWAPS) for (const [id] of s.add || []) assert.ok(ids.has(id), id); });
test('brown rice swap correction', () => { const s = SWAPS.find(x => x.id === 'brownhalf'); assert.equal(s.fiberGain, 2.4); assert.equal(s.kcalDelta, -14); });
test('fiber suggestions respect kcal room', () => { const s = suggestFiber({ fiber: 10, kcal: 1700, kcalTarget: 1700 }); assert.ok(s.length > 0); for (const x of s) assert.ok(x.kcalDelta <= 85); });
test('no suggestions when fiber met', () => { assert.equal(suggestFiber({ fiber: 30, kcal: 0, kcalTarget: 1700 }).length, 0); });
test('ma7 needs 3 points', () => { const m = ma7([{ date: '2026-10-01', weight: 74 }, { date: '2026-10-02', weight: 73.8 }, { date: '2026-10-03', weight: 73.6 }]); assert.equal(m[1].ma, null); assert.ok(Math.abs(m[2].ma - 73.8) < 1e-9); });
test('weekly status ok', () => { const e = []; for (let i = 0; i < 15; i++) e.push({ date: new Date(Date.UTC(2026, 9, 1 + i)).toISOString().slice(0, 10), weight: 74 - i * 0.06 }); const s = weeklyStatus(e); assert.equal(s.status, 'ok'); });
