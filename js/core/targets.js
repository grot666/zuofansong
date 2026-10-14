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

// proteinMode: 'bw' (g/kg body weight, default), 'ffm' (g/kg fat-free mass, needs bodyFatPct), 'fixed' (proteinTarget g)
export function proteinTargetFor(p, BMI) {
  const mode = p.proteinMode || 'bw';
  if (mode === 'fixed' && p.proteinTarget > 0) return { protein: Math.round(p.proteinTarget), basis: `自定 ${Math.round(p.proteinTarget)} g` };
  if (mode === 'ffm' && p.bodyFatPct > 0) {
    const ffm = p.weight * (1 - p.bodyFatPct / 100);
    const perKg = Math.min(3.1, Math.max(1.6, p.proteinPerFfm ?? 2.5));
    return { protein: Math.round(ffm * perKg), basis: `去脂体重 ${ffm.toFixed(1)} kg × ${perKg} g/kg` };
  }
  const base = BMI >= 30 && p.goalWeight ? p.goalWeight : p.weight;
  const perKg = Math.min(2.0, Math.max(1.2, p.proteinPerKg ?? 1.6));
  return { protein: Math.round(base * perKg), basis: `${base} kg × ${perKg} g/kg${BMI >= 30 ? '（BMI≥30 按目标体重）' : ''}` };
}

export function computeTargets(p) {
  const age = p.age ?? ageFrom(p.birth);
  const B = bmr({ ...p, age });
  const act = ACTIVITY.find(a => a.id === p.activity) || ACTIVITY[0];
  const tdee = B * act.factor;
  const deficit = p.deficitPct ?? 20;
  const kcal = Math.round(tdee * (1 - deficit / 100));
  const BMI = bmi(p.weight, p.height);
  const { protein, basis: proteinBasis } = proteinTargetFor(p, BMI);
  const fatPct = Math.max(20, p.fatPct ?? 25);
  const fat = Math.round((kcal * fatPct) / 100 / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  const water = Math.round(p.weight * (p.usesPowder ? 35 : 30));
  const warnings = [];
  if (kcal < B) warnings.push('目标热量低于基础代谢（BMR），建议减小缺口。');
  if (protein * 4 > kcal * 0.4) warnings.push('蛋白质占热量超过 40%，注意纤维和饮水。');
  return { age, bmr: Math.round(B), tdee: Math.round(tdee), kcal, protein, proteinBasis, fat, carbs, fiber: 28, water, bmi: +BMI.toFixed(1), fatPct, warnings };
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

// Projected body fat % at goal weight assuming lean mass kept (best case).
export function projectedBodyFat(weight, bodyFatPct, goalWeight) {
  const lean = weight * (1 - bodyFatPct / 100);
  return Math.max(0, (1 - lean / goalWeight) * 100);
}
// A42: may the review offer "deficit +5%"? Returns {ok, reason}; reason ∈ bmr-unknown | on-break | cap | below-bmr.
export function canDeepen(p = {}, { breakState = null, today = null } = {}) {
  if (breakState && (!today || !breakState.until || today <= breakState.until)) return { ok: false, reason: 'on-break' };
  const t0 = computeTargets(p); if (!(t0.bmr > 0) || !(t0.kcal > 0)) return { ok: false, reason: 'bmr-unknown' };
  const d = p.deficitPct ?? 20; if (d + 5 > 30) return { ok: false, reason: 'cap' };
  const t = computeTargets({ ...p, deficitPct: d + 5 }); return t.kcal >= t.bmr ? { ok: true, reason: null } : { ok: false, reason: 'below-bmr' };
}
export const DEEPEN_COPY = {
  'bmr-unknown': '先在“我的”补全出生日期和身高，才能判断能否再减热量。',
  'on-break': '正在“维持周”，结束后再决定是否减热量。',
  cap: '热量缺口已达 30% 上限，这周不建议再减热量。',
  'below-bmr': '再减 5% 会低于基础代谢，这周不建议再减热量。',
};
