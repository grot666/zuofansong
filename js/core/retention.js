// A11: collapse day logs older than keepDays into monthly daily-totals archives. Pure + store glue.
import { totals } from './foods.js';
import { addDays } from './dates.js';
const KEYS = ['kcal', 'protein', 'fat', 'carbs', 'fiber', 'cost'];
const r1 = x => Math.round(x * 10) / 10;
// logs: {date: log}; archives: {'YYYY-MM': {date: totals}} → {archives, removed: [date]}
export function compact(logs, archives, today, food, keepDays = 180) {
  const cutoff = addDays(today, -keepDays);
  const out = JSON.parse(JSON.stringify(archives || {})); const removed = [];
  for (const [date, log] of Object.entries(logs)) {
    if (date >= cutoff) continue;
    const t = totals(log.items || [], food); const m = date.slice(0, 7);
    out[m] = out[m] || {};
    out[m][date] = { ...Object.fromEntries(KEYS.map(k => [k, r1(t[k])])), water: log.water || 0, n: (log.items || []).length };
    removed.push(date);
  }
  return { archives: out, removed };
}
// S: store module. Writes the archive before removing any day log (crash-safe: worst case duplicate data).
export function compactStore(S, today, food, keepDays = 180) {
  const logs = {}; const archives = {};
  for (const k of S.keys()) {
    if (k.startsWith('log.')) logs[k.slice(4)] = S.get(k);
    else if (k.startsWith('logArchive.')) archives[k.slice(11)] = S.get(k);
  }
  const r = compact(logs, archives, today, food, keepDays);
  if (!r.removed.length) return 0;
  for (const [m, v] of Object.entries(r.archives)) if (!S.set('logArchive.' + m, v)) return 0;
  for (const d of r.removed) S.remove('log.' + d);
  return r.removed.length;
}
