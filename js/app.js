import { computeTargets, ACTIVITY, fastLossWarning, projectedBodyFat } from './core/targets.js';
import { blend } from './core/grains.js';
import { fatWallet, TSP_OIL_G } from './core/fat.js';
import { proteinGap, gutRisk } from './core/protein.js';
import { suggestFiber } from './core/fiber.js';
import { ma7, weeklyStatus } from './core/weight.js';
import * as S from './core/store.js';
import { FOODS } from '../data/foods.js';
import { FOODS2 } from '../data/foods2.js';
import { FOODS3 } from '../data/foods3.js';
import { RECIPES } from '../data/recipes.js';

import { VERSION, CHANGELOG } from './core/version.js';
import { DEFAULT_PROFILE, normalizeProfile, paceCheck } from './core/profile.js';
import { MULTS, scaleItems } from './core/portion.js';
import { sleepNotes } from './core/sleep.js';
import { makeIndex, totals as sumTotals, proteinPerYuan } from './core/foods.js';
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
import { setRender, rerender, $, esc, r1, today, dayOffset, PLAN_DAY, PRESET_TEMPLATES, profile, refreshFoods, allFoods, food, logKey, getLog, setLog, tplMult, templates, totals, bar, approx } from './ui.js';
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
  try { $('#view').innerHTML = v(); v.bind && v.bind(); }
  catch (e) { console.error(e); $('#view').innerHTML = `<section class="card"><h2>出错了</h2><p class="mut">${esc(e.message)}</p><p>可以刷新重试，或在“我的”页导出备份。</p></section>`; }
  document.querySelectorAll('.tabs a').forEach(a => { const on = a.getAttribute('href') === '#' + name; a.classList.toggle('on', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  const h = $('#view h2'); document.title = (h ? h.textContent.replace(/\s+/g, ' ').trim() + ' · ' : '') + '做饭松';
}
$('#ver').textContent = 'v' + VERSION;
window.addEventListener('hashchange', render);
setRender(render);
render();
registerSW();
