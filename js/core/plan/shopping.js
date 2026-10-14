// A45: split from js/core/plan.js (shopping). Import via js/core/plan.js (facade).
import { COOKED_TO_RAW, priceOf } from '../foods.js';
export function shoppingList(days, food) {
  const agg = {};
  for (const d of days) for (const m of d.meals) for (const [id, g] of m.items) {
    const [rawId, f] = COOKED_TO_RAW[id] || [id, 1];
    const a = agg[rawId] || (agg[rawId] = { g: 0, cost: 0 });
    a.g += g / f; a.cost += (g / f) * priceOf(food, id).rawPrice / 500;
  }
  return Object.entries(agg).map(([id, a]) => { const f = food(id); return { id, name: f?.name || id, cat: f?.cat || '', g: Math.round(a.g), cost: f ? a.cost : 0 }; }).sort((a, b) => a.cat.localeCompare(b.cat) || b.g - a.g);
}

export function checkWeek(days, { kcal, protein }) {
  return days.map(d => ({ day: d.day, kcalOk: Math.abs(d.tot.kcal - kcal) <= kcal * 0.05, proteinOk: d.tot.protein >= protein - 0.5 }));
}

// UX-9: 换一套 = next seed; the week is a pure function of (targets, seed, opts), so undo = restore prevSeed.
export const regenWeek = ({ seed = 0 } = {}) => ({ seed: seed + 1, prevSeed: seed });
// PM 06:14: plan-page tips explaining why the week looks the way it does.
export function planTips(plan) {
  const tips = [];
  if (plan.swaps) tips.push(`已按预算换更合适的蛋白（看评分）：${plan.swaps} 次，晚餐和第二天午餐一起换。`);
  const ids = new Set(plan.week.flatMap(d => (d.addon || []).map(([id]) => id)));
  if (ids.size >= 2) tips.push('加餐已轮换，同一种最多约 4 天。');
  if (plan.unfit?.length) tips.push(`⚠ 为了省钱换蛋白后，${plan.unfit.map(i => ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][i]).join('、')}热量会超出目标 5% 以上；可提高预算或少盛一点主食。`);
  return tips;
}
// R9-8: a lunch/dinner with > MEAT_NOTE_G cooked meat/fish gets a realism note (tofu excluded).
export const MEAT_NOTE_G = 250;
export function meatNote(meal) {
  if (!/午餐|晚餐/.test(meal.name)) return '';
  const main = meal.items[1]; if (!main || main[0] === 'tofuFirm' || main[1] <= MEAT_NOTE_G) return '';
  return `这餐肉/鱼约 ${Math.round(main[1])} g，偏多：可分一半到第二天，或在“我的”降低蛋白目标/打开蛋白粉。`;
}
// R9-10: budget input → number or error (blank/0/negative keep the previous value).
export function parseBudget(raw) {
  const s = String(raw ?? '').trim(); const n = Number(s);
  if (!s || !Number.isFinite(n) || n <= 0) return { ok: false, msg: '请输入大于 0 的每周预算（元），已保留原值' };
  return { ok: true, value: Math.round(n) };
}
// R9-10 reuse metric: distinct vegetable ids in a week (fewer = more reuse, less waste).
export const distinctVeg = (week, food) => new Set(week.flatMap(d => d.meals.flatMap(m => m.items.map(([id]) => id))).filter(id => food(id)?.cat === '蔬菜')).size;
// R10-F2: 7-day average fiber (g/day) for the plan header.
export const weekFiber = days => (days.length ? days.reduce((s, d) => s + (d.tot?.fiber || 0), 0) / days.length : 0);
