// A45: split from js/core/plan.js (budget). Import via js/core/plan.js (facade).
import { COOKED_TO_RAW, priceOf } from '../foods.js';
import { PROTEINS, proteinScore } from './select.js';
import { feasibility, generateWeek } from './portion.js';
import { shoppingList } from './shopping.js';
// Ties: candidates are pre-sorted by cost (stable, options order), so equal scores → cheaper first, then options order.
export function applyBudget({ slots, options, slotCost, fixed = 0, budget, cap = 3, score }) {
  const cur = [...slots]; const steps = [];
  const total = () => fixed + cur.reduce((s, id, i) => s + slotCost(id, i), 0);
  let cost = total();
  // bounded: each step strictly lowers one slot's cost over a finite option list; hard cap slots × options.
  const maxSteps = cur.length * Math.max(1, options.length);
  while (budget != null && cost > budget && steps.length < maxSteps) {
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
  if (!opts.memo) opts = { ...opts, memo: new Map() };
  let week = generateWeek(targets, food, recipes, opts);
  const cost = w => shoppingList(w, food).reduce((s, x) => s + x.cost, 0);
  let total = cost(week);
  const noVeg = !recipes.some(r => r.items.every(([id]) => food(id)));
  const infeasible = noVeg ? { reason: 'no-veg' } : feasibility(targets); // A40
  if (opts.budget == null || total <= opts.budget) return { week, cost: total, overBudget: false, swaps: 0, infeasible, unfit: [] };
  // R9-1: loop on the *real* regenerated cost (portions change after a swap), max 7 rounds.
  // A34: report days that were ok before swapping but are not ok after (`unfit`), so the page can warn.
  const base = week; let swaps = 0, stalled = false, prev = week;
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
    swaps += r.swaps; prev = week; week = next; total = nextCost;
  }
  // Still over budget: fall back to the cheapest week the greedy can reach (budget 0), so cost never rises as budget falls.
  if (stalled && total > opts.budget && opts.budget > 0) { const m = planWeek(targets, food, recipes, { ...opts, budget: 0 }); if (m.cost < total) { week = m.week; total = m.cost; swaps = m.swaps; } }
  // Still over budget: the greedy can overshoot (estimate vs real portions). Try reverting the 1 slot changed in the
  // last round with the smallest estimated revert penalty; keep it only if the real cost drops (one extra regeneration).
  if (total > opts.budget && !stalled && opts.revert !== false) {
    const pG = week.map((d, i) => (d.proteinG + week[(i + 1) % 7].proteinG));
    const est = (id, i) => proteinCost(food, id, pG[i] * food(id).protein / 100);
    const cand = week.map((d, i) => i).filter(i => week[i].dinnerProtein !== prev[i].dinnerProtein)
      .sort((a, b) => (est(prev[a].dinnerProtein, a) - est(week[a].dinnerProtein, a)) - (est(prev[b].dinnerProtein, b) - est(week[b].dinnerProtein, b)) || a - b).slice(0, 1);
    for (const i of cand) {
      const slots = week.map(d => d.dinnerProtein); slots[i] = prev[i].dinnerProtein;
      const next = generateWeek(targets, food, recipes, { ...opts, dinnerProteins: slots }); const c = cost(next);
      if (c < total - 1e-9) { week = next; total = c; swaps--; }
    }
  }
  const unfit = week.map((d, i) => (base[i].fit === 'ok' && d.fit !== 'ok' ? i : -1)).filter(i => i >= 0);
  return { week, cost: total, overBudget: total > opts.budget, swaps, infeasible, unfit };
}
