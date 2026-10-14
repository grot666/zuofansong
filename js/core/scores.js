// G1: 健康/好做/便宜/好吃 1-5 scores for one meal (PROMPT §2). Pure; items are {id,g} or [id,g].
import { totals } from './foods.js';
const r1 = x => Math.round(x * 10) / 10;
export function mealScores(items, food) {
  const fs = items.map(i => food(Array.isArray(i) ? i[0] : i.id)).filter(Boolean);
  const tot = totals(items, food);
  const cost = tot.cost;
  const health = Math.max(1, Math.min(5, 1 + (tot.fiber >= 6 ? 1.5 : tot.fiber / 4) + (tot.protein >= 25 ? 1.5 : tot.protein / 17) + (tot.fat <= 20 ? 1 : 0) - (fs.some(f => f.fatClass === 'low') ? 1 : 0)));
  const easy = Math.round(fs.reduce((s, f) => s + (f.ease || 3), 0) / (fs.length || 1));
  const cheap = cost < 8 ? 5 : cost < 12 ? 4 : cost < 18 ? 3 : cost < 25 ? 2 : 1;
  const tasty = Math.min(5, 2 + ((items.map(i => Array.isArray(i) ? { id: i[0], g: i[1] } : i).find(i => i.id === 'oil')?.g || 0) >= 6 ? 1 : 0) + (fs.some(f => f.tasty === true) ? 1 : 0) + (fs.some(f => (f.tags || []).includes('杂粮')) ? 0.5 : 1));
  return { health: Math.round(health), easy, cheap, tasty: Math.round(tasty), cost: r1(cost), tot };
}
