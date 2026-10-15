// Fiber swap suggestions (research R5.2). Values per stated amount from USDA FDC (see RESEARCH R3.1/R4.1).
import { makeIndex, totals } from './foods.js';
import { FOODS } from '../../data/foods.js'; import { FOODS2 } from '../../data/foods2.js'; import { FOODS3 } from '../../data/foods3.js';
// A54: single source for fiber targets (today view, plan, notes). min = plan floor, goal = today-view target, max = upper end of the 25–30 range.
export const FIBER_TARGET = { min: 25, goal: 28, max: 30 };
export const FIBER_RANGE = `${FIBER_TARGET.min}–${FIBER_TARGET.max} g`;
export const PEAS_SIDE_G = 120; // plan/fiber.js FIBER_SIDE: 青豆 per lunch/dinner on capped days
// A54: fiberGain/kcalDelta are computed from food data (add: items added; replace: g of `from` swapped for `to`).
export const SWAP_DEFS = [
  { id: 'oats40', text: '早餐粥里加 40 g 燕麦片', add: [['oatsDry', 40]] },
  { id: 'peas100', text: '饭里拌 100 g 豌豆/青豆', add: [['peas', 100]] },
  { id: 'broc200', text: '晚餐多一份 200 g 白灼西兰花', add: [['broccoliUSDA', 200]] },
  { id: 'spinach200', text: '加一盘 200 g 菠菜', add: [['spinachUSDA', 200]] },
  { id: 'sweetpot', text: '把 150 g 白米饭换成 150 g 烤红薯', replace: { from: 'riceCooked', to: 'sweetPotatoBaked', g: 150 } },
  { id: 'brownhalf', text: '200 g 白米饭换成糙米饭（帮助有限）', replace: { from: 'riceCooked', to: 'brownRiceCooked', g: 200 } },
  { id: 'kiwi2', text: '加 2 个绿心猕猴桃', add: [['kiwiUSDA', 150]] },
  { id: 'mushroom150', text: '炒菜加 150 g 蘑菇', add: [['mushroom', 150]] },
];
const r1 = x => Math.round(x * 10) / 10;
export function computeSwaps(food) {
  return SWAP_DEFS.map(d => {
    const t = d.add ? totals(d.add, food) : null;
    const r = d.replace && [totals([[d.replace.to, d.replace.g]], food), totals([[d.replace.from, d.replace.g]], food)];
    return { ...d, fiberGain: r1(t ? t.fiber : r[0].fiber - r[1].fiber), kcalDelta: Math.round(t ? t.kcal : r[0].kcal - r[1].kcal) };
  });
}
export const SWAPS = computeSwaps(makeIndex(FOODS, FOODS2, FOODS3));

// Rulings R8 · N-04: filter (fiberGain ≥ 3, kcalDelta ≤ room, rice replacements need logged riceCooked g, ≤1 rice swap),
// sort score = fiberGain / max(kcalDelta, 20) desc, tie → lower kcalDelta, then id. Top n; gutHigh appends water.
const RICE_MIN = { sweetpot: 150, brownhalf: 200 };
const score = s => s.fiberGain / Math.max(s.kcalDelta, 20);
export function suggestFiber({ fiber, fiberTarget = FIBER_TARGET.goal, kcal, kcalTarget, riceG = 0, gutHigh = false }, n = 3) {
  if (fiber >= fiberTarget) return [];
  const room = kcalTarget * 1.05 - kcal;
  const ok = SWAPS.filter(s => s.fiberGain >= 3 && s.kcalDelta <= room && (!s.replace || riceG >= (RICE_MIN[s.id] ?? Infinity)))
    .sort((a, b) => score(b) - score(a) || a.kcalDelta - b.kcalDelta || a.id.localeCompare(b.id));
  const out = []; let rice = false;
  for (const s of ok) { if (s.replace) { if (rice) continue; rice = true; } out.push(s); if (out.length === n) break; }
  if (gutHigh) out.push({ id: 'water', text: '多喝 500 ml 水（加纤维时一定要配水）', fiberGain: 0, kcalDelta: 0 });
  return out;
}
