// A53: day/week assembly split from portion.js (fiber staple swap, tuna cap, add-on variety). Import via js/core/plan.js (facade).
import { TUNA } from '../tuna.js';
import { totals } from '../foods.js';
import { selectWeek } from './select.js';
import { FIBER_ALT, STAPLE_ALT_W } from './fiber.js';
import { portionCore, TUNA_ADDON_G } from './portion.js';
const sum = (items, food) => totals(items, food);
export function portionDay(sk, targets, food, opts = {}) {
  // A47: no usable protein → a day without meat items, flagged protein-low (never throws).
  if (!food(sk.pLunch) || !food(sk.pDinner)) {
    const veg = r => (r ? [...r.items.map(([id, g]) => [id, g / 2]), ['oil', r.oil / 2]] : []);
    const st = food(sk.staple) ? [[sk.staple, 150]] : [];
    const meals = [{ name: '早餐', title: sk.bf.name, items: sk.bf.items }, { name: '午餐', title: '主食 + 蔬菜', items: [...st, ...veg(sk.vegL)] }, { name: '晚餐', title: '主食 + 蔬菜', items: [...st, ...veg(sk.vegD)] }];
    const tot = sum(meals.flatMap(m => m.items), food);
    return { day: sk.day, meals, tot, dinnerProtein: null, staple: sk.staple, proteinG: 0, stapleG: 150, bfMult: 1, kiwiG: 0, vegMult: 1, addon: [], score: Infinity, fit: 'protein-low', fiberNote: null };
  }
  let best = portionCore(sk, targets, food, opts);
  for (const alt of FIBER_ALT[sk.staple] || []) {
    if (!best.fiberNote || !food(alt)) break;
    const b = portionCore({ ...sk, staple: alt }, targets, food, opts);
    if (b.score + STAPLE_ALT_W < best.score) best = { ...b, stapleSwap: sk.staple };
  }
  return best;
}
export function generateWeek(targets, food, recipes, opts = {}) {
  // A33: tuna grams across all meals and add-ons stay within TUNA.tunaLight.max (core/tuna.js).
  // Snack variety: each add-on item costs ADDON_REPEAT_W × (days it was already used this week).
  let tunaG = 0; const used = {};
  return selectWeek(food, recipes, opts).map(sk => {
    const noTuna = tunaG + TUNA_ADDON_G > TUNA.tunaLight.max;
    // Perf: planWeek passes opts.memo (one Map per planWeek call) so budget rounds reuse days whose inputs did not change.
    const key = opts.memo && [sk.bf.name, sk.pLunch, sk.pDinner, sk.staple, sk.vegL?.id, sk.vegD?.id, noTuna, JSON.stringify(used)].join('|');
    let d = key && opts.memo.get(key);
    if (!d) { d = portionDay(sk, targets, food, { ...opts, noTuna, addonUse: used }); if (key) opts.memo.set(key, d); }
    d = { ...d, day: sk.day };
    tunaG += d.meals.flatMap(m => m.items).filter(([id]) => id === 'tunaLight').reduce((t, [, g]) => t + g, 0);
    for (const id of new Set(d.addon.map(([id]) => id))) used[id] = (used[id] || 0) + 1;
    return d;
  });
}
