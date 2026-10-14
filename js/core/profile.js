// Shared profile defaults (owner's plan doc) + normalization + pace check (R-01b, RESEARCH-R6 §R6.1).
export const DEFAULT_PROFILE = { sex: 'male', birth: '1997-07-31', height: 173.5, weight: 74, goalWeight: 58, goalDate: '2027-07-31', activity: 'sedentary', deficitPct: 20, proteinMode: 'fixed', proteinTarget: 140, proteinPerKg: 1.6, bodyFatPct: 27.5, proteinPerFfm: 2.5, fatPct: 25, scoopG: 24, maxScoops: 2, trainingDays: 2, usesPowder: false, bedtime: '23:30', dinnerGapH: 3, caffeineGapH: 6, sleepNudges: true };
const NUM = ['height', 'weight', 'goalWeight', 'deficitPct', 'proteinTarget', 'proteinPerKg', 'bodyFatPct', 'proteinPerFfm', 'fatPct', 'scoopG', 'maxScoops', 'trainingDays', 'dinnerGapH', 'caffeineGapH'];
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export function normalizeProfile(p = {}) {
  const out = { ...DEFAULT_PROFILE, ...p };
  for (const k of NUM) { const v = Number(out[k]); out[k] = Number.isFinite(v) ? v : DEFAULT_PROFILE[k]; }
  out.deficitPct = clamp(out.deficitPct, 0, 30);
  out.fatPct = clamp(out.fatPct, 20, 35);
  out.proteinPerKg = clamp(out.proteinPerKg, 1.2, 2.0);
  out.bodyFatPct = clamp(out.bodyFatPct, 3, 60);
  out.dinnerGapH = clamp(out.dinnerGapH, 2, 4);
  out.caffeineGapH = clamp(out.caffeineGapH, 4, 8);
  out.usesPowder = !!out.usesPowder;
  out.sleepNudges = out.sleepNudges !== false && out.sleepNudges !== 'false';
  if (!/^\d{2}:\d{2}$/.test(out.bedtime)) out.bedtime = DEFAULT_PROFILE.bedtime;
  if (!['male', 'female'].includes(out.sex)) out.sex = DEFAULT_PROFILE.sex;
  if (!['fixed', 'bw', 'ffm'].includes(out.proteinMode)) out.proteinMode = DEFAULT_PROFILE.proteinMode;
  return out;
}
import { dayNum } from './dates.js';
// Pure; dates are local 'YYYY-MM-DD'.
export function paceCheck({ currentKg, goalKg, today, goalDate }) {
  if (!(currentKg > 0) || !(goalKg > 0) || !goalDate || !today) return { status: 'incomplete' };
  if (goalKg === currentKg) return { status: 'reached' };
  if (goalKg > currentKg) return { status: 'gain' };
  const days = dayNum(goalDate) - dayNum(today);
  if (!(days > 0)) return { status: 'invalid-date' };
  const weeks = days / 7;
  const kgPerWeek = (currentKg - goalKg) / weeks;
  const pctPerWeek = kgPerWeek / currentKg * 100;
  return { status: pctPerWeek > 1 ? 'fast' : pctPerWeek < 0.25 ? 'slow' : 'ok', days, weeks, kgPerWeek, pctPerWeek };
}
// A21: merge user edits into the *stored* profile only (never freeze defaults). Unknown keys dropped, numbers coerced.
export function mergeProfileEdit(stored = {}, edits = {}) {
  const out = { ...stored };
  for (const [k, v] of Object.entries(edits)) {
    if (!(k in DEFAULT_PROFILE)) continue;
    if (NUM.includes(k)) { const n = Number(v); if (Number.isFinite(n)) out[k] = n; } else if (typeof DEFAULT_PROFILE[k] === 'boolean') out[k] = v === true || v === 'true' || v === 'on'; else out[k] = String(v);
  }
  return out;
}
