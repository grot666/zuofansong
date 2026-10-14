// A45: split from js/core/plan.js (select). Import via js/core/plan.js (facade).
import { mealScores } from '../scores.js';
// Weekly plan generator. Pure; takes food lookup fn so it is testable.
// Each day: breakfast template + lunch + dinner (staple + protein + veg recipe) + optional fruit.
// Scales staple and protein portions so kcal is within ±5% of target and protein >= target.

export const BREAKFASTS = [
  { name: '燕麦牛奶粥 + 鸡蛋', items: [['oatsDry', 40], ['milk', 250], ['eggUSDA', 100]] },
  { name: '水煮蛋 + 玉米 + 无糖酸奶', items: [['eggBoiled', 100], ['corn', 200], ['yogurt', 150]] },
  { name: '全麦面包 + 鸡蛋 + 牛奶', items: [['wwBread', 70], ['eggUSDA', 100], ['milk', 250]] },
];
export const PROTEINS = ['thighRoasted', 'breastRoasted', 'shrimpCooked', 'seabass', 'tofuFirm', 'porkLoin', 'basa', 'leanBeef', 'sole'];
// A33: canned tuna is an add-on only (100 g), never a main; one weekly gram budget shared with review.js.
export const STAPLES = ['riceCooked', 'brownRiceCooked', 'milletCooked', 'sweetPotatoBaked'];
// raw-purchase conversion: shopping list buys raw; cooked weight / factor = raw


// A9 split: selectWeek picks *what* (deterministic from seed), portionDay picks *how much*.
// dinnerProteins[d] is cooked once for dinner(d) and lunch(d+1); lunch(0) uses dinnerProteins[6] (last week's batch).
export const vegScore = (r, food) => { const sc = mealScores([...r.items, ['oil', r.oil || 0]], food); return sc.health + sc.easy + sc.cheap + sc.tasty; };
export function rankVeg(vegs, food) {
  const sc = new Map(vegs.map(r => [r.id, vegScore(r, food)]));
  return [...vegs].sort((a, b) => sc.get(b.id) - sc.get(a.id) || a.id.localeCompare(b.id, 'en', { numeric: true }));
}
// Proteins ranked by the 4 scores of a standard plate (rice 150 + protein 150 + 上海青 250 + oil 6).
export const proteinScore = (id, food) => { const sc = mealScores([['riceCooked', 150], [id, 150], ['shanghaiQing', 250], ['oil', 6]], food); return sc.health + sc.easy + sc.cheap + sc.tasty; };
// A38: snapshot helper only (A36). Base rotation must stay seed-only (DECISIONS 06:13); budget swaps use proteinScore.
export const rankProteins = (ids, food) => { const sc = new Map(ids.map(id => [id, proteinScore(id, food)])); return [...ids].sort((a, b) => sc.get(b) - sc.get(a) || ids.indexOf(a) - ids.indexOf(b)); };
// Ingredient reuse: walk the seed-rotated ranking and, from the next REUSE_WINDOW unused recipes,
// take the one adding the fewest new vegetables (ties keep rank order). Deterministic in seed.
export const REUSE_WINDOW = 5;
export const PICK_MAX_ITER = 1000; // A46: bounded loop
export function pickReuse(vegs, start, food) {
  if (!vegs.length) return []; // A40: nothing usable → no picks (was an infinite loop)
  const order = Array.from({ length: vegs.length }, (_, i) => vegs[(i + start) % vegs.length]);
  const vegIds = r => r.items.map(([id]) => id).filter(id => food(id)?.cat === '蔬菜');
  const have = new Set(), out = [], used = new Set();
  for (let it = 0; out.length < 14 && it < PICK_MAX_ITER; it++) {
    const cand = order.filter(r => !used.has(r.id)).slice(0, REUSE_WINDOW);
    if (!cand.length) { used.clear(); continue; }
    let best = cand[0], bn = Infinity;
    for (const r of cand) { const n = vegIds(r).filter(id => !have.has(id)).length; if (n < bn) { bn = n; best = r; } }
    used.add(best.id); out.push(best); vegIds(best).forEach(id => have.add(id));
  }
  return out;
}
export function selectWeek(food, recipes, opts = {}) {
  const seed = opts.seed ?? 0;
  const proteins = (opts.proteins || PROTEINS).filter(id => food(id));
  // G1 follow-up: meal scores steer selection. Seed 0 uses the 14 best-scoring veg recipes; later seeds rotate on.
  // R9-10: optional prep-time limit (minutes); falls back to all recipes if none qualify.
  const ok = recipes.filter(r => r.items.every(([id]) => food(id)));
  const quick = opts.maxPrepMin ? ok.filter(r => r.min <= opts.maxPrepMin) : ok;
  const vegs = rankVeg(quick.length ? quick : ok, food);
  const picks = opts.reuse === false ? Array.from({ length: 14 }, (_, i) => vegs[(i + seed * 14) % vegs.length]) : pickReuse(vegs, seed * 14, food);
  const dinnerProteins = opts.dinnerProteins || Array.from({ length: 7 }, (_, d) => (proteins.length ? proteins[(d + seed) % proteins.length] : null)); // A47: null when none usable
  return dinnerProteins.map((pDinner, d) => ({
    day: d, bf: BREAKFASTS[(d + seed) % BREAKFASTS.length], pDinner, pLunch: dinnerProteins[(d + 6) % 7],
    staple: STAPLES[(Math.floor(d / 2) + seed) % STAPLES.length],
    vegL: picks[d * 2] || null, vegD: picks[d * 2 + 1] || null,
  }));
}
