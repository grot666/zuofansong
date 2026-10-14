// Grain-blend math. Ingredient values are per 100 g RAW.
// parts: [{ food, pct }] where food has kcal, protein, fat, carbs, fiber, yield (cooked/raw), soak (bool)
export function blend(parts) {
  const total = parts.reduce((s, p) => s + p.pct, 0) || 1;
  const keys = ['kcal', 'protein', 'fat', 'carbs', 'fiber'];
  const raw = Object.fromEntries(keys.map(k => [k, 0]));
  let yieldF = 0;
  for (const p of parts) {
    const w = p.pct / total;
    for (const k of keys) raw[k] += (p.food[k] || 0) * w;
    yieldF += (p.food.yield || 2.5) * w;
  }
  const cooked = Object.fromEntries(keys.map(k => [k, raw[k] / yieldF]));
  const needsSoak = parts.filter(p => p.food.soak && p.pct > 0).map(p => p.food.name);
  // water: ~1.2x raw volume for white rice; coarse grains need more
  const waterRatio = +(1.2 + 0.4 * parts.filter(p => p.food.id !== 'rice').reduce((s, p) => s + p.pct, 0) / total).toFixed(2);
  return { raw, cooked, yield: +yieldF.toFixed(2), needsSoak, waterRatio };
}

export function rawToCooked(rawG, yieldF) { return rawG * yieldF; }
export function cookedToRaw(cookedG, yieldF) { return cookedG / yieldF; }
