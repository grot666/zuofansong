// localStorage wrapper: prefix, schema version + migrations registry, injectable backend, no DOM/alert.
import { localDate } from './dates.js';
export const PREFIX = 'culiang.v1.';
export const SCHEMA_VERSION = 2;
const mem = new Map();
export const memoryBackend = {
  getItem: k => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => { mem.set(k, String(v)); },
  removeItem: k => { mem.delete(k); },
  key: i => [...mem.keys()][i] ?? null,
  get length() { return mem.size; },
};
let backend = null;
export function useBackend(b) { backend = b; }
function be() {
  if (backend) return backend;
  try { if (globalThis.localStorage) return globalThis.localStorage; } catch { /* blocked */ }
  return memoryBackend;
}
function emitError(key, e) {
  try { if (typeof globalThis.dispatchEvent === 'function' && typeof CustomEvent === 'function') globalThis.dispatchEvent(new CustomEvent('storage-error', { detail: { key, message: String((e && e.message) || e) } })); } catch { /* ignore */ }
}
export function get(key, fallback) {
  try { const v = be().getItem(PREFIX + key); return v == null ? fallback : JSON.parse(v); } catch { return fallback; }
}
export function set(key, val) {
  try { be().setItem(PREFIX + key, JSON.stringify(val)); return true; } catch (e) { emitError(key, e); return false; }
}
export function remove(key) { try { be().removeItem(PREFIX + key); } catch { /* ignore */ } }
export function keys() {
  const b = be(); const out = [];
  for (let i = 0; i < b.length; i++) { const k = b.key(i); if (k && k.startsWith(PREFIX)) out.push(k.slice(PREFIX.length)); }
  return out;
}
export const KNOWN_KEYS = ['profile', 'weights', 'customFoods', 'recents', 'riceCurrent', 'riceFavs', 'templates', 'templateUse', 'tplMult', 'undo', 'planSeed', 'weeklyBudget', 'reviews', 'breakFrom', 'breakState', 'prices', 'version'];
const isKnown = k => KNOWN_KEYS.includes(k) || /^log\.\d{4}-\d{2}-\d{2}$/.test(k) || /^logArchive\.\d{4}-\d{2}$/.test(k);
// key = target version. Each migration idempotent.
export const MIGRATIONS = {
  1: () => { /* initial schema */ },
  2: ({ today }) => { // breakFrom -> breakState (A12); open-ended old breaks end today
    const from = get('breakFrom', null);
    if (from != null && get('breakState', null) == null) set('breakState', { from, until: today });
    remove('breakFrom');
  },
};
// A13: one backup copy (overwritten); if the backup cannot be written, abort without bumping version.
export function migrate({ today = localDate() } = {}) {
  let v = Number(get('version', 0)) || 0;
  if (v >= 1 && v < SCHEMA_VERSION && !set('backup.preMigration', exportAll())) return v;
  while (v < SCHEMA_VERSION) { v++; if (MIGRATIONS[v]) MIGRATIONS[v]({ today }); set('version', v); }
  return v;
}
export function exportAll() {
  const data = {};
  for (const k of keys()) { if (k.startsWith('backup.')) continue; try { data[k] = JSON.parse(be().getItem(PREFIX + k)); } catch { /* skip corrupted */ } }
  return { app: 'zuofansong', schema: Number(get('version', SCHEMA_VERSION)) || SCHEMA_VERSION, exportedAt: new Date().toISOString(), data };
}
// A17: replace-mode import. Accepts envelope or legacy flat object; returns keys imported.
// Throws on newer schema (envelope or legacy) or if the pre-import backup cannot be written.
export function importAll(obj, opts = {}) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw new Error('备份格式不正确');
  const env = obj.app && obj.data && typeof obj.data === 'object';
  const data = env ? obj.data : obj;
  const incoming = Number(env ? obj.schema : data.version) || 1;
  if (incoming > SCHEMA_VERSION) throw new Error('备份来自更新的版本，请先更新应用');
  if (!set('backup.preImport', exportAll())) throw new Error('存储空间不足，无法备份当前数据，已取消导入');
  for (const k of keys()) if (!k.startsWith('backup.')) remove(k);
  let n = 0;
  for (const [k, v] of Object.entries(data)) {
    if (k === 'version' || !isKnown(k) || !validValue(k, v)) continue;
    if (set(k, v)) n++;
  }
  set('version', incoming);
  migrate(opts);
  return n;
}
const ARRAY_KEYS = new Set(['weights', 'customFoods', 'recents', 'riceFavs', 'templates']);
function validValue(k, v) {
  if (ARRAY_KEYS.has(k)) return Array.isArray(v);
  if (k.startsWith('log.')) return v && typeof v === 'object' && Array.isArray(v.items);
  return v !== undefined;
}
export function undoImport() {
  const b = get('backup.preImport', null); if (!b) return false;
  for (const k of keys()) if (!k.startsWith('backup.')) remove(k);
  for (const [k, v] of Object.entries(b.data || {})) if (isKnown(k)) set(k, v);
  remove('backup.preImport');
  return true;
}
// A18: true only for real, writable localStorage.
export function isPersistent() {
  let b; try { b = backend || globalThis.localStorage; } catch { return false; }
  if (!b || b === memoryBackend) return false;
  try { b.setItem(PREFIX + '__probe', '1'); b.removeItem(PREFIX + '__probe'); return true; } catch { return false; }
}
export function resetAll() { const b = be(); for (const k of keys()) b.removeItem(PREFIX + k); }
