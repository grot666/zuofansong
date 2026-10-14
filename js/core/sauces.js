// R-11b: sauce nutrition + rotation. Pure.
import { SAUCE_ING } from '../../data/sauces.js';
export function sauceNutrition(s) {
  let kcal = 0, fat = 0;
  for (const [id, g] of s.items) { const f = SAUCE_ING[id]; kcal += f.kcal * g / 100; fat += f.fat * g / 100; }
  return { kcal: Math.round(kcal * 10) / 10, fat: Math.round(fat * 100) / 100 };
}
// Walk enabled cyclically; skip a sauce whose family equals the previous day's (unless only one family).
export function rotateSauces(enabled, days, startIdx = 0) {
  const out = []; if (!enabled.length) return { out, repeatWarning: false };
  const families = new Set(enabled.map(s => s.family));
  let i = startIdx % enabled.length;
  for (let d = 0; d < days; d++) {
    let tries = 0;
    while (families.size > 1 && out.length && enabled[i].family === out[out.length - 1].family && tries++ < enabled.length) i = (i + 1) % enabled.length;
    out.push(enabled[i]); i = (i + 1) % enabled.length;
  }
  return { out, repeatWarning: families.size < 2 && days > 1 };
}
