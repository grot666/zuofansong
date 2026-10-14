// Fiber swap suggestions (research R5.2). Values per stated amount from USDA FDC (see RESEARCH R3.1/R4.1).
export const SWAPS = [
  { id: 'oats40', text: '早餐粥里加 40 g 燕麦片', fiberGain: 4.2, kcalDelta: 156, add: [['oatsDry', 40]] },
  { id: 'peas100', text: '饭里拌 100 g 豌豆/青豆', fiberGain: 5.7, kcalDelta: 81, add: [['peas', 100]] },
  { id: 'broc200', text: '晚餐多一份 200 g 白灼西兰花', fiberGain: 6.6, kcalDelta: 70, add: [['broccoliUSDA', 200]] },
  { id: 'spinach200', text: '加一盘 200 g 菠菜', fiberGain: 4.4, kcalDelta: 46, add: [['spinachUSDA', 200]] },
  { id: 'sweetpot', text: '把 150 g 白米饭换成 150 g 烤红薯', fiberGain: 4.4, kcalDelta: -60, replace: true },
  { id: 'brownhalf', text: '200 g 白米饭换成糙米饭（帮助有限）', fiberGain: 2.4, kcalDelta: -14, replace: true },
  { id: 'kiwi2', text: '加 2 个绿心猕猴桃', fiberGain: 4.5, kcalDelta: 92, add: [['kiwiUSDA', 150]] },
  { id: 'mushroom150', text: '炒菜加 150 g 蘑菇', fiberGain: 1.5, kcalDelta: 33, add: [['mushroom', 150]] },
];

// Rulings R8 · N-04: filter (fiberGain ≥ 3, kcalDelta ≤ room, rice replacements need logged riceCooked g, ≤1 rice swap),
// sort score = fiberGain / max(kcalDelta, 20) desc, tie → lower kcalDelta, then id. Top n; gutHigh appends water.
const RICE_MIN = { sweetpot: 150, brownhalf: 200 };
const score = s => s.fiberGain / Math.max(s.kcalDelta, 20);
export function suggestFiber({ fiber, fiberTarget = 28, kcal, kcalTarget, riceG = 0, gutHigh = false }, n = 3) {
  if (fiber >= fiberTarget) return [];
  const room = kcalTarget * 1.05 - kcal;
  const ok = SWAPS.filter(s => s.fiberGain >= 3 && s.kcalDelta <= room && (!s.replace || riceG >= (RICE_MIN[s.id] ?? Infinity)))
    .sort((a, b) => score(b) - score(a) || a.kcalDelta - b.kcalDelta || a.id.localeCompare(b.id));
  const out = []; let rice = false;
  for (const s of ok) { if (s.replace) { if (rice) continue; rice = true; } out.push(s); if (out.length === n) break; }
  if (gutHigh) out.push({ id: 'water', text: '多喝 500 ml 水（加纤维时一定要配水）', fiberGain: 0, kcalDelta: 0 });
  return out;
}
