import { TUNA } from './review.js';
import { mealScores } from './scores.js';
import { totals, COOKED_TO_RAW, priceOf } from './foods.js';
// Weekly plan generator. Pure; takes food lookup fn so it is testable.
// Each day: breakfast template + lunch + dinner (staple + protein + veg recipe) + optional fruit.
// Scales staple and protein portions so kcal is within ±5% of target and protein >= target.

export const BREAKFASTS = [
  { name: '燕麦牛奶粥 + 鸡蛋', items: [['oatsDry', 40], ['milk', 250], ['eggUSDA', 100]] },
  { name: '水煮蛋 + 玉米 + 无糖酸奶', items: [['eggBoiled', 100], ['corn', 200], ['yogurt', 150]] },
  { name: '全麦面包 + 鸡蛋 + 牛奶', items: [['wwBread', 70], ['eggUSDA', 100], ['milk', 250]] },
];
export const PROTEINS = ['thighRoasted', 'breastRoasted', 'shrimpCooked', 'seabass', 'tofuFirm', 'porkLoin', 'basa', 'leanBeef'];
// A33: canned tuna is an add-on only (100 g), never a main; one weekly gram budget shared with review.js.
export const STAPLES = ['riceCooked', 'brownRiceCooked', 'milletCooked', 'sweetPotatoBaked'];
// raw-purchase conversion: shopping list buys raw; cooked weight / factor = raw
export { COOKED_TO_RAW };

const sum = (items, food) => totals(items, food);

