// R-11b low-oil sauces (docs/RESEARCH-R7.md §R7.1). Ingredient values per 100 g from USDA FDC; kcal/fat are computed, not typed.
export const SAUCE_ING = {
  soy: { name: '酱油', fdc: 174277, kcal: 53, fat: 0.57 },
  oyster: { name: '蚝油', fdc: 174529, kcal: 51, fat: 0.25 },
  sesameOil: { name: '香油', fdc: 171016, kcal: 884, fat: 100 },
  garlic: { name: '蒜', fdc: 169230, kcal: 149, fat: 0.5 },
  ginger: { name: '姜', fdc: 169231, kcal: 80, fat: 0.75 },
  scallion: { name: '葱', fdc: 170005, kcal: 32, fat: 0.19 },
  tomato: { name: '番茄', fdc: 170457, kcal: 18, fat: 0.2 },
  ketchup: { name: '番茄酱', fdc: 168556, kcal: 101, fat: 0.1 },
  sugar: { name: '糖', fdc: 169655, kcal: 387, fat: 0 },
  lemon: { name: '柠檬汁', fdc: 167747, kcal: 22, fat: 0.24 },
  peanutButter: { name: '花生酱', fdc: 172470, kcal: 598, fat: 51.4 },
  vinegar: { name: '醋', fdc: 173469, kcal: 21, fat: 0, note: '苹果醋代替米醋/陈醋（FDC 无米醋）' },
};
export const SAUCES = [
  { id: 's1', name: '葱姜酱油汁', family: '咸鲜', items: [['soy', 10], ['ginger', 5], ['scallion', 10], ['sesameOil', 2]], salty: true },
  { id: 's2', name: '蒜蓉蚝油', family: '蒜香', items: [['oyster', 15], ['garlic', 6], ['soy', 5]], salty: true },
  { id: 's3', name: '番茄汁', family: '番茄', items: [['tomato', 150], ['ketchup', 10], ['sugar', 2]] },
  { id: 's4', name: '柠檬蒜汁', family: '酸爽', items: [['lemon', 15], ['soy', 10], ['garlic', 3], ['sugar', 3]], salty: true },
  { id: 's5', name: '花生酱拌汁', family: '坚果', items: [['peanutButter', 8], ['soy', 8], ['vinegar', 5], ['garlic', 3]], allergen: ['花生'], salty: true },
  { id: 's6', name: '轻糖醋汁', family: '糖醋', items: [['vinegar', 15], ['soy', 5], ['sugar', 5], ['ginger', 3]] },
];
export const TRAY_STEPS = [
  { text: '淘洗杂粮/米，电饭煲快煮（或取冷藏分装饭微波复热）', min: 3, device: '电饭煲', wrist: true, wristSafe: true },
  { text: '鸡腿肉/虾/豆腐 + 冷冻或切好的蔬菜铺一盘，刷 ≤ 1 茶匙油', min: 6, device: '烤盘/空气炸锅', wrist: true, wristSafe: true, tip: '用厨房剪刀剪块，不用大刀剁切' },
  { text: '放入烤箱/空气炸锅，中途用夹子翻面（不颠锅）', min: 2, wrist: true, wristSafe: true },
  { text: '微波蒸蛋或微波蔬菜', min: 2, device: '微波碗', wrist: true, wristSafe: true },
  { text: '调酱汁（按轮换）', min: 3, wrist: true, wristSafe: true },
  { text: '装盘/分装明日午饭', min: 3, wrist: true, wristSafe: true, tip: '双手端烤盘、戴隔热手套' },
];
