// Shared page boot: migrate -> resolve 维持周 -> (page renders) -> SW register. Browser-only.
import * as S from './core/store.js';
import { resolveBreak } from './core/breaks.js';
import { normalizeProfile } from './core/profile.js';
export const localDate = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
export function bootStore() {
  S.migrate();
  const r = resolveBreak(S.get('profile', {}), S.get('breakState', null), localDate());
  if (r.restored) { S.set('profile', r.profile); S.remove('breakState'); }
  addEventListener('storage-error', () => {
    if (document.getElementById('storage-banner')) return;
    const b = document.createElement('div'); b.id = 'storage-banner'; b.className = 'card warn';
    b.textContent = '保存失败：浏览器存储已满或被禁用。请在“我的”导出备份。';
    document.body.prepend(b);
  });
  return r;
}
export const getProfile = () => normalizeProfile(S.get('profile', {}));
export function registerSW() { if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {}); }
