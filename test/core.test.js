import test from 'node:test';
import assert from 'node:assert/strict';
import { bmr, computeTargets, ageFrom } from '../js/core/targets.js';
import { blend } from '../js/core/grains.js';
import { fatWallet } from '../js/core/fat.js';
import { proteinGap, gutRisk } from '../js/core/protein.js';

test('bmr male', () => { assert.equal(Math.round(bmr({ sex: 'male', weight: 74, height: 173.5, age: 29 })), 1684); });
test('age', () => { assert.equal(ageFrom('1997-07-31', new Date('2026-10-15')), 29); });
test('targets', () => { const t = computeTargets({ sex: 'male', birth: '1997-07-31', age: 29, height: 173.5, weight: 74, activity: 'sedentary' }); assert.equal(t.protein, 118); assert.ok(t.fatPct >= 20); assert.ok(t.kcal < t.tdee); });
test('blend yield', () => { const b = blend([{ food: { id: 'rice', kcal: 346, protein: 7, fat: 1, carbs: 78, fiber: 1, yield: 2.3 }, pct: 100 }]); assert.ok(Math.abs(b.cooked.kcal - 346 / 2.3) < 0.01); });
test('fat wallet', () => { const w = fatWallet(45, [{ fat: 10, fatClass: 'high' }, { fat: 5, fatClass: 'low' }]); assert.equal(w.left, 30); assert.equal(w.low, 5); });
test('protein gap cap', () => { const g = proteinGap(120, 40, 24, 2); assert.equal(g.scoops, 2); assert.equal(g.left, 32); });
test('gut risk high', () => { assert.equal(gutRisk({ fiber: 5, water: 500, weight: 74, powderShare: 0.5 }).level, 'high'); });
