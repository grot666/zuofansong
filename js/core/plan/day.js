// A53: day/week assembly split from portion.js (fiber staple swap, tuna cap, add-on variety). Import via js/core/plan.js (facade).
import { TUNA } from '../tuna.js';
import { totals } from '../foods.js';
import { selectWeek } from './select.js';
import { STAPLE_ALT_W, FIBER_SIDE, SP_ID, SP_MAX_PER_WEEK, stapleOptions, fiberAlts } from './fiber.js';
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
  const cap = !!opts.spCapped; let best = null;
  for (const s0 of stapleOptions(sk.staple, cap)) if (food(s0)) { const b = portionCore({ ...sk, staple: s0 }, targets, food, opts); if (!best || b.score < best.score) best = s0 === sk.staple ? b : { ...b, stapleSwap: sk.staple, spCap: true }; }
  if (!best) best = portionCore(sk, targets, food, opts);
  for (const alt of fiberAlts(best.staple, cap)) {
    if (!best.fiberNote || !food(alt)) break;
    const b = portionCore({ ...sk, staple: alt }, targets, food, opts);
    if (b.score + STAPLE_ALT_W < best.score) best = { ...b, stapleSwap: sk.staple, ...(best.spCap ? { spCap: true } : {}) };
  }
  if (best.fiberNote && cap && FIBER_SIDE.every(([id]) => food(id))) {
    const b = portionCore({ ...sk, staple: best.staple }, targets, food, { ...opts, side: FIBER_SIDE });
    if (b.score + STAPLE_ALT_W < best.score) best = { ...b, ...(best.stapleSwap ? { stapleSwap: best.stapleSwap, spCap: best.spCap } : {}), fiberSide: true };
  }
  return best;
}
export function generateWeek(targets, food, recipes, opts = {}) {
  // A33: tuna grams across all meals and add-ons stay within TUNA.tunaLight.max (core/tuna.js).
  // Snack variety: each add-on item costs ADDON_REPEAT_W × (days it was already used this week).
  let tunaG = 0, spDays = 0; const used = {};
  return selectWeek(food, recipes, opts).map(sk => {
    const noTuna = tunaG + TUNA_ADDON_G > TUNA.tunaLight.max, spCapped = spDays >= SP_MAX_PER_WEEK;
    // Perf: planWeek passes opts.memo (one Map per planWeek call) so budget rounds reuse days whose inputs did not change.
    const key = opts.memo && [sk.bf.name, sk.pLunch, sk.pDinner, sk.staple, sk.vegL?.id, sk.vegD?.id, noTuna, spCapped, JSON.stringify(used)].join('|');
    let d = key && opts.memo.get(key);
    if (!d) { d = portionDay(sk, targets, food, { ...opts, noTuna, spCapped, addonUse: used }); if (key) opts.memo.set(key, d); }
    d = { ...d, day: sk.day };
    tunaG += d.meals.flatMap(m => m.items).filter(([id]) => id === 'tunaLight').reduce((t, [, g]) => t + g, 0);
    if (d.staple === SP_ID) spDays++;
    for (const id of new Set(d.addon.map(([id]) => id))) used[id] = (used[id] || 0) + 1;
    return d;
  });
}
