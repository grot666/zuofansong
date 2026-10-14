// Pure nutrition target math. No DOM.
export const ACTIVITY = [
  { id: 'sedentary', label: '久坐（办公室，几乎不运动）', factor: 1.2 },
  { id: 'light', label: '轻度（每周运动 1–3 次）', factor: 1.375 },
  { id: 'moderate', label: '中度（每周 3–5 次）', factor: 1.55 },
  { id: 'active', label: '高度（每周 6–7 次）', factor: 1.725 },
];

export function ageFrom(birth, today = new Date()) {
  const b = new Date(birth);
  let a = today.getFullYear() - b.getFullYear();
  const m = today.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < b.getDate())) a--;
  return a;
}

export function bmr({ sex, weight, height, age }) {
  return 10 * weight + 6.25 * height - 5 * age + (sex === 'female' ? -161 : 5);
}

export function bmi(weight, heightCm) {
  const m = heightCm / 100;
  return weight / (m * m);
}

export function computeTargets(p) {
  const age = p.age ?? ageFrom(p.birth);
  const B = bmr({ ...p, age });
  const act = ACTIVITY.find(a => a.id === p.activity) || ACTIVITY[0];
  const tdee = B * act.factor;
  const deficit = p.deficitPct ?? 20;
  const kcal = Math.round(tdee * (1 - deficit / 100));
  const BMI = bmi(p.weight, p.height);
  const proteinBase = BMI >= 30 && p.goalWeight ? p.goalWeight : p.weight;
  const proteinPerKg = Math.min(2.0, Math.max(1.2, p.proteinPerKg ?? 1.6));
  const protein = Math.round(proteinBase * proteinPerKg);
  const fatPct = Math.max(20, p.fatPct ?? 25);
  const fat = Math.round((kcal * fatPct) / 100 / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  const water = Math.round(p.weight * (p.usesPowder ? 35 : 30));
  const warnings = [];
  if (kcal < B) warnings.push('目标热量低于基础代谢（BMR），建议减小缺口。');
  return { age, bmr: Math.round(B), tdee: Math.round(tdee), kcal, protein, fat, carbs, fiber: 28, water, bmi: +BMI.toFixed(1), proteinBase, fatPct, warnings };
}

// Weekly loss rate check: entries [{date, weight}] sorted by date.
export function fastLossWarning(entries) {
  if (!entries || entries.length < 2) return null;
  const a = entries[0], b = entries[entries.length - 1];
  const days = (new Date(b.date) - new Date(a.date)) / 86400000;
  if (days < 7) return null;
  const perWeekPct = ((a.weight - b.weight) / a.weight) * 100 / (days / 7);
  return perWeekPct > 1 ? `近期每周减重约 ${perWeekPct.toFixed(1)}%，超过 1%/周，建议适当增加热量。` : null;
}
