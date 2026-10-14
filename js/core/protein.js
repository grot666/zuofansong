// Protein gap + gut comfort.
export function proteinGap(target, wholeFood, scoopG = 24, maxScoops = 2) {
  const gap = Math.max(0, target - wholeFood);
  const scoops = Math.min(maxScoops, Math.ceil((gap / scoopG) * 2) / 2);
  const left = Math.max(0, gap - scoops * scoopG);
  return { gap: Math.round(gap), scoops, left: Math.round(left) };
}

// Returns { score 0-10, level, fixes[] }
export function gutRisk({ fiber = 0, water = 0, weight = 70, powderShare = 0, vegServings = 0, trainingDays = 0 }) {
  let s = 0; const fixes = [];
  if (fiber < 15) { s += 3; fixes.push('主食换成杂粮饭（如 大米+燕麦米+糙米）'); } else if (fiber < 25) { s += 1.5; fixes.push('再加一份蔬菜或一个水果'); }
  const wTarget = weight * 30;
  if (water < wTarget * 0.6) { s += 3; fixes.push('多喝水：今天还差约 ' + Math.round(wTarget - water) + ' ml'); } else if (water < wTarget) { s += 1; fixes.push('再喝 1–2 杯水'); }
  if (powderShare > 0.4) { s += 2; fixes.push('蛋白粉占比过高，换部分为鸡蛋/豆腐/鱼'); } else if (powderShare > 0.25) s += 1;
  if (vegServings < 3) { s += 1; fixes.push('蔬菜至少 3 份（每份约 100 g）'); }
  if (trainingDays < 2) { s += 1; fixes.push('饭后散步 10–15 分钟'); }
  const score = Math.min(10, s);
  const level = score >= 6 ? 'high' : score >= 3 ? 'mid' : 'low';
  return { score, level, fixes };
}
