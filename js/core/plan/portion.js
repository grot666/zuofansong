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
export const SG_MAX = 350; // staple g per meal
export const MEAT_OVER_G = 250; // = MEAT_NOTE_G (shopping.js)
export const MEAT_OVER_W = 3;
// R10-F1: prefer variants reaching 25 g fiber (veg portion ×1/×1.5/×2, kiwi, staple) when kcal/protein still fit.
export const VEG_MULTS = [1, 1.5, 2];
export const FIBER_MIN = 25;
export const FIBER_W = 10;
export const fiberNote = f => `膳食纤维约 ${Math.round(f)} g（目标 25–30 g）：可把白米换成糙米/杂粮，或加一份蔬菜/猕猴桃。`;
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
// R10-F1: when a day still misses fiber, also try higher-fiber staples in order (STAPLE_ALT_W penalty) and keep the better score.
export const FIBER_ALT = { riceCooked: ['brownRiceCooked', 'sweetPotatoBaked'], brownRiceCooked: ['sweetPotatoBaked'], milletCooked: ['sweetPotatoBaked'] };
export const STAPLE_ALT_W = 20;
export function portionDay(sk, targets, food, opts = {}) {
  let best = portionCore(sk, targets, food, opts);
  for (const alt of FIBER_ALT[sk.staple] || []) {
    if (!best.fiberNote || !food(alt)) break;
    const b = portionCore({ ...sk, staple: alt }, targets, food, opts);
    if (b.score + STAPLE_ALT_W < best.score) best = { ...b, stapleSwap: sk.staple };
  }
  return best;
}
function portionCore(sk, { kcal, protein }, food, opts = {}) {
  const { bf, pDinner, pLunch, staple, vegL, vegD } = sk;
  const r5 = x => Math.round(x / 5) * 5;
  const build = (sg, pg, bm, kiwi, addon = [], vm = 1) => {
    const meals = [
      { name: '早餐', title: bm === 1 ? bf.name : `${bf.name} ×${bm}`, items: bf.items.map(([id, g]) => [id, Math.round(g * bm)]) },
      { name: '午餐', title: `${food(staple).name} + ${food(pLunch).name}${vegL ? ' + ' + vegL.name : ''}`, items: [[staple, sg], [pLunch, Math.round(pg * pm(pLunch))], ...(vegL ? [...vegL.items.map(([id, g]) => [id, g / 2 * vm]), ['oil', vegL.oil / 2 * vm]] : [])] },
      { name: '晚餐', title: `${food(staple).name} + ${food(pDinner).name}${vegD ? ' + ' + vegD.name : ''}`, items: [[staple, sg], [pDinner, Math.round(pg * pm(pDinner))], ...(vegD ? [...vegD.items.map(([id, g]) => [id, g / 2 * vm]), ['oil', vegD.oil / 2 * vm]] : [])] },
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
  const kp = items => { const t = sum(items, food); return { kcal: t.kcal, protein: t.protein, fiber: t.fiber }; };
  const vegTs = VEG_MULTS.map(vm => kp(build(0, 0, 1, 0, [], vm).meals.slice(1, 3).flatMap(m => m.items))), bfT = BF_MULTS.map(bm => kp(bf.items.map(([id, g]) => [id, Math.round(g * bm)])));
  const kiwiT = KIWI_G.map(kiwi => kp(kiwi ? [[food('kiwiUSDA') ? 'kiwiUSDA' : 'kiwi', kiwi]] : []));
  const addT = addons.map(kp);
  const sF = 2 * (st.fiber || 0) / 100, pF = ((pl.fiber || 0) * pm(pLunch) + (pd.fiber || 0) * pm(pDinner)) / 100;
  const repA = addons.map(a => a.reduce((s, [id]) => s + (opts.addonUse?.[id] || 0), 0) * ADDON_REPEAT_W);
  const free = sK - pK * sP / pP; let bs = Infinity, bsg = 0, bpg = 0, bvi = 0, bbi = 0, bki = 0, bai = 0;
  const cl = x => (x < 30 ? 30 : x > SG_MAX ? SG_MAX : x);
  // R10-S2: grams of non-tofu meat above MEAT_OVER_G per meal cost MEAT_OVER_W each, so add-ons are tried first.
  const meatMeals = [pLunch, pDinner].filter(id => id !== 'tofuFirm').map(pm);
  const over = pg => meatMeals.reduce((s, m) => s + Math.max(0, pg * m - MEAT_OVER_G), 0) * MEAT_OVER_W;
  const sgs = new Array(10);
  // Plain loops (perf, R10-F1): k(sg) is piecewise linear, so only sg next to the kcal-exact points (pg free / pg 60 / pg cap / protein floor) and the ends can win.
  for (let vi = 0; vi < VEG_MULTS.length; vi++) for (let bi = 0; bi < BF_MULTS.length; bi++) for (let ki = 0; ki < KIWI_G.length; ki++) for (let ai = 0; ai < addons.length; ai++) {
    const knob = (bi + ki) * 5 + vi * 3 + ai * 2 + repA[ai];
    if (knob + 60 * MEAT_W >= bs) continue; // exact prune: every other score term is ≥ 0 and pg ≥ 60
    const v = vegTs[vi], b = bfT[bi], w = kiwiT[ki], a = addT[ai];
    const bK = v.kcal + b.kcal + w.kcal + a.kcal, bP = v.protein + b.protein + w.protein + a.protein, bF = v.fiber + b.fiber + w.fiber + a.fiber;
    const xs0 = free > 0 ? (kcal - bK - pK * (protein - bP) / pP) / free : SG_MAX, xs1 = (kcal - bK - 60 * pK) / sK, xs2 = (kcal - bK - MAX_PROTEIN_G_PER_MEAL * pK) / sK, xs3 = (protein - bP - 60 * pP) / sP;
    let n = 0; sgs[n++] = 30; sgs[n++] = SG_MAX;
    for (const x of [xs0, xs1, xs2, xs3]) if (Number.isFinite(x)) { sgs[n++] = cl(Math.floor(x / 10) * 10); sgs[n++] = cl(Math.ceil(x / 10) * 10); }
    for (let q = 0; q < n; q++) {
      const sg = sgs[q];
      const pgMin = Math.max(60, Math.ceil((protein - bP - sg * sP) / pP / 5) * 5);
      const pg0 = Math.min(MAX_PROTEIN_G_PER_MEAL, pgMin);
      // R10-D1 follow-up: at the staple cap a low-density staple + lean protein can leave kcal short; then also try more protein.
      const pg1 = sg === SG_MAX ? Math.min(MAX_PROTEIN_G_PER_MEAL, Math.max(pg0, Math.ceil((kcal - bK - sg * sK) / pK / 5) * 5)) : pg0;
      for (let t = 0; t < (pg1 === pg0 ? 1 : 2); t++) {
        const pg = t ? pg1 : pg0;
        const k = bK + sg * sK + pg * pK, P = bP + sg * sP + pg * pP, fib = bF + sg * sF + pg * pF;
        // lexicographic: protein floor, then kcal distance, knob defaults, meat, repeats, fiber below FIBER_MIN (R10-F1)
        const score = (P < protein ? (protein - P) * 1e6 : 0) + Math.abs(k - kcal) + knob + pg * MEAT_W + (fib < FIBER_MIN ? (FIBER_MIN - fib) * FIBER_W : 0) + over(pg);
        if (score < bs) { bs = score; bsg = sg; bpg = pg; bvi = vi; bbi = bi; bki = ki; bai = ai; }
      }
    }
  }
  best = { score: bs, sg: bsg, pg: bpg, bm: BF_MULTS[bbi], kiwi: KIWI_G[bki], addon: addons[bai], vm: VEG_MULTS[bvi] };
  const r = build(best.sg, best.pg, best.bm, best.kiwi, best.addon, best.vm);
  const off = (r.tot.kcal - kcal) / kcal;
  const fit = r.tot.protein < protein - 0.5 ? 'protein-low' : off > 0.05 ? 'kcal-high' : off < -0.05 ? 'kcal-low' : 'ok';
  return { day: sk.day, ...r, dinnerProtein: pDinner, staple, proteinG: best.pg, stapleG: best.sg, bfMult: best.bm, kiwiG: best.kiwi, vegMult: best.vm, addon: best.addon, score: best.score, fit, fiberNote: r.tot.fiber < FIBER_MIN ? fiberNote(r.tot.fiber) : null };
}
export const feasibility = ({ kcal, protein }) => (protein * 4 > 0.45 * kcal ? { reason: 'protein-high', pct: Math.round(protein * 4 / kcal * 100) } : null);
export function generateWeek(targets, food, recipes, opts = {}) {
  // A33: tuna grams across all meals and add-ons stay within TUNA.tunaLight.max (review.js).
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

// RESEARCH-R6 §R6.3 greedy. slots: protein id per slot; slotCost(id, i): CNY for slot i with id (protein held constant).
// options: candidate ids. Returns { slots, cost, swaps, overBudget, steps }.
// score(id) (optional): among cheaper candidates that alone bring the week within budget, take the best-scoring; else the cheapest.
