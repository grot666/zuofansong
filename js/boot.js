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
export const getProfile = () => normalizeProfile(S.get('profile', {}));
export function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  const hadController = !!navigator.serviceWorker.controller;
  // A20: tell the user a new version is active; no auto reload (could lose form input).
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || document.getElementById('update-toast')) return;
    const b = document.createElement('button'); b.id = 'update-toast'; b.className = 'card'; b.textContent = '已更新到新版本 · 刷新';
    b.onclick = () => location.reload(); document.body.prepend(b);
  });
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
