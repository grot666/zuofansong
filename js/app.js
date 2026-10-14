import { markNav, navKeyFor, subNavHtml } from './nav.js';
import * as S from './core/store.js';

import { VERSION } from './core/version.js';
import { view as vegView } from './views/veg.js';
import { view as riceView } from './views/rice.js';
import { view as foodsView } from './views/foods.js';
import { view as plateView } from './views/plate.js';
import { view as meView } from './views/me.js';
import { view as todayView } from './views/today.js';
import { compactStore } from './core/retention.js';
import { bootStore, registerSW } from './boot.js';
bootStore();
try { compactStore(S, today(), food); } catch (e) { console.error(e); }
import { setRender, $, esc, today, refreshFoods, food } from './ui.js';
const views = {};
views.today = todayView;
views.me = meView;
views.plate = plateView;
views.foods = foodsView;
views.rice = riceView;
views.veg = vegView;

function render() {
  refreshFoods();
  const name = (location.hash || '#today').slice(1); const v = views[name] || views.today;
  try { $('#view').innerHTML = (navKeyFor(name) === 'plate' ? subNavHtml(name) : '') + v(); v.bind && v.bind(); }
  catch (e) { console.error(e); $('#view').innerHTML = `<section class="card"><h2>出错了</h2><p class="mut">${esc(e.message)}</p><p>可以刷新重试，或在“我的”页导出备份。</p></section>`; }
  markNav(navKeyFor(name));
  const h = $('#view h2'); document.title = (h ? h.textContent.replace(/\s+/g, ' ').trim() + ' · ' : '') + '做饭松';
}
$('#ver').textContent = 'v' + VERSION;
window.addEventListener('hashchange', render);
setRender(render);
render();
registerSW();
