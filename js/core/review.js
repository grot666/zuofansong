import { dayNum, addDays } from './dates.js';
// Weekly review math (research R5.4, R3.3, R3.4, R3.6). Pure.
// logs: { 'YYYY-MM-DD': {items:[{id,g}], water} }, food: id -> food
import { totals } from './foods.js';
import { TUNA } from './tuna.js';
export { TUNA }; // back-compat re-export (A50)

export const dayTotals = (items, food) => totals(items, food);

export function weekReview(dates, logs, food, targets) {
  const days = dates.map(d => ({ date: d, log: logs[d] })).filter(x => x.log && x.log.items && x.log.items.length);
  const n = days.length;
  const tots = days.map(x => ({ ...dayTotals(x.log.items, food), water: x.log.water || 0 }));
  const avg = k => n ? tots.reduce((s, t) => s + t[k], 0) / n : null;
  const tuna = { light: 0, albacore: 0 };
  for (const x of days) for (const { id, g } of x.log.items) if (TUNA[id]) tuna[TUNA[id].kind] += g;
  const tunaNotes = [];
  if (tuna.light > TUNA.tunaLight.max) tunaNotes.push(`淡金枪鱼本周 ${Math.round(tuna.light)} g，超过保守参考 339 g（3 × 113 g）`);
  if (tuna.albacore > TUNA.tunaAlbacore.max) tunaNotes.push(`白金枪鱼本周 ${Math.round(tuna.albacore)} g，超过保守参考 113 g`);
  const fatTotal = tots.reduce((s, t) => s + t.fat, 0);
  return {
    logged: n, of: dates.length,
    kcalOkDays: tots.filter(t => Math.abs(t.kcal - targets.kcal) <= targets.kcal * 0.1).length,
    proteinOkDays: tots.filter(t => t.protein >= targets.protein - 0.5).length,
    avgKcal: avg('kcal'), avgProtein: avg('protein'), avgFat: avg('fat'), avgFiber: avg('fiber'), avgWater: avg('water'), avgOil: avg('oil'),
    lowFatPct: fatTotal ? tots.reduce((s, t) => s + t.lowFat, 0) / fatTotal * 100 : 0,
    cost: tots.reduce((s, t) => s + t.cost, 0), takeaway: tots.reduce((s, t) => s + t.takeaway, 0),
    tuna, tunaNotes,
  };
}

// Plateau (R3.6): MA change < 0.1 kg over >= 14 days with >= 5 logs/week on average.
// R-10 (Rulings R8): window (today−14, today]; ≥10 weigh-ins and ≥3 per 7-day half; delta = mean(B) − mean(A).
// reason: 'sparse' | 'flat' (|Δ|<0.1) | 'up' (Δ≥0.1) | 'down'. Pure.
export function plateau(weights, todayStr) {
  const end = dayNum(todayStr); const start = end - 14;
  const win = weights.filter(w => { const t = dayNum(w.date); return t > start && t <= end; });
  if (win.length < 10) return { plateau: false, reason: 'sparse' };
  const half = start + 7;
  const a = win.filter(w => dayNum(w.date) <= half), b = win.filter(w => dayNum(w.date) > half);
  if (a.length < 3 || b.length < 3) return { plateau: false, reason: 'sparse' };
  const m = arr => arr.reduce((s, w) => s + w.weight, 0) / arr.length;
  const delta = m(b) - m(a);
  const reason = Math.abs(delta) < 0.1 ? 'flat' : delta > 0 ? 'up' : 'down';
  return { plateau: reason !== 'down', reason, delta, trend: reason };
}
// Adds adherence gate, 14-day cooldown after −kcal / 维持周 decisions, and break suppression.
// UX-4: on Sun/Mon, prompt a weekly review unless one was saved in the last 6 days.
export function reviewDue(today, reviews = {}) {
  const dn = dayNum; const t = dn(today); const wd = new Date(t * 86400000).getUTCDay();
  if (wd !== 0 && wd !== 1) return false;
  return !Object.keys(reviews).some(d => t - dn(d) >= 0 && t - dn(d) <= 6);
}
// ctx: { kcalOkDays, logged, reviews: {date: {decision}}, breakState }
export function plateauAdvice(weights, todayStr, ctx = {}) {
  const r = plateau(weights, todayStr);
  if (!r.plateau) return { ...r, show: false, actions: [] };
  const dn = dayNum; const t = dn(todayStr);
  const recent = Object.entries(ctx.reviews || {}).some(([d, v]) => ['minus', 'break'].includes(v && v.decision) && t - dn(d) < 14 && t >= dn(d));
  const winStart = t - 13;
  const inBreak = ctx.breakState && ctx.breakState.until && dn(ctx.breakState.until) >= winStart;
  if (recent || inBreak) return { ...r, show: false, suppressed: recent ? 'cooldown' : 'break', actions: [] };
  const adherent = (ctx.kcalOkDays ?? 0) >= 5 && (ctx.logged ?? 0) >= 5;
  return { ...r, show: true, adherent, actions: adherent ? ['minus', 'steps', 'break', 'keep'] : ['steps', 'keep'] };
}

export function lastNDates(todayStr, n = 7) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) out.push(addDays(todayStr, -i));
  return out;
}
