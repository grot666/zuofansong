// Bedtime / caffeine nudges (R-04/R-12, RESEARCH-R6 §R6.2). Pure; times 'HH:MM', wrap at midnight.
const toMin = hhmm => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const fromMin = m => { const x = ((m % 1440) + 1440) % 1440; return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`; };
export const dinnerDeadline = (bedtime, gapH = 3) => fromMin(toMin(bedtime) - gapH * 60);
export const caffeineCutoff = (bedtime, gapH = 6) => fromMin(toMin(bedtime) - gapH * 60);
// Is time t (HH:MM) after cutoff c, within the evening window before bedtime b? Handles wrap.
export function isAfter(t, cutoff, bedtime) {
  const T = toMin(t), C = toMin(cutoff), B = toMin(bedtime);
  const since = (T - C + 1440) % 1440, span = (B - C + 1440) % 1440;
  return since > 0 && since <= span;
}
export const CAFFEINE_IDS = new Set(['coffee', 'latte', 'milkTea', 'greenTea']);
// entries: [{id, time:'HH:MM', kcal}]; returns {lateMeal, lateCaffeine}
export function sleepNotes(entries, p) {
  if (!p.sleepNudges) return { lateMeal: null, lateCaffeine: null };
  const dd = dinnerDeadline(p.bedtime, p.dinnerGapH), cc = caffeineCutoff(p.bedtime, p.caffeineGapH);
  const lateMeal = entries.find(e => e.kcal >= 300 && isAfter(e.time, dd, p.bedtime)) || null;
  const lateCaffeine = entries.find(e => CAFFEINE_IDS.has(e.id) && isAfter(e.time, cc, p.bedtime)) || null;
  return { lateMeal, lateCaffeine, dinnerBy: dd, caffeineBy: cc };
}
