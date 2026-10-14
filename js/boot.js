// Shared page boot: migrate -> resolve 维持周 -> (page renders) -> SW register. Browser-only.
import * as S from './core/store.js';
import { localDate } from './core/dates.js';
import { resolveBreak } from './core/breaks.js';
import { normalizeProfile } from './core/profile.js';
export { localDate };
function banner(id, text) {
  const show = () => { if (document.getElementById(id)) return; const b = document.createElement('div'); b.id = id; b.className = 'card warn'; b.setAttribute('role', 'alert'); b.textContent = text; document.body.prepend(b); };
  if (document.body) show(); else addEventListener('DOMContentLoaded', show);
}
export function bootStore() {
  // A18: listen before migrate so a failed backup write is visible.
  addEventListener('storage-error', () => banner('storage-banner', '保存失败：浏览器存储已满或被禁用。请在“我的”导出备份。'));
  const v = S.migrate();
  if (v < S.SCHEMA_VERSION) banner('migrate-banner', '数据升级未完成：存储空间不足。请先在“我的”导出备份，再删除旧记录。');
  if (!S.isPersistent()) banner('persist-banner', '当前浏览器不能保存数据（隐私模式？），关闭后记录会丢失。');
  const r = resolveBreak(S.get('profile', {}), S.get('breakState', null), localDate());
  if (r.restored) { S.set('profile', r.profile); S.remove('breakState'); }
  return r;
}
// UX-5/6/9: one toast above the nav. action = { label, run }.
export function toast(msg, { action, ms = 3000 } = {}) {
  document.getElementById('toast')?.remove();
  const t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite');
  const s = document.createElement('span'); s.textContent = msg; t.append(s);
  if (action) { const b = document.createElement('button'); b.textContent = action.label; b.onclick = () => { t.remove(); action.run(); }; t.append(b); }
  document.body.append(t); setTimeout(() => t.remove(), ms);
  return t;
}
// UX-8: pure gate.
export const shouldShowUpdate = ({ newVersion, updateSeen }) => !!newVersion && newVersion !== updateSeen;
export const getProfile = () => normalizeProfile(S.get('profile', {}));
export function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  const hadController = !!navigator.serviceWorker.controller;
  // A20: tell the user a new version is active; no auto reload (could lose form input).
  navigator.serviceWorker.addEventListener('controllerchange', async () => {
    if (!hadController || document.getElementById('update-toast')) return;
    // UX-8: show once per new version; read the version the new SW serves.
    let v = null; try { v = (await (await fetch('js/core/version.js', { cache: 'no-store' })).text()).match(/VERSION = '([^']+)'/)?.[1] || null; } catch { /* offline */ }
    if (!shouldShowUpdate({ newVersion: v, updateSeen: S.get('updateSeen', null) })) return;
    const seen = () => S.set('updateSeen', v);
    const t = toast('已更新到新版本', { action: { label: '刷新', run: () => { seen(); location.reload(); } }, ms: 8000 });
    t.id = 'update-toast'; seen();
  });
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
