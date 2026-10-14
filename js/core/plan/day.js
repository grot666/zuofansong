// A53: day/week assembly split from portion.js (fiber staple swap, tuna cap, add-on variety). Import via js/core/plan.js (facade).
import { TUNA } from '../tuna.js';
import { totals } from '../foods.js';
import { selectWeek } from './select.js';
import { STAPLE_ALT_W, FIBER_SIDE, SP_ID, SP_CAP_ALT, SP_MAX_PER_WEEK, stapleOptions, fiberAlts } from './fiber.js';
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
  return dayWith(sk, sk.staple, targets, food, opts);
}
// One day with a given staple; a day still short of fiber may add the peas side (FIBER_SIDE; any day since R11-2, not only capped days).
function dayWith(sk, staple, targets, food, opts) {
  const key = opts.memo && [sk.bf.name, sk.pLunch, sk.pDinner, sk.staple, staple, sk.vegL?.id, sk.vegD?.id, opts.noTuna, opts.spCapped, JSON.stringify(opts.addonUse || {})].join('|');
  const hit = key && opts.memo.get(key); if (hit) return { ...hit, day: sk.day };
  let d = portionCore({ ...sk, staple }, targets, food, opts);
  if (d.fiberNote && FIBER_SIDE.every(([id]) => food(id))) {
    const b = portionCore({ ...sk, staple }, targets, food, { ...opts, side: FIBER_SIDE });
    if (b.score + STAPLE_ALT_W < d.score) d = { ...b, fiberSide: true };
  }
  if (staple !== sk.staple) d = { ...d, stapleSwap: sk.staple, ...(opts.spCapped && sk.staple === SP_ID ? { spCap: true } : {}) };
  if (key) opts.memo.set(key, d);
  return d;
}
// A55: the staple is decided per 2-day batch (selectWeek gives days 2k, 2k+1 the same staple: cook once, eat twice).
// Each candidate staple is evaluated over the whole batch in order (tuna/add-on state carries over) and the best summed score wins.
function batch(sks, st, targets, food, opts) {
  const run = staple => {
    let tunaG = st.tunaG; const used = { ...st.used }; let score = 0; const days = [];
    for (const sk of sks) {
      const noTuna = tunaG + TUNA_ADDON_G > TUNA.tunaLight.max;
      const d = { ...(food(sk.pLunch) && food(sk.pDinner) ? dayWith(sk, staple, targets, food, { ...opts, noTuna, spCapped: st.capped, addonUse: used }) : portionDay(sk, targets, food, opts)), day: sk.day };
      tunaG += d.meals.flatMap(m => m.items).filter(([id]) => id === 'tunaLight').reduce((t, [, g]) => t + g, 0);
      for (const id of new Set(d.addon.map(([id]) => id))) used[id] = (used[id] || 0) + 1;
      score += d.score; days.push(d);
    }
    return { days, score: score + (staple === sks[0].staple ? 0 : STAPLE_ALT_W * sks.length), tunaG, used };
  };
  // R11-2: never the previous batch's staple again (no staple 3 days running); fall back to the other 杂粮 staples.
  const okS = id => food(id) && id !== st.avoid;
  let opts0 = stapleOptions(sks[0].staple, st.capped).filter(okS); if (!opts0.length) opts0 = SP_CAP_ALT.concat('riceCooked').filter(okS);
  let best = null;
  for (const s0 of opts0) { const r = run(s0); if (!best || r.score < best.score) best = r; }
  if (!best) best = run(sks[0].staple);
  for (const alt of fiberAlts(best.days[0].staple, st.capped)) {
    if (!best.days.some(d => d.fiberNote)) break; if (!okS(alt)) continue;
    const r = run(alt); if (r.score < best.score) best = r;
  }
  return best;
}
export function generateWeek(targets, food, recipes, opts = {}) {
  // A33: tuna grams across all meals and add-ons stay within TUNA.tunaLight.max (core/tuna.js).
  // Snack variety: each add-on item costs ADDON_REPEAT_W × (days it was already used this week).
  // 烤红薯 cap: a batch may use sweet potato only if the week stays ≤ SP_MAX_PER_WEEK days (so ≤ 1 full batch + 1 single day).
  const sks = selectWeek(food, recipes, opts); const out = []; let st = { tunaG: 0, used: {} }, spDays = 0;
  for (let i = 0; i < sks.length; i += 2) {
    const grp = sks.slice(i, i + 2); const prev = out.length >= 2 && out[out.length - 1].staple === out[out.length - 2].staple ? out[out.length - 1].staple : null;
    const r = batch(grp, { ...st, avoid: prev, capped: spDays + grp.length > SP_MAX_PER_WEEK }, targets, food, opts);
    st = { tunaG: r.tunaG, used: r.used }; for (const d of r.days) { if (d.staple === SP_ID) spDays++; out.push(d); }
  }
  return out;
}
