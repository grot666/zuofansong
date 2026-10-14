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
import { dayNum, addDays } from './dates.js';
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
// UX-2: form strings → edits. Blank keeps previous; required fields must be present and > 0.
const REQUIRED = { height: '身高', weight: '体重', birth: '出生日期' };
export function parseProfileForm(form, prev = {}) {
  const edits = {}; const errors = [];
  for (const [k, raw] of Object.entries(form)) {
    if (!(k in DEFAULT_PROFILE)) continue;
    const v = typeof raw === 'string' ? raw.trim() : raw;
    if (v === '' || v == null) { if (REQUIRED[k] && !(prev[k] ?? DEFAULT_PROFILE[k])) errors.push(`请填写${REQUIRED[k]}`); continue; }
    if (NUM.includes(k)) {
      const n = Number(v);
      if (!Number.isFinite(n) || (REQUIRED[k] && n <= 0)) { errors.push(`请填写有效的${REQUIRED[k] || k}`); continue; }
      edits[k] = n;
    } else edits[k] = v;
  }
  return { edits, errors };
}
// UX-6: pure save handler. form = FormData entries; bools = checkbox states.
export function saveProfile(stored = {}, form = {}, bools = {}) {
  const { edits, errors } = parseProfileForm(form, stored);
  if (errors.length) return { ok: false, errors, changed: [] };
  Object.assign(edits, bools);
  const profile = mergeProfileEdit(stored, edits); const norm = normalizeProfile(profile);
  const before = normalizeProfile(stored);
  const changed = Object.keys(DEFAULT_PROFILE).filter(k => norm[k] !== before[k]);
  const clamped = ['deficitPct', 'fatPct', 'proteinPerKg', 'bodyFatPct'].filter(k => k in edits && norm[k] !== Number(edits[k]));
  return { ok: true, profile, changed, clamped, norm, errors: [] };
}
// UX-10: 3-step onboarding. Returns the step to show (1-3) or 0 when hidden.
export const ONBOARD_FIELDS = { 1: ['sex', 'birth', 'height', 'weight'], 2: ['goalWeight', 'goalDate'] };
// A29: savedStep is the persisted `onboardStep` key, so a reload resumes at step 2/3.
export function onboardStep({ storedProfile, onboardSeen, savedStep }) {
  if (onboardSeen) return 0;
  if (savedStep === 2 || savedStep === 3) return savedStep;
  return storedProfile == null ? 1 : 0;
}
// Save only the fields of this step (A21: never freeze defaults).
export function saveOnboardStep(stored, step, form) {
  const keys = ONBOARD_FIELDS[step] || [];
  const sub = Object.fromEntries(Object.entries(form).filter(([k]) => keys.includes(k)));
  const { edits, errors } = parseProfileForm(sub, stored || {});
  if (step === 1) for (const k of ['height', 'weight', 'birth']) if (!String(sub[k] ?? '').trim() && !errors.some(e => e.includes(REQUIRED[k]))) errors.push(`请填写${REQUIRED[k]}`);
  if (errors.length) return { ok: false, errors };
  return { ok: true, profile: mergeProfileEdit(stored || {}, edits) };
}
export const PACE_TEXT = { fast: '偏快（每周 >1% 体重），建议把目标日期往后放', ok: '速度合适', slow: '偏慢，可以再积极一点', reached: '已达到目标体重', gain: '目标高于当前体重（本应用以减脂为主）', 'invalid-date': '目标日期需在今天之后', incomplete: '' };

// Walkthrough fix: onboarding step 2 used to prefill the demo goal (58 kg) whatever the user weighed.
// Keep a plausible stored goal (below current weight, ≤20% loss); otherwise suggest −7% at 0.5 kg/week.
export function suggestGoal({ weight, goalWeight, goalDate }, today) {
  if (goalWeight > 0 && goalWeight < weight && goalWeight >= weight * 0.8 && goalDate > today) return { goalWeight, goalDate };
  const g = Math.round(weight * 0.93 * 2) / 2;
  return { goalWeight: g, goalDate: addDays(today, Math.ceil((weight - g) / 0.5) * 7) };
}
// R-01 remainder: onboarding step 2 shows pace as kg/week and % body weight/week; >1%/week is flagged.
export function paceLine(r) {
  if (!PACE_TEXT[r.status]) return '';
  const n = x => Math.round(x * 10) / 10;
  return '减重速度：' + PACE_TEXT[r.status] + (r.kgPerWeek > 0 ? `（约 ${n(r.kgPerWeek)} kg/周，${n(r.pctPerWeek)}% 体重/周${r.status === 'fast' ? '，建议 ≤1%' : ''}）` : '');
}
