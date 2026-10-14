// Official Shanghai retail price references (docs/RESEARCH-R7.md §R7.3, R9.3). Merged over food estimates; user overrides win.
const SH = '上海市发改委 主副食品价格 2026-10-14（均价）';
const EST = '无官方价，估算';
export const PRICE_REFS = [
  { id: 'porkLoin', priceCNYPer500g: 17.50, priceSource: SH, priceDate: '2026-10-14' },
  { id: 'egg', priceCNYPer500g: 5.89, priceSource: SH, priceDate: '2026-10-14' },
  { id: 'eggUSDA', priceCNYPer500g: 5.89, priceSource: SH, priceDate: '2026-10-14' },
  { id: 'rice', priceCNYPer500g: 2.81, priceSource: SH, priceDate: '2026-10-14' },
  // R9-6: no official price for these; keep the food's own estimate but label it explicitly.
  ...['thighRoasted', 'breastRoasted', 'chickenThigh', 'chickenBreast', 'tofuFirm', 'seabass', 'basa', 'sole', 'tunaLight', 'shrimp', 'shrimpCooked']
    .map(id => ({ id, priceEstimate: true, priceNote: EST })),
  { id: 'leanBeef', priceEstimate: true, priceNote: '估算；官方均价 腱子 52.29、牛腩 44.70 元/斤，本应用取值更低（瘦肉价差大）' },
];
