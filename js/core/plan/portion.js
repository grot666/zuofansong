// A45: split from js/core/plan.js (portion). Import via js/core/plan.js (facade).
import { TUNA } from '../review.js';
import { totals } from '../foods.js';
import { selectWeek } from './select.js';
const sum = (items, food) => totals(items, food);
export const FITS = ['ok', 'kcal-high', 'kcal-low', 'protein-low'];
export const BF_MULTS = [1, 0.75, 1.25, 0.5];
export const KIWI_G = [100, 0, 200];
// A25: realistic cooked-protein portion per meal; add-ons are tried before more meat.
export const MAX_PROTEIN_G_PER_MEAL = 300;
// Meat-lean (P1 follow-up): meat only meets the protein floor; staple/add-ons fill kcal; 0.5 kcal-equivalent penalty per g meat, add-on order penalty 2 per index.
export const MEAT_W = 0.5;
export const TUNA_ADDON_G = 100;
export const TUNA_MAX_PER_WEEK = Math.floor(TUNA.tunaLight.max / TUNA_ADDON_G); // 3 × 100 g ≤ 339 g
export const ADDON_REPEAT_W = 15;
// Plant mains are less protein-dense; a 450 g block of firm tofu is still a normal portion.
export const PORTION_MULT = { tofuFirm: 1.5 };
const pm = id => PORTION_MULT[id] || 1;
export const ADDONS = [[], [['eggWhite', 99]], [['yogurt', 150]], [['yogurt', 300]], [['eggBoiled', 100]], [['tofuFirm', 150]], [['yogurt', 150], ['eggBoiled', 100]], [['yogurt', 300], ['eggBoiled', 100]], [['yogurt', 300], ['tofuFirm', 150]], [['yogurt', 300], ['eggBoiled', 100], ['tofuFirm', 150]], [['eggWhite', 99], ['yogurt', 150]], [['eggWhite', 99], ['tofuFirm', 150]], [['tunaLight', 100]], [['tunaLight', 100], ['eggWhite', 99]], [['tunaLight', 100], ['yogurt', 150]], [['shrimpCooked', 100]], [['shrimpCooked', 100], ['tofuFirm', 150]]]; // R9-7: milk/千张/豆干 add-ons were never chosen (too low protein per kcal) → removed
// A19: closed-form search. Totals are linear in staple g (sg, per meal) and protein g (pg, per meal),
// so for each breakfast×snack knob and sg we solve the best pg ≥ protein floor directly (no iteration loops).
// G2: opts.powderScoops > 0 (profile.usesPowder) appends whey add-ons after every whole-food add-on.
export const SCOOP_G = 30;
export function powderAddons(n) {
  const out = [];
  for (let k = 1; k <= n; k++) out.push([['whey', SCOOP_G * k]], [['yogurt', 300], ['eggBoiled', 100], ['whey', SCOOP_G * k]]);
  return out;
}
export function portionDay(sk, { kcal, protein }, food, opts = {}) {
  const { bf, pDinner, pLunch, staple, vegL, vegD } = sk;
  const r5 = x => Math.round(x / 5) * 5;
  const build = (sg, pg, bm, kiwi, addon = []) => {
    const meals = [
      { name: '早餐', title: bm === 1 ? bf.name : `${bf.name} ×${bm}`, items: bf.items.map(([id, g]) => [id, Math.round(g * bm)]) },
      { name: '午餐', title: `${food(staple).name} + ${food(pLunch).name}${vegL ? ' + ' + vegL.name : ''}`, items: [[staple, sg], [pLunch, Math.round(pg * pm(pLunch))], ...(vegL ? [...vegL.items.map(([id, g]) => [id, g / 2]), ['oil', vegL.oil / 2]] : [])] },
      { name: '晚餐', title: `${food(staple).name} + ${food(pDinner).name}${vegD ? ' + ' + vegD.name : ''}`, items: [[staple, sg], [pDinner, Math.round(pg * pm(pDinner))], ...(vegD ? [...vegD.items.map(([id, g]) => [id, g / 2]), ['oil', vegD.oil / 2]] : [])] },
    ];
    const snack = [...(kiwi ? [[food('kiwiUSDA') ? 'kiwiUSDA' : 'kiwi', kiwi]] : []), ...addon]; // R9-2: verified FDC twin when available
    if (snack.length) meals.push({ name: '加餐', title: snack.map(([id, g]) => `${food(id).name} ${g} g`).join(' + '), items: snack });
    return { meals, tot: sum(meals.flatMap(m => m.items), food) };
  };
  const st = food(staple), pl = food(pLunch), pd = food(pDinner);
  const sK = 2 * st.kcal / 100, sP = 2 * st.protein / 100;
  const pK = (pl.kcal * pm(pLunch) + pd.kcal * pm(pDinner)) / 100, pP = (pl.protein * pm(pLunch) + pd.protein * pm(pDinner)) / 100;
  let best = null;
  const addons = [...ADDONS, ...powderAddons(opts.powderScoops || 0)].filter(a => a.every(([id]) => food(id)) && !(opts.noTuna && a.some(([id]) => id === 'tunaLight' || id === 'tunaAlbacore')));
  // Perf: the zero-staple/zero-protein base is additive over its parts, so sum the parts once instead of build()+totals per knob.
  const kp = items => { const t = sum(items, food); return { kcal: t.kcal, protein: t.protein }; };
  const z = build(0, 0, 1, 0, []).meals.slice(1, 3).flatMap(m => m.items);
  const vegT = kp(z), bfT = BF_MULTS.map(bm => kp(bf.items.map(([id, g]) => [id, Math.round(g * bm)])));
  const kiwiT = KIWI_G.map(kiwi => kp(kiwi ? [[food('kiwiUSDA') ? 'kiwiUSDA' : 'kiwi', kiwi]] : []));
  const addT = addons.map(kp);
  BF_MULTS.forEach((bm, bi) => KIWI_G.forEach((kiwi, ki) => addons.forEach((addon, ai) => {
    const base = { kcal: vegT.kcal + bfT[bi].kcal + kiwiT[ki].kcal + addT[ai].kcal, protein: vegT.protein + bfT[bi].protein + kiwiT[ki].protein + addT[ai].protein };
    const rep = addon.reduce((s, [id]) => s + (opts.addonUse?.[id] || 0), 0) * ADDON_REPEAT_W;
    for (let sg = 30; sg <= 350; sg += 10) {
      const pgMin = Math.max(60, Math.ceil((protein - base.protein - sg * sP) / pP / 5) * 5);
      const pg = Math.min(MAX_PROTEIN_G_PER_MEAL, pgMin);
      const k = base.kcal + sg * sK + pg * pK, P = base.protein + sg * sP + pg * pP;
      const short = Math.max(0, protein - P);
      // lexicographic: protein floor, then kcal distance, then prefer default knobs
      const score = short * 1e6 + Math.abs(k - kcal) + (bi + ki) * 5 + ai * 2 + pg * MEAT_W + rep;
      if (!best || score < best.score) best = { score, sg, pg, bm, kiwi, addon };
    }
  })));
  const r = build(best.sg, best.pg, best.bm, best.kiwi, best.addon);
  const off = (r.tot.kcal - kcal) / kcal;
  const fit = r.tot.protein < protein - 0.5 ? 'protein-low' : off > 0.05 ? 'kcal-high' : off < -0.05 ? 'kcal-low' : 'ok';
  return { day: sk.day, ...r, dinnerProtein: pDinner, staple, proteinG: best.pg, stapleG: best.sg, bfMult: best.bm, kiwiG: best.kiwi, addon: best.addon, fit };
}
export const feasibility = ({ kcal, protein }) => (protein * 4 > 0.45 * kcal ? { reason: 'protein-high', pct: Math.round(protein * 4 / kcal * 100) } : null);
export function generateWeek(targets, food, recipes, opts = {}) {
  // A33: tuna grams across all meals and add-ons stay within TUNA.tunaLight.max (review.js).
  // Snack variety: each add-on item costs ADDON_REPEAT_W × (days it was already used this week).
  let tunaG = 0; const used = {};
  return selectWeek(food, recipes, opts).map(sk => {
    const d = portionDay(sk, targets, food, { ...opts, noTuna: tunaG + TUNA_ADDON_G > TUNA.tunaLight.max, addonUse: used });
    tunaG += d.meals.flatMap(m => m.items).filter(([id]) => id === 'tunaLight').reduce((t, [, g]) => t + g, 0);
    for (const id of new Set(d.addon.map(([id]) => id))) used[id] = (used[id] || 0) + 1;
    return d;
  });
}

// RESEARCH-R6 §R6.3 greedy. slots: protein id per slot; slotCost(id, i): CNY for slot i with id (protein held constant).
// options: candidate ids. Returns { slots, cost, swaps, overBudget, steps }.
// score(id) (optional): among cheaper candidates that alone bring the week within budget, take the best-scoring; else the cheapest.
