// A22: local calendar-date helpers. Pure; 'YYYY-MM-DD' strings in the device's local zone.
const pad = n => String(n).padStart(2, '0');
export const localDate = (now = new Date()) => `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
export const dayNum = s => { const [y, m, d] = String(s).split('-').map(Number); return Date.UTC(y, m - 1, d) / 86400000; };
export const addDays = (s, n) => new Date((dayNum(s) + n) * 86400000).toISOString().slice(0, 10);
// G3: remind to export when ≥7 days are logged and the last export is ≥14 days old (or never), unless snoozed.
export function backupDue({ lastExport, snoozeUntil, logDays, today }) {
  if (logDays < 7) return false;
  if (snoozeUntil && dayNum(today) < dayNum(snoozeUntil)) return false;
  return !lastExport || dayNum(today) - dayNum(lastExport) >= 14;
}
