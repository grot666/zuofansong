// Official Shanghai retail price references (docs/RESEARCH-R7.md §R7.3). Merged over food estimates; user overrides win.
const SH = '上海市发改委 主副食品价格 2026-10-13';
const FX = '奉贤区 主副食品价格监测 2026-10-12（区间中值）';
export const PRICE_REFS = [
  { id: 'porkLoin', priceCNYPer500g: 17.55, priceSource: SH, priceDate: '2026-10-13' },
  { id: 'egg', priceCNYPer500g: 5.91, priceSource: SH, priceDate: '2026-10-13' },
  { id: 'eggUSDA', priceCNYPer500g: 5.91, priceSource: SH, priceDate: '2026-10-13' },
  { id: 'rice', priceCNYPer500g: 3.0, priceSource: FX, priceDate: '2026-10-12' },
];
