// UX-4 / UX-11: one shared bottom nav (≤5 items) for index, plan and review. Pure string builders + a small DOM helper.
export const NAV = [
  { key: 'today', label: '今日', icon: '🏠', page: 'index', hash: 'today' },
  { key: 'plate', label: '搭配', icon: '🍱', page: 'index', hash: 'plate' },
  { key: 'plan', label: '菜单', icon: '📅', page: 'plan' },
  { key: 'review', label: '回顾', icon: '📈', page: 'review' },
  { key: 'me', label: '我的', icon: '👤', page: 'index', hash: 'me' },
];
// Views reached from 搭配's sub-nav; they keep 搭配 highlighted.
export const COOK_TOOLS = [
  { key: 'plate', label: '一餐搭配' }, { key: 'veg', label: '懒人蔬菜' }, { key: 'rice', label: '杂粮饭' }, { key: 'foods', label: '食材库' },
];
export const navKeyFor = view => (COOK_TOOLS.some(t => t.key === view) ? 'plate' : view);
export function navHref(item, fromPage) {
  if (item.page !== 'index') return item.page + '.html';
  return fromPage === 'index' ? '#' + item.hash : 'index.html#' + item.hash;
}
export function navHtml(fromPage, activeKey) {
  return NAV.map(it => `<a href="${navHref(it, fromPage)}" data-nav="${it.key}"${it.key === activeKey ? ' class="on" aria-current="page"' : ''}><span aria-hidden="true">${it.icon}</span>${it.label}</a>`).join('');
}
export const subNavHtml = view => `<nav class="sub" aria-label="搭配工具">${COOK_TOOLS.map(t => `<a href="#${t.key}"${t.key === view ? ' class="on" aria-current="page"' : ''}>${t.label}</a>`).join('')}</nav>`;
export function markNav(activeKey) {
  for (const a of document.querySelectorAll('.tabs a')) {
    const on = a.dataset.nav === activeKey; a.classList.toggle('on', on);
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  }
}
