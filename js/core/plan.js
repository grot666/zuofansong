import { totals } from './foods.js';
// Weekly plan generator. Pure; takes food lookup fn so it is testable.
// Each day: breakfast template + lunch + dinner (staple + protein + veg recipe) + optional fruit.
// Scales staple and protein portions so kcal is within ±5% of target and protein >= target.

export const BREAKFASTS = [
  { name: '燕麦牛奶粥 + 鸡蛋', items: [['oatsDry', 40], ['milk', 250], ['eggUSDA', 100]] },
  { name: '水煮蛋 + 玉米 + 无糖酸奶', items: [['eggBoiled', 100], ['corn', 200], ['yogurt', 150]] },
  { name: '全麦面包 + 鸡蛋 + 牛奶', items: [['wwBread', 70], ['eggUSDA', 100], ['milk', 250]] },
];
export const PROTEINS = ['thighRoasted', 'breastRoasted', 'shrimpCooked', 'seabass', 'tofuFirm', 'porkLoin', 'basa', 'leanBeef', 'tunaLight'];
export const STAPLES = ['riceCooked', 'brownRiceCooked', 'milletCooked', 'sweetPotatoBaked'];
// raw-purchase conversion: shopping list buys raw; cooked weight / factor = raw
export const COOKED_TO_RAW = { riceCooked: ['rice', 2.3], brownRiceCooked: ['brownRice', 2.4], milletCooked: ['millet', 2.6], thighRoasted: ['chickenThigh', 0.75], breastRoasted: ['chickenBreast', 0.75], shrimpCooked: ['shrimp', 0.85], sweetPotatoBaked: ['sweetPotato', 0.85], eggUSDA: ['egg', 1], eggBoiled: ['egg', 1] };

const sum = (items, food) => totals(items, food);

// A9 split: selectWeek picks *what* (deterministic from seed), portionDay picks *how much*.
// dinnerProteins[d] is cooked once for dinner(d) and lunch(d+1); lunch(0) uses dinnerProteins[6] (last week's batch).
export function selectWeek(food, recipes, opts = {}) {
  const seed = opts.seed ?? 0;
  const proteins = (opts.proteins || PROTEINS).filter(id => food(id));
  const vegs = recipes.filter(r => r.items.every(([id]) => food(id)));
  const dinnerProteins = opts.dinnerProteins || Array.from({ length: 7 }, (_, d) => proteins[(d + seed) % proteins.length]);
  return dinnerProteins.map((pDinner, d) => ({
    day: d, bf: BREAKFASTS[(d + seed) % BREAKFASTS.length], pDinner, pLunch: dinnerProteins[(d + 6) % 7],
    staple: STAPLES[(Math.floor(d / 2) + seed) % STAPLES.length],
    vegL: vegs[(d * 2 + seed) % vegs.length], vegD: vegs[(d * 2 + 1 + seed) % vegs.length],
  }));
}
export function portionDay(sk, { kcal, protein }, food) {
  const { bf, pDinner, pLunch, staple, vegL, vegD } = sk;
  let pg = 120, sg = 150;
  const build = () => {
    const meals = [
      { name: '早餐', title: bf.name, items: bf.items },
      { name: '午餐', title: `${food(staple).name} + ${food(pLunch).name} + ${vegL.name}`, items: [[staple, sg], [pLunch, pg], ...vegL.items.map(([id, g]) => [id, g / 2]), ['oil', vegL.oil / 2]] },
      { name: '晚餐', title: `${food(staple).name} + ${food(pDinner).name} + ${vegD.name}`, items: [[staple, sg], [pDinner, pg], ...vegD.items.map(([id, g]) => [id, g / 2]), ['oil', vegD.oil / 2]] },
      { name: '加餐', title: '猕猴桃', items: [['kiwi', 100]] },
    ];
    return { meals, tot: sum(meals.flatMap(m => m.items), food) };
  };
  let r = build();
  for (let i = 0; i < 40 && r.tot.protein < protein; i++) { pg += 10; r = build(); }
  for (let i = 0; i < 60; i++) {
    const diff = r.tot.kcal - kcal;
    if (Math.abs(diff) <= kcal * 0.03) break;
    sg = Math.max(50, Math.min(350, sg - Math.sign(diff) * 10)); r = build();
    if (sg === 50 || sg === 350) break;
  }
  // staple trimming also removes some protein; top protein back up (protein floor wins over kcal band)
  for (let i = 0; i < 20 && r.tot.protein < protein; i++) { pg += 5; r = build(); }
  return { day: sk.day, ...r, dinnerProtein: pDinner, staple, proteinG: pg, stapleG: sg };
}
export function generateWeek(targets, food, recipes, opts = {}) {
  return selectWeek(food, recipes, opts).map(sk => portionDay(sk, targets, food));
}

// RESEARCH-R6 §R6.3 greedy. slots: protein id per slot; slotCost(id, i): CNY for slot i with id (protein held constant).
// options: candidate ids. Returns { slots, cost, swaps, overBudget, steps }.
export function applyBudget({ slots, options, slotCost, fixed = 0, budget, cap = 3 }) {
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
    cur[worst] = cand[0]; cost = total(); steps.push(cost);
  }
  return { slots: cur, cost, swaps: steps.length, overBudget: false, steps };
}
const proteinCost = (food, id, proteinG) => { const f = food(id); const [rawId, k] = COOKED_TO_RAW[id] || [id, 1]; const raw = food(rawId) || f; return proteinG / (f.protein / 100) / k * (raw.priceCNYPer500g || 0) / 500; };
// Full weekly plan with optional budget: swaps a dinner(d)+lunch(d+1) protein pair together.
export function planWeek(targets, food, recipes, opts = {}) {
  let week = generateWeek(targets, food, recipes, opts);
  const cost = w => shoppingList(w, food).reduce((s, x) => s + x.cost, 0);
  let total = cost(week);
  if (opts.budget == null || total <= opts.budget) return { week, cost: total, overBudget: false, swaps: 0 };
  const slots = week.map(d => d.dinnerProtein);
  const pairG = week.map((d, i) => d.proteinG + week[(i + 1) % 7].proteinG); // grams of cooked protein in the pair
  const pairP = slots.map((id, i) => pairG[i] * food(id).protein / 100);
  const fixed = total - slots.reduce((s, id, i) => s + proteinCost(food, id, pairP[i]), 0);
  const options = (opts.proteins || PROTEINS).filter(id => food(id));
  const r = applyBudget({ slots, options, slotCost: (id, i) => proteinCost(food, id, pairP[i]), fixed, budget: opts.budget });
  week = generateWeek(targets, food, recipes, { ...opts, dinnerProteins: r.slots });
  total = cost(week);
  return { week, cost: total, overBudget: total > opts.budget, swaps: r.swaps };
}

export function shoppingList(days, food) {
  const agg = {};
  for (const d of days) for (const m of d.meals) for (const [id, g] of m.items) {
    const [rawId, f] = COOKED_TO_RAW[id] || [id, 1];
    agg[rawId] = (agg[rawId] || 0) + g / f;
  }
  return Object.entries(agg).map(([id, g]) => { const f = food(id); return { id, name: f?.name || id, cat: f?.cat || '', g: Math.round(g), cost: f ? (f.priceCNYPer500g || 0) * g / 500 : 0 }; }).sort((a, b) => a.cat.localeCompare(b.cat) || b.g - a.g);
}

export function checkWeek(days, { kcal, protein }) {
  return days.map(d => ({ day: d.day, kcalOk: Math.abs(d.tot.kcal - kcal) <= kcal * 0.05, proteinOk: d.tot.protein >= protein - 0.5 }));
}
