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
const SHARE = { breakfast: 0.25, lunch: 0.35, dinner: 0.4 };
const MEALS = ['breakfast', 'lunch', 'dinner'];
// Pre-allocate the day's fat to the social meal: other meals keep their protein share and drop to ~half their fat
// (cooking oil to MIN_OIL_G, skip high-fat extras). targets: {kcal, protein, fat}.
export function preAllocate(targets, { meal = 'dinner' } = {}) {
  if (!MEALS.includes(meal)) throw new Error('meal');
  const out = MEALS.map(m => ({ meal: m, protein: Math.round(targets.protein * SHARE[m]), fat: Math.round(targets.fat * SHARE[m]) }));
  let moved = 0;
  for (const o of out) if (o.meal !== meal) { const cut = Math.round(o.fat * 0.5); o.fat -= cut; moved += cut; }
  out.find(o => o.meal === meal).fat += moved;
  return { meals: out, reserveFatG: moved, minOilG: MIN_OIL_G, kcal: targets.kcal };
}
// The day after: same targets as any other day (never below plan), neutral line.
export const nextDayTargets = targets => ({ ...targets });
export const NEXT_DAY_LINE = '昨天聚餐，按计划吃就好。';
export const BANNED_WORDS = ['补偿', '惩罚', '作弊', '超标', '罪恶', '破戒', '欺骗餐'];
export const socialCopy = (type, meal, reserve) => ({
  title: `今天${meal === 'lunch' ? '午' : '晚'}餐${SOCIAL_TYPES[type] || '聚餐'}`,
  reserve: `聚餐预留约 ${reserve} g 脂肪：早餐、${meal === 'lunch' ? '晚餐' : '午餐'}照常吃蛋白，少放油（每餐不少于 ${MIN_OIL_G} g）。`,
  order: type === 'hotpot' ? `先点蛋白：${HOTPOT_PROTEIN.map(x => x.name).join('、')}；再上蔬菜（${HOTPOT_VEG.join('、')}），主食最后。` : '先吃蛋白质菜和蔬菜，主食放最后。',
  low: type === 'hotpot' ? `${HOTPOT_LOW.map(x => x.name).join('、')}蛋白占比低，想吃就吃，放在后面、少量即可。` : '油炸、肥肉、甜饮想吃就吃，少量即可。',
  broth: type === 'hotpot' ? '锅底优先清汤/番茄/菌汤。红油锅底吸进食物的油无法精确估算（≈）。' : '餐馆菜的用油和盐无法精确估算（≈）。',
  dip: DIPS.map(d => `${d.name} ${d.g} g ≈ ${d.fat} g 脂肪`).join('，'),
  week: '看一周平均就好，明天按计划吃。',
});
