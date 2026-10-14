// localStorage wrapper with prefix, versioning, migration.
export const PREFIX = 'culiang.v1.';
export const SCHEMA_VERSION = 1;
const mem = {};
function ls() { try { return globalThis.localStorage; } catch { return null; } }
export function get(key, fallback) {
  try { const s = ls(); const v = s ? s.getItem(PREFIX + key) : mem[key]; return v == null ? fallback : JSON.parse(v); } catch { return fallback; }
}
export function set(key, val) {
  try { const s = ls(); const v = JSON.stringify(val); if (s) s.setItem(PREFIX + key, v); else mem[key] = v; return true; }
  catch (e) { console.warn('storage error', e); alert('存储失败（空间不足？）请导出备份后清理。'); return false; }
}
export function migrate() {
  const v = get('version', 0);
  if (v < 1) set('version', 1);
}
export function exportAll() {
  const out = {}; const s = ls(); if (!s) return out;
  for (let i = 0; i < s.length; i++) { const k = s.key(i); if (k.startsWith(PREFIX)) out[k.slice(PREFIX.length)] = JSON.parse(s.getItem(k)); }
  return out;
}
export function importAll(obj) { for (const [k, v] of Object.entries(obj)) set(k, v); migrate(); }
export function resetAll() { const s = ls(); if (!s) return; Object.keys(s).filter(k => k.startsWith(PREFIX)).forEach(k => s.removeItem(k)); }
