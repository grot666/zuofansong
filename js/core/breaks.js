import { addDays } from './dates.js';
// A12: 维持周 (diet break) state. breakState = {from: deficitPct before break, until: 'YYYY-MM-DD' last day}.
export function startBreak(storedProfile, todayStr, days = 7) {
  const from = storedProfile.deficitPct ?? 20;
  return { profile: { ...storedProfile, deficitPct: 0 }, breakState: { from, until: addDays(todayStr, days - 1) } };
}
// Returns restored profile + null state once today > until; otherwise unchanged.
export function resolveBreak(storedProfile, breakState, todayStr) {
  if (!breakState || !breakState.until) return { profile: storedProfile, breakState: null, restored: false };
  if (todayStr > breakState.until) return { profile: { ...storedProfile, deficitPct: breakState.from }, breakState: null, restored: true };
  return { profile: storedProfile, breakState, restored: false };
}
