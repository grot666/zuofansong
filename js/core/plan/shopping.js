// A45: split from js/core/plan.js (shopping). Import via js/core/plan.js (facade).
import { COOKED_TO_RAW, priceOf, twinOf, shopId } from '../foods.js';
import { FIBER_SIDE } from './fiber.js';
// R10-S1: shelf-stable staples and condiments go to one "常备" line; verified twins merge under the everyday name.
export const PANTRY_IDS = new Set(['rice', 'brownRice', 'millet', 'oats', 'oatsDry', 'tunaLight', 'tunaAlbacore', 'soy', 'oyster', 'oil', 'oliveOil', 'garlic', 'ginger', 'whey']);
export const SMALL_G = 50;
// R11-3: two trips. Perishable fish/seafood/leafy greens needed from day TRIP2_FROM (周五) on are bought on trip 2 (周三/周四);
// frozen fish (tag 冷冻) stays on trip 1 with "冷冻保存". No shelf-life numbers (unsourced).
export const TRIP2_FROM = 4;
const tags = f => f?.tags || [];
export const isFrozen = f => f?.store === 'frozen' || tags(f).includes('冷冻');
// A66: trip 2 = store 'fresh' AND fish/seafood/leafy/mushroom/seaweed (meat/tofu stay trip 1 — explicit, see DECISIONS).
export const TRIP2_TAGS = ['鱼', '海鲜', '绿叶菜', '菌菇', '海藻'];
export const isPerishable = f => f?.store === 'fresh' && tags(f).some(t => TRIP2_TAGS.includes(t));
// Custom foods without a store class count as 'keeps' (trip 1).
export const storeOf = f => f?.store || 'keeps';
export function shoppingList(days, food) {
  const agg = {};
  days.forEach((d, di) => { for (const m of d.meals) for (const [id, g] of m.items) {
    const [rawId, f] = COOKED_TO_RAW[id] || [id, 1];
    const [key, f2] = twinOf(rawId, food);
    const a = agg[key] || (agg[key] = { g: 0, g2: 0, cost: 0 });
    a.g += g / f / f2; if ((d.day ?? di) >= TRIP2_FROM) a.g2 += g / f / f2; a.cost += (g / f) * priceOf(food, id).rawPrice / 500;
  } });
  return Object.entries(agg).map(([id, a]) => { const f = food(id); const g = Math.round(a.g); const pantry = storeOf(f) === 'pantry' || PANTRY_IDS.has(id) || ['调味', '油脂'].includes(f?.cat);
    const fr = isFrozen(f), per = !pantry && !fr && isPerishable(f), g2 = per ? Math.round(a.g2) : 0;
    return { id, name: f?.name || id, cat: f?.cat || '', g, cost: f ? a.cost : 0, pantry, small: !pantry && g < SMALL_G, perishable: per, frozen: fr, g1: g - g2, g2 }; })
    .sort((a, b) => a.pantry - b.pantry || a.small - b.small || a.cat.localeCompare(b.cat) || b.g - a.g);
}
// A67: the rendered list split into trips, per-trip cost in core (page renders only).
// trip1 = g1 share of every non-pantry, non-small item; trip2 = g2 share; cost split by grams.
export const DAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
export const TRIP2_FROM_DAY = DAY_NAMES[TRIP2_FROM];
export function tripLists(list) {
  const row = (x, g) => ({ id: x.id, name: x.name, g, cost: x.g ? x.cost * g / x.g : 0, frozen: x.frozen });
  const main = list.filter(x => !x.pantry && !x.small);
  return { trip1: main.filter(x => x.g1 > 0).map(x => row(x, x.g1)), trip2: main.filter(x => x.g2 > 0).map(x => row(x, x.g2)), small: list.filter(x => x.small), pantry: list.filter(x => x.pantry) };
}
// R10-S1/A67: lines the user actually shops for = rendered rows (trip rows; pantry and "少量" one line each).
export const listLines = list => { const t = tripLists(list); return t.trip1.length + t.trip2.length + (t.small.length ? 1 : 0) + (t.pantry.length ? 1 : 0); };

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
// Distinct recipe vegetables; the capped-day fiber side (FIBER_SIDE, exact grams) is not a recipe and is not counted.
const isSide = (d, id, g) => d.fiberSide && FIBER_SIDE.some(([s, sg]) => s === id && sg === g);
export const distinctVeg = (week, food) => new Set(week.flatMap(d => d.meals.flatMap(m => m.items.filter(([id, g]) => !isSide(d, id, g)).map(([id]) => id))).filter(id => food(id)?.cat === '蔬菜')).size;
// R10-F2: 7-day average fiber (g/day) for the plan header.
export const weekFiber = days => (days.length ? days.reduce((s, d) => s + (d.tot?.fiber || 0), 0) / days.length : 0);
// R11-4/A68: opened-pack leftovers. packs: user {id: pack g}, keys read through shopId (cooked/twin ids work, no migration).
// No default pack sizes (no official source). Pantry items skipped; leftover = ceil(g / pack) × pack − g, hidden below SMALL_G.
// A recipe that uses the item is suggested, preferring one not already in the week.
export function leftovers(list, packs = {}, recipes = [], weekRecipeIds = [], food = null) {
  const P = {}; for (const [id, g] of Object.entries(packs || {})) if (g > 0) P[food ? shopId(id, food) : id] = g;
  return list.filter(x => !x.pantry && P[x.id] > 0).map(x => {
    const pk = P[x.id]; const left = Math.round(Math.ceil(x.g / pk) * pk - x.g);
    const rs = recipes.filter(r => r.items.some(([id]) => id === x.id || (food && shopId(id, food) === x.id)));
    const r = rs.find(r => !weekRecipeIds.includes(r.id)) || rs[0];
    return { id: x.id, name: x.name, left, recipeId: r?.id || null, recipeName: r?.name || null };
  }).filter(x => x.left >= SMALL_G);
}
// A68: recipe ids used this week (meal titles carry the recipe name).
export const weekRecipeIds = (week, recipes) => recipes.filter(r => week.some(d => d.meals.some(m => (m.title || '').includes(r.name)))).map(r => r.id);
