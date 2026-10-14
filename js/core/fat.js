// Fat wallet. entries: [{ name, fat, fatClass: 'high'|'low'|'neutral' }]
export function fatWallet(budget, entries) {
  const by = { high: 0, low: 0, neutral: 0 };
  for (const e of entries) by[e.fatClass || 'neutral'] += e.fat || 0;
  const spent = by.high + by.low + by.neutral;
  return { budget, spent: +spent.toFixed(1), left: +(budget - spent).toFixed(1), ...Object.fromEntries(Object.entries(by).map(([k, v]) => [k, +v.toFixed(1)])) };
}
export const TSP_OIL_G = 4.5;
