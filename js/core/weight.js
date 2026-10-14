// Weight series helpers (research R5.3). entries: [{date:'YYYY-MM-DD', weight}] sorted.
const DAY = 86400000;
export function ma7(entries) {
  return entries.map(e => {
    const t = new Date(e.date).getTime();
    const win = entries.filter(x => { const u = new Date(x.date).getTime(); return u <= t && u > t - 7 * DAY; });
    return { date: e.date, weight: e.weight, ma: win.length >= 3 ? win.reduce((s, x) => s + x.weight, 0) / win.length : null };
  });
}
// Weekly change % from the last two MA values ~7 days apart. Returns {deltaKg, pct, status} or null.
export function weeklyStatus(entries) {
  const m = ma7(entries).filter(x => x.ma != null);
  if (m.length < 2) return null;
  const last = m[m.length - 1]; const lt = new Date(last.date).getTime();
  const prev = [...m].reverse().find(x => new Date(x.date).getTime() <= lt - 7 * DAY);
  if (!prev) return null;
  const weeks = (lt - new Date(prev.date).getTime()) / (7 * DAY);
  const deltaKg = (last.ma - prev.ma) / weeks;
  const pct = -deltaKg / prev.ma * 100;
  const status = pct > 1 ? 'fast' : pct >= 0.25 ? 'ok' : Math.abs(deltaKg) < 0.1 ? 'flat' : pct < 0 ? 'up' : 'slow';
  return { deltaKg, pct, status };
}
// R-01 remainder: review warning when the measured loss is > 1% body weight per week.
export const fastNote = st => (st && st.status === 'fast' ? `最近每周减重约 ${Math.round(st.pct * 10) / 10}% 体重，超过 1%/周：容易掉肌肉、难坚持。建议把缺口调小（“我的”页）或选“维持周”。` : '');
