// R11-5: 聚餐 / hotpot mode (RESEARCH-R11 §R11.3). Pure; no DOM. Neutral copy only (see BANNED_WORDS + test).
export const SOCIAL_TYPES = { hotpot: '火锅', chinese: '中餐', bbq: '烧烤' };
// Protein-first order, per 100 g edible (raw). Sources: 中国食物成分表 查询平台 ids (营养所), FDC proxy marked.
export const HOTPOT_PROTEIN = [
  { name: '鱿鱼(水浸)', src: '平台 #1131', kcal: 76, protein: 17.0, fat: 0.8 },
  { name: '牛肚', src: '平台 #834', kcal: 73, protein: 14.5, fat: 1.6 },
  { name: '基围虾', src: '平台 #1093', kcal: 102, protein: 18.2, fat: 1.4 },
  { name: '牛肉(肥瘦)', src: '平台 #823', kcal: 126, protein: 19.9, fat: 4.2 },
  { name: '鸭血', src: '平台 #899', kcal: 109, protein: 13.6, fat: 0.4 },
  { name: '北豆腐', src: '平台 #334', kcal: 99, protein: 12.2, fat: 4.8 },
];
export const HOTPOT_LOW = [ // low protein per kcal: enjoy, just later and fewer
  { name: '肥牛', src: 'FDC 172159 (美国部位近似)', kcal: 195, protein: 20.1, fat: 12.8 },
  { name: '羊肉(肥瘦)', src: '平台 #844', kcal: 202, protein: 19.0, fat: 14.1 },
  { name: '午餐肉', src: '平台 #807', kcal: 228, protein: 9.4, fat: 15.9 },
];
export const HOTPOT_VEG = ['金针菇', '冬瓜', '菌菇', '绿叶菜'];
// Dips: measurable fat (平台 #1508 香油 882 kcal/99.7 g fat; 芝麻酱 app sesamePaste 618/52.7).
export const DIPS = [{ name: '香油', g: 10, kcal: 88, fat: 10 }, { name: '芝麻酱', g: 20, kcal: 124, fat: 10.5 }];
export const MIN_OIL_G = 5; // cooking oil per other meal never goes below this
const MEALS = ['breakfast', 'lunch', 'dinner'];
const MEAL_CN = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐' };
// A65/R13-1: concrete levers on the planned non-social meals, in this order, at equal protein. tofu→豆干 excluded (adds kcal).
// [from ids, to id, 'protein' = to grams keep protein | 'same' = same grams]
export const LEVERS = [
  [['egg', 'eggUSDA', 'eggBoiled'], 'eggWhite', 'protein'],
  [['milk'], 'milkSkim', 'same'],
  [['porkLoin'], 'breastRoasted', 'protein'],
  [['thighRoasted'], 'breastRoasted', 'protein'],
  [['qianzhang'], 'tofuFirm', 'protein'],
];
const OIL = 'oil';
// day: a planned day ({meals:[{name, items:[[id,g]]}]}); returns [{meal, from, to, g, toG, fatG, kcalDelta}].
export function socialLevers(day, meal, food) {
  const out = [];
  for (const m of day?.meals || []) {
    if (m.name === MEAL_CN[meal]) continue; // never touch the social meal
    for (const [id, g] of m.items) {
      const f = food(id); if (!f || !(g > 0)) continue;
      if (id === OIL) { if (g > MIN_OIL_G) out.push({ meal: m.name, from: id, to: id, g, toG: MIN_OIL_G, fatG: (g - MIN_OIL_G) * f.fat / 100, kcalDelta: -(g - MIN_OIL_G) * f.kcal / 100 }); continue; }
      const lv = LEVERS.find(([from, to]) => from.includes(id) && food(to)); if (!lv) continue;
      const t = food(lv[1]); const toG = lv[2] === 'same' ? g : Math.round(g * f.protein / t.protein);
      const fatG = (g * f.fat - toG * t.fat) / 100; if (fatG <= 0) continue;
      out.push({ meal: m.name, from: id, to: lv[1], g, toG, fatG, kcalDelta: (toG * t.kcal - g * f.kcal) / 100 });
    }
  }
  return out;
}
// Pre-allocate fat to the social meal from the planned day only. No plan/log → no number (reserveFatG null).
export function preAllocate(targets, { meal = 'dinner', day = null, food = null } = {}) {
  if (!MEALS.includes(meal)) throw new Error('meal');
  const levers = day && food ? socialLevers(day, meal, food) : [];
  const reserveFatG = day && food ? Math.round(levers.reduce((s, l) => s + l.fatG, 0) * 10) / 10 : null;
  const freedKcal = Math.round(-levers.reduce((s, l) => s + l.kcalDelta, 0));
  return { levers, reserveFatG, freedKcal, minOilG: MIN_OIL_G, kcal: targets.kcal };
}
// The day after: same targets as any other day (never below plan), neutral line.
export const nextDayTargets = targets => ({ ...targets });
export const NEXT_DAY_LINE = '昨天聚餐，按计划吃就好。';
export const BANNED_WORDS = ['补偿', '惩罚', '作弊', '超标', '罪恶', '破戒', '欺骗餐'];
const leverLine = (l, food) => l.from === l.to ? `${l.meal}油 ${Math.round(l.g)}→${l.toG} g` : `${l.meal}${food(l.from)?.name || l.from} ${Math.round(l.g)} g → ${food(l.to)?.name || l.to} ${l.toG} g`;
export const leverLines = (r, food) => r.levers.map(l => `${leverLine(l, food)}（少 ${Math.round(l.fatG * 10) / 10} g 脂肪）`);
export const socialCopy = (type, meal, reserve, freedKcal = 0) => ({
  title: `今天${meal === 'lunch' ? '午' : '晚'}餐${SOCIAL_TYPES[type] || '聚餐'}`,
  reserve: reserve == null ? `早餐、${meal === 'lunch' ? '晚餐' : '午餐'}少放油，蛋白照常。` : reserve > 0 ? `按今天的菜单换下面几样，蛋白不变，可给聚餐留约 ${reserve} g 脂肪${freedKcal > 0 ? `，约 ${freedKcal} kcal 也留给聚餐` : ''}：` : '今天的菜单已经很清淡，照常吃，蛋白照常。',
  order: type === 'hotpot' ? `先点蛋白：${HOTPOT_PROTEIN.map(x => x.name).join('、')}；再上蔬菜（${HOTPOT_VEG.join('、')}），主食最后。` : '先吃蛋白质菜和蔬菜，主食放最后。',
  low: type === 'hotpot' ? `${HOTPOT_LOW.map(x => x.name).join('、')}蛋白占比低，想吃就吃，放在后面、少量即可。` : '油炸、肥肉、甜饮想吃就吃，少量即可。',
  broth: type === 'hotpot' ? '锅底优先清汤/番茄/菌汤。红油锅底吸进食物的油无法精确估算（≈）。' : '餐馆菜的用油和盐无法精确估算（≈）。',
  dip: DIPS.map(d => `${d.name} ${d.g} g ≈ ${d.fat} g 脂肪`).join('，'),
  week: '看一周平均就好，明天按计划吃。',
});
