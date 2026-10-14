// Portion multiplier for templates (N-03).
export const MULTS = [0.5, 1, 1.5];
export function scaleItems(items, mult = 1) {
  const m = MULTS.includes(+mult) ? +mult : 1;
  return items.map(([id, g]) => [id, Math.round(g * m * 10) / 10]);
}
