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

function sum(items, food) {
  const t = { kcal: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, cost: 0 };
  for (const [id, g] of items) { const f = food(id); if (!f) continue; for (const k of ['kcal', 'protein', 'fat', 'carbs', 'fiber']) t[k] += f[k] * g / 100; t.cost += (f.priceCNYPer500g || 0) * g / 500; }
  return t;
}

export function generateWeek({ kcal, protein }, food, recipes, opts = {}) {
  const seed = opts.seed ?? 0;
  const proteins = (opts.proteins || PROTEINS).filter(id => food(id));
  const vegs = recipes.filter(r => r.items.every(([id]) => food(id)));
  const days = [];
  for (let d = 0; d < 7; d++) {
    const bf = BREAKFASTS[(d + seed) % BREAKFASTS.length];
    // reuse: lunch = tonight's dinner leftovers pattern (batch cook) -> same protein for dinner(d) and lunch(d+1)
    const pDinner = proteins[(d + seed) % proteins.length];
    const pLunch = d === 0 ? proteins[(seed + 6) % proteins.length] : days[d - 1].dinnerProtein;
    const staple = STAPLES[(Math.floor(d / 2) + seed) % STAPLES.length];
    const vegL = vegs[(d * 2 + seed) % vegs.length], vegD = vegs[(d * 2 + 1 + seed) % vegs.length];
    let pg = 120, sg = 150;
    const fruit = [['kiwi', 100]];
    const build = () => {
      const meals = [
        { name: '早餐', title: bf.name, items: bf.items },
        { name: '午餐', title: `${food(staple).name} + ${food(pLunch).name} + ${vegL.name}`, items: [[staple, sg], [pLunch, pg], ...vegL.items.map(([id, g]) => [id, g / 2]), ['oil', vegL.oil / 2]] },
        { name: '晚餐', title: `${food(staple).name} + ${food(pDinner).name} + ${vegD.name}`, items: [[staple, sg], [pDinner, pg], ...vegD.items.map(([id, g]) => [id, g / 2]), ['oil', vegD.oil / 2]] },
        { name: '加餐', title: '猕猴桃', items: fruit },
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
    days.push({ day: d, ...r, dinnerProtein: pDinner, staple, proteinG: pg, stapleG: sg });
  }
  return days;
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
