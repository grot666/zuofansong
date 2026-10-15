import { FOODS } from '../../data/foods.js';
import { FOODS2 } from '../../data/foods2.js';
import { FOODS3 } from '../../data/foods3.js';
import { PRICE_REFS } from '../../data/prices.js';
// A5: shared food index + nutrient totals. Pure.
// raw-purchase conversion: cooked id -> [raw id, cooked g per raw g]
export const COOKED_TO_RAW = { riceCooked: ['rice', 2.3], brownRiceCooked: ['brownRice', 2.4], milletCooked: ['millet', 2.6], thighRoasted: ['chickenThigh', 0.75], breastRoasted: ['chickenBreast', 0.75], shrimpCooked: ['shrimp', 0.85], sweetPotatoBaked: ['sweetPotato', 0.85], eggUSDA: ['egg', 1], eggBoiled: ['egg', 1] };
// R10-S1/A53: shopping alias map (verified twins merge under the everyday name); shared next to COOKED_TO_RAW.
export const SHOP_ALIAS = { eggWhite: ['egg', 0.6], oatsDry: ['oats', 1] }; // [base id, g of item per g of base]
export const twinOf = (id, food) => { if (SHOP_ALIAS[id] && food(SHOP_ALIAS[id][0])) return SHOP_ALIAS[id]; const a = food(id)?.aliasOf; if (a && food(a)) return [a, 1]; const b = id.replace(/USDA$/, ''); return b !== id && food(b) ? [b, 1] : [id, 1]; };
// A68: the shopping-list id for any food id (cooked → raw → twin/alias base).
export const shopId = (id, food) => twinOf((COOKED_TO_RAW[id] || [id])[0], food)[0];

const OIL_IDS = new Set(['oil', 'oliveOil']);
// A24: makeIndex({ base: [lists…], partials: [lists…] }) — base entries create/merge foods; partials only
// merge onto existing ids (refs, user price overrides) and never create entries.
// Legacy positional form makeIndex(listA, listB, …) treats every list as base.
export function makeIndex(...args) {
  const spec = args.length === 1 && args[0] && !Array.isArray(args[0]) ? args[0] : { base: args, partials: [] };
  const m = new Map();
  for (const l of spec.base || []) for (const f of l || []) m.set(f.id, m.has(f.id) ? { ...m.get(f.id), ...f } : f);
  for (const l of spec.partials || []) for (const f of l || []) if (m.has(f.id)) m.set(f.id, { ...m.get(f.id), ...f });
  // A74: an alias (aliasOf) reads nutrients/price/storage from its canonical food; keeps its own id so logs keep working.
  // A user price override on the alias applies to the canonical food when that has none.
  for (const a of [...m.values()]) {
    const c = a.aliasOf && m.get(a.aliasOf); if (!c || c.aliasOf) continue;
    if (a.priceUser && !c.priceUser) m.set(c.id, { ...c, priceCNYPer500g: a.priceCNYPer500g, priceUser: true });
  }
  for (const a of [...m.values()]) { const c = a.aliasOf && m.get(a.aliasOf); if (c && !c.aliasOf) m.set(a.id, { ...c, id: a.id, aliasOf: c.id }); }
  const food = id => m.get(id);
  food.all = () => [...m.values()].filter(f => !f.aliasOf);
  return food;
}
// One builder for every page: estimate < official ref < user override; custom foods are base.
export function foodIndexFromStore(S) {
  return makeIndex({ base: [FOODS, FOODS2, FOODS3, S.get('customFoods', [])], partials: [PRICE_REFS, priceOverrides(S.get('prices', {}))] });
}
// items: [{id,g}] or [[id,g]]. Unknown ids are skipped.
export function totals(items, food) {
  const t = { kcal: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, cost: 0, powderProtein: 0, veg: 0, oil: 0, lowFat: 0, takeaway: 0 };
  for (const it of items) {
    const [id, g] = Array.isArray(it) ? it : [it.id, it.g];
    const f = food(id); if (!f) continue; const k = g / 100;
    for (const key of ['kcal', 'protein', 'fat', 'carbs', 'fiber']) t[key] += f[key] * k;
    { const [, kk] = COOKED_TO_RAW[id] || [id, 1]; t.cost += (g / kk) * priceOf(food, id).rawPrice / 500; }
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
// A23: price per 500 g of the RAW purchase for any id. A user override on a cooked id is per cooked weight,
// so its raw equivalent is cookedPrice × k. Otherwise the raw food's merged price (ref/override) is used.
export function priceOf(food, id) {
  const [rawId, k] = COOKED_TO_RAW[id] || [id, 1];
  const f = food(id);
  if (rawId !== id && f && f.priceUser) return { rawId, rawPrice: f.priceCNYPer500g * k };
  const raw = food(rawId) || f;
  return { rawId, rawPrice: (raw && raw.priceCNYPer500g) || 0 };
}
// UX-12: quick-add chips under the search box. Recents (≤8) first, then most-used (≤8); empty or thin history is padded with curated up to 8.
export const CURATED_CHIPS = ['egg', 'riceCooked', 'thighRoasted', 'broccoli', 'oatsDry', 'tofuFirm', 'milk', 'tunaLight']; // R10-D1: verified twins
export function quickChips(recents = [], useCount = {}, has = () => true) {
  const out = [];
  const add = id => { if (has(id) && !out.includes(id)) out.push(id); };
  [...recents].filter(has).slice(0, 8).forEach(add);
  const n0 = out.length;
  Object.entries(useCount).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).forEach(([id]) => { if (out.length < n0 + 8) add(id); });
  for (const id of CURATED_CHIPS) if (out.length < 8) add(id); // thin history → pad with curated
  return out.slice(0, 16);
}
