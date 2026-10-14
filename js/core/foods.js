// A5: shared food index + nutrient totals. Pure.
const OIL_IDS = new Set(['oil', 'oliveOil']);
// lists: arrays of foods; later lists override earlier ids (custom foods last).
export function makeIndex(...lists) {
  const m = new Map();
  for (const l of lists) for (const f of l || []) m.set(f.id, f);
  const food = id => m.get(id);
  food.all = () => [...m.values()];
  return food;
}
// items: [{id,g}] or [[id,g]]. Unknown ids are skipped.
export function totals(items, food) {
  const t = { kcal: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, cost: 0, powderProtein: 0, veg: 0, oil: 0, lowFat: 0, takeaway: 0 };
  for (const it of items) {
    const [id, g] = Array.isArray(it) ? it : [it.id, it.g];
    const f = food(id); if (!f) continue; const k = g / 100;
    for (const key of ['kcal', 'protein', 'fat', 'carbs', 'fiber']) t[key] += f[key] * k;
    t.cost += (f.priceCNYPer500g || 0) * g / 500;
    if (f.powder) t.powderProtein += f.protein * k;
    if (f.cat === '蔬菜') t.veg += g / 100;
    if (OIL_IDS.has(id)) t.oil += g;
    if (f.fatClass === 'low') t.lowFat += f.fat * k;
    if (f.cat === '外食') t.takeaway += 1;
  }
  return t;
}
// P2: grams protein per CNY on as-purchased basis (RESEARCH-R6 §R6.3).
export const proteinPerYuan = f => (f && f.priceCNYPer500g > 0 ? f.protein * 5 / f.priceCNYPer500g : null);
