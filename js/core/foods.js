// A5: shared food index + nutrient totals. Pure.
const OIL_IDS = new Set(['oil', 'oliveOil']);
// lists: arrays of foods; later entries are merged over earlier ones with the same id (custom foods, then price overrides).
export function makeIndex(...lists) {
  const m = new Map();
  for (const l of lists) for (const f of l || []) { if (m.has(f.id)) m.set(f.id, { ...m.get(f.id), ...f }); else if (!f.priceUser && !f.priceSource) m.set(f.id, f); }
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
// User price overrides {id: CNY/500g} → partial foods for makeIndex.
export const priceOverrides = (prices = {}) => Object.entries(prices).filter(([, v]) => Number(v) > 0).map(([id, v]) => ({ id, priceCNYPer500g: Number(v), priceUser: true }));
// P2: grams protein per CNY on as-purchased basis (RESEARCH-R6 §R6.3).
export const proteinPerYuan = f => (f && f.priceCNYPer500g > 0 ? f.protein * 5 / f.priceCNYPer500g : null);
// UX-3: rank name startsWith > includes > pinyin > tag; top n.
export function matchFoods(q, foods, n = 5) {
  q = String(q || '').trim().toLowerCase(); if (!q) return [];
  const rank = f => (f.name.startsWith(q) ? 0 : f.name.includes(q) ? 1 : (f.py || '').toLowerCase().startsWith(q) ? 2 : (f.py || '').toLowerCase().includes(q) ? 3 : (f.tags || []).some(t => t.includes(q)) ? 4 : 9);
  return foods.map(f => [rank(f), f]).filter(([r]) => r < 9).sort((a, b) => a[0] - b[0] || a[1].name.length - b[1].name.length).slice(0, n).map(([, f]) => f);
}
// unit: 'g' | 'unit' | 'bowl'. Returns grams or null when the food has no such unit.
export function gramsFor(f, n, unit) {
  if (!(n > 0)) return null;
  if (unit === 'g') return n;
  if (unit === 'unit') return f.unit && f.unit.g ? n * f.unit.g : null;
  if (unit === 'bowl') return n * 150 / (f.yield || 1);
  return null;
}