// A9 split: selectWeek picks *what* (deterministic from seed), portionDay picks *how much*.
// dinnerProteins[d] is cooked once for dinner(d) and lunch(d+1); lunch(0) uses dinnerProteins[6] (last week's batch).
export const vegScore = (r, food) => { const sc = mealScores([...r.items, ['oil', r.oil || 0]], food); return sc.health + sc.easy + sc.cheap + sc.tasty; };
export function rankVeg(vegs, food) {
  const sc = new Map(vegs.map(r => [r.id, vegScore(r, food)]));
  return [...vegs].sort((a, b) => sc.get(b.id) - sc.get(a.id) || a.id.localeCompare(b.id, 'en', { numeric: true }));
}
// Proteins ranked by the 4 scores of a standard plate (rice 150 + protein 150 + 上海青 250 + oil 6).
// A38: snapshot/diagnostic helper only (A36 golden). The base rotation in selectWeek must stay seed-only (DECISIONS 06:13).
export const proteinScore = (id, food) => { const sc = mealScores([['riceCooked', 150], [id, 150], ['shanghaiQing', 250], ['oil', 6]], food); return sc.health + sc.easy + sc.cheap + sc.tasty; };
// A38: snapshot helper only (A36). Base rotation must stay seed-only (DECISIONS 06:13); budget swaps use proteinScore.
export const rankProteins = (ids, food) => { const sc = new Map(ids.map(id => [id, proteinScore(id, food)])); return [...ids].sort((a, b) => sc.get(b) - sc.get(a) || ids.indexOf(a) - ids.indexOf(b)); };
export function selectWeek(food, recipes, opts = {}) {
  const seed = opts.seed ?? 0;
  const proteins = (opts.proteins || PROTEINS).filter(id => food(id));
  // G1 follow-up: meal scores steer selection. Seed 0 uses the 14 best-scoring veg recipes; later seeds rotate on.
  // R9-10: optional prep-time limit (minutes); falls back to all recipes if none qualify.
  const ok = recipes.filter(r => r.items.every(([id]) => food(id)));
  const quick = opts.maxPrepMin ? ok.filter(r => r.min <= opts.maxPrepMin) : ok;
  const vegs = rankVeg(quick.length ? quick : ok, food);
  const dinnerProteins = opts.dinnerProteins || Array.from({ length: 7 }, (_, d) => proteins[(d + seed) % proteins.length]);
  return dinnerProteins.map((pDinner, d) => ({
    day: d, bf: BREAKFASTS[(d + seed) % BREAKFASTS.length], pDinner, pLunch: dinnerProteins[(d + 6) % 7],
    staple: STAPLES[(Math.floor(d / 2) + seed) % STAPLES.length],
    vegL: vegs[(d * 2 + seed * 14) % vegs.length], vegD: vegs[(d * 2 + 1 + seed * 14) % vegs.length],
  }));
}
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
      { name: '午餐', title: `${food(staple).name} + ${food(pLunch).name} + ${vegL.name}`, items: [[staple, sg], [pLunch, Math.round(pg * pm(pLunch))], ...vegL.items.map(([id, g]) => [id, g / 2]), ['oil', vegL.oil / 2]] },
      { name: '晚餐', title: `${food(staple).name} + ${food(pDinner).name} + ${vegD.name}`, items: [[staple, sg], [pDinner, Math.round(pg * pm(pDinner))], ...vegD.items.map(([id, g]) => [id, g / 2]), ['oil', vegD.oil / 2]] },
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
  BF_MULTS.forEach((bm, bi) => KIWI_G.forEach((kiwi, ki) => addons.forEach((addon, ai) => {
    const base = build(0, 0, bm, kiwi, addon).tot;
    for (let sg = 30; sg <= 350; sg += 10) {
      const pgMin = Math.max(60, Math.ceil((protein - base.protein - sg * sP) / pP / 5) * 5);
      const pg = Math.min(MAX_PROTEIN_G_PER_MEAL, pgMin);
      const k = base.kcal + sg * sK + pg * pK, P = base.protein + sg * sP + pg * pP;
      const short = Math.max(0, protein - P);
      // lexicographic: protein floor, then kcal distance, then prefer default knobs
      const score = short * 1e6 + Math.abs(k - kcal) + (bi + ki) * 5 + ai * 2 + pg * MEAT_W + addon.reduce((s, [id]) => s + (opts.addonUse?.[id] || 0), 0) * ADDON_REPEAT_W;
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
// Ties: candidates are pre-sorted by cost (stable, options order), so equal scores → cheaper first, then options order.
export function applyBudget({ slots, options, slotCost, fixed = 0, budget, cap = 3, score }) {
  const cur = [...slots]; const steps = [];
  const total = () => fixed + cur.reduce((s, id, i) => s + slotCost(id, i), 0);
  let cost = total();
  while (budget != null && cost > budget) {
    let worst = 0;
    for (let i = 1; i < cur.length; i++) if (slotCost(cur[i], i) > slotCost(cur[worst], worst)) worst = i;
    const now = slotCost(cur[worst], worst);
    const cand = options.filter(id => slotCost(id, worst) < now && cur.filter(x => x === id).length < cap)
      .sort((a, b) => slotCost(a, worst) - slotCost(b, worst));
    if (!cand.length) return { slots: cur, cost, swaps: steps.length, overBudget: true, steps };
    const fits = score ? cand.filter(id => cost - now + slotCost(id, worst) <= budget).sort((a, b) => score(b) - score(a)) : [];
    cur[worst] = fits[0] || cand[0]; cost = total(); steps.push(cost);
  }
  return { slots: cur, cost, swaps: steps.length, overBudget: false, steps };
}
const proteinCost = (food, id, proteinG) => { const f = food(id); const [, k] = COOKED_TO_RAW[id] || [id, 1]; return proteinG / (f.protein / 100) / k * priceOf(food, id).rawPrice / 500; };
// Full weekly plan with optional budget: swaps a dinner(d)+lunch(d+1) protein pair together.
export function planWeek(targets, food, recipes, opts = {}) {
  let week = generateWeek(targets, food, recipes, opts);
  const cost = w => shoppingList(w, food).reduce((s, x) => s + x.cost, 0);
  let total = cost(week);
  const infeasible = feasibility(targets);
  if (opts.budget == null || total <= opts.budget) return { week, cost: total, overBudget: false, swaps: 0, infeasible, unfit: [] };
  // R9-1: loop on the *real* regenerated cost (portions change after a swap), max 7 rounds.
  // A34: report days that were ok before swapping but are not ok after (`unfit`), so the page can warn.
  const base = week; let swaps = 0, stalled = false;
  const options = (opts.proteins || PROTEINS).filter(id => food(id));
  for (let round = 0; round < 7 && total > opts.budget; round++) {
    const slots = week.map(d => d.dinnerProtein);
    const pairG = week.map((d, i) => d.proteinG + week[(i + 1) % 7].proteinG); // grams of cooked protein in the pair
    const pairP = slots.map((id, i) => pairG[i] * food(id).protein / 100);
    const fixed = total - slots.reduce((s, id, i) => s + proteinCost(food, id, pairP[i]), 0);
    const r = applyBudget({ slots, options, slotCost: (id, i) => proteinCost(food, id, pairP[i]), fixed, budget: opts.budget, score: id => proteinScore(id, food) });
    if (!r.swaps) break;
    const next = generateWeek(targets, food, recipes, { ...opts, dinnerProteins: r.slots }); const nextCost = cost(next);
    if (nextCost >= total) { stalled = true; break; } // estimate disagreed with real portions: keep the cheaper week (monotonic)
    swaps += r.swaps; week = next; total = nextCost;
  }
  // Still over budget: fall back to the cheapest week the greedy can reach (budget 0), so cost never rises as budget falls.
  if (stalled && total > opts.budget && opts.budget > 0) { const m = planWeek(targets, food, recipes, { ...opts, budget: 0 }); if (m.cost < total) { week = m.week; total = m.cost; swaps = m.swaps; } }
  const unfit = week.map((d, i) => (base[i].fit === 'ok' && d.fit !== 'ok' ? i : -1)).filter(i => i >= 0);
  return { week, cost: total, overBudget: total > opts.budget, swaps, infeasible, unfit };
}

export function shoppingList(days, food) {
  const agg = {};
  for (const d of days) for (const m of d.meals) for (const [id, g] of m.items) {
    const [rawId, f] = COOKED_TO_RAW[id] || [id, 1];
    const a = agg[rawId] || (agg[rawId] = { g: 0, cost: 0 });
    a.g += g / f; a.cost += (g / f) * priceOf(food, id).rawPrice / 500;
  }
  return Object.entries(agg).map(([id, a]) => { const f = food(id); return { id, name: f?.name || id, cat: f?.cat || '', g: Math.round(a.g), cost: f ? a.cost : 0 }; }).sort((a, b) => a.cat.localeCompare(b.cat) || b.g - a.g);
}

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
export const distinctVeg = (week, food) => new Set(week.flatMap(d => d.meals.flatMap(m => m.items.map(([id]) => id))).filter(id => food(id)?.cat === '蔬菜')).size;
