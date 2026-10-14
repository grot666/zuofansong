import test from 'node:test';
import assert from 'node:assert/strict';
import { computeTargets, bmr, ACTIVITY } from '../js/core/targets.js';
import { blend } from '../js/core/grains.js';
const base = { sex: 'male', age: 29, weight: 74, height: 173.5, deficitPct: 20, proteinMode: 'bw', proteinPerKg: 1.6 };
test('A8 female BMR (Mifflin −161)', () => {
  assert.equal(bmr({ sex: 'female', weight: 60, height: 165, age: 30 }), 600 + 1031.25 - 150 - 161);
  assert.equal(bmr({ sex: 'male', weight: 60, height: 165, age: 30 }) - bmr({ sex: 'female', weight: 60, height: 165, age: 30 }), 166);
});
test('A8 TDEE per activity factor', () => {
  const B = bmr(base);
  for (const a of ACTIVITY) assert.equal(computeTargets({ ...base, activity: a.id }).tdee, Math.round(B * a.factor));
});
test('A8 warning when kcal < BMR', () => {
  assert.ok(computeTargets({ ...base, deficitPct: 30 }).warnings.some(w => w.includes('BMR')));
  assert.ok(!computeTargets({ ...base, activity: 'moderate', deficitPct: 10 }).warnings.some(w => w.includes('BMR')));
});
test('A8 BMI ≥30 uses goal weight for g/kg protein', () => {
  const t = computeTargets({ ...base, weight: 100, goalWeight: 80 });
  assert.ok(t.bmi >= 30); assert.equal(t.protein, Math.round(80 * 1.6));
  assert.equal(computeTargets({ ...base, goalWeight: 58 }).protein, Math.round(74 * 1.6));
});
test('A8 multi-grain blend needsSoak and waterRatio', () => {
  const rice = { id: 'rice', name: '大米', kcal: 360, protein: 7, fat: 1, carbs: 79, fiber: 0.6, yield: 2.3 };
  const brown = { id: 'brownRice', name: '糙米', kcal: 350, protein: 7.5, fat: 2.7, carbs: 73, fiber: 3.5, yield: 2.4, soak: true };
  const millet = { id: 'millet', name: '小米', kcal: 360, protein: 9, fat: 3, carbs: 73, fiber: 1.6, yield: 2.6 };
  const r = blend([{ food: rice, pct: 50 }, { food: brown, pct: 30 }, { food: millet, pct: 20 }]);
  assert.deepEqual(r.needsSoak, ['糙米']); assert.equal(r.waterRatio, 1.4);
  assert.equal(blend([{ food: rice, pct: 100 }]).waterRatio, 1.2);
  assert.deepEqual(blend([{ food: rice, pct: 100 }, { food: brown, pct: 0 }]).needsSoak, []);
});
