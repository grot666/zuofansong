// Weekly review math (research R5.4, R3.3, R3.4, R3.6). Pure.
// logs: { 'YYYY-MM-DD': {items:[{id,g}], water} }, food: id -> food
const OIL_IDS = new Set(['oil', 'oliveOil']);
export const TUNA = { tunaLight: { kind: 'light', max: 3 * 113 }, tunaAlbacore: { kind: 'albacore', max: 113 } };

export function dayTotals(items, food) {
  const t = { kcal: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, cost: 0, oil: 0, lowFat: 0, takeaway: 0 };
  for (const { id, g } of items) {
    const f = food(id); if (!f) continue; const k = g / 100;
    for (const key of ['kcal', 'protein', 'fat', 'carbs', 'fiber']) t[key] += f[key] * k;
    t.cost += (f.priceCNYPer500g || 0) * g / 500;
    if (OIL_IDS.has(id)) t.oil += g;
    if (f.fatClass === 'low') t.lowFat += f.fat * k;
    if (f.cat === '外食') t.takeaway += 1;
  }
  return t;
}

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
export function plateau(weights, todayStr) {
  const end = new Date(todayStr).getTime(); const start = end - 14 * 86400000;
  const win = weights.filter(w => { const t = new Date(w.date).getTime(); return t > start && t <= end; });
  if (win.length < 10) return { plateau: false, reason: 'sparse' };
  const half = start + 7 * 86400000;
  const a = win.filter(w => new Date(w.date).getTime() <= half), b = win.filter(w => new Date(w.date).getTime() > half);
  if (a.length < 3 || b.length < 3) return { plateau: false, reason: 'sparse' };
  const m = arr => arr.reduce((s, w) => s + w.weight, 0) / arr.length;
  const delta = m(b) - m(a);
  return { plateau: Math.abs(delta) < 0.1 || delta > 0, delta };
}

export function lastNDates(todayStr, n = 7) {
  const out = []; const t = new Date(todayStr + 'T00:00:00Z').getTime();
  for (let i = n - 1; i >= 0; i--) out.push(new Date(t - i * 86400000).toISOString().slice(0, 10));
  return out;
}
