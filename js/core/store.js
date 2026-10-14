// localStorage wrapper: prefix, schema version + migrations registry, injectable backend, no DOM/alert.
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
export const KNOWN_KEYS = ['profile', 'weights', 'customFoods', 'recents', 'riceCurrent', 'riceFavs', 'templates', 'templateUse', 'tplMult', 'undo', 'planSeed', 'weeklyBudget', 'reviews', 'breakFrom', 'breakState', 'version', 'sleepNoteDay'];
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
const localToday = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
// A13: one backup copy (overwritten); if the backup cannot be written, abort without bumping version.
export function migrate({ today = localToday() } = {}) {
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
// Accepts envelope or legacy flat object. Returns number of keys imported. Throws on newer schema.
export function importAll(obj, opts = {}) {
  if (!obj || typeof obj !== 'object') throw new Error('备份格式不正确');
  let data = obj;
  if (obj.app && obj.data) { if (Number(obj.schema) > SCHEMA_VERSION) throw new Error('备份来自更新的版本，请先更新应用'); data = obj.data; }
  let n = 0;
  for (const [k, v] of Object.entries(data)) if (k !== 'version' && isKnown(k) && set(k, v)) n++;
  // A13: payload without a version is schema 1 so later migrations run on it.
  set('version', Number(data.version) || Number(obj.app && obj.schema) || 1);
  migrate(opts);
  return n;
}
export function resetAll() { const b = be(); for (const k of keys()) b.removeItem(PREFIX + k); }
