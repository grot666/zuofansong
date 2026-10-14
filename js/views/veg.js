// View: veg (A6). Browser-only.
import { computeTargets, ACTIVITY, fastLossWarning, projectedBodyFat } from '../core/targets.js';
import { blend } from '../core/grains.js';
import { fatWallet, TSP_OIL_G } from '../core/fat.js';
import { proteinGap, gutRisk } from '../core/protein.js';
import { suggestFiber } from '../core/fiber.js';
import { ma7, weeklyStatus } from '../core/weight.js';
import * as S from '../core/store.js';
import { FOODS } from '../../data/foods.js';
import { FOODS2 } from '../../data/foods2.js';
import { FOODS3 } from '../../data/foods3.js';
import { RECIPES } from '../../data/recipes.js';
import { VERSION, CHANGELOG } from '../core/version.js';
import { DEFAULT_PROFILE, normalizeProfile, paceCheck } from '../core/profile.js';
import { MULTS, scaleItems } from '../core/portion.js';
import { sleepNotes } from '../core/sleep.js';
import { makeIndex, totals as sumTotals, proteinPerYuan } from '../core/foods.js';
import { setRender, rerender, $, esc, r1, today, dayOffset, PLAN_DAY, PRESET_TEMPLATES, profile, refreshFoods, allFoods, food, logKey, getLog, setLog, tplMult, templates, totals, bar, approx } from '../ui.js';

const VEG_FILTERS = ['≤5分钟', '不开火', '微波', '护腕', '一锅'];
function recipeItems(r) { return [...r.items.map(([id, g]) => ({ id, g })), ...(r.oil ? [{ id: 'oil', g: r.oil }] : [])]; }
export const view = () => `<section class="card"><h2>懒人蔬菜（${RECIPES.length} 道）</h2><p class="mut">全部 ≤10 分钟动手、≤5 种食材，每道标出用油克数。护腕 = 不颠锅、少用力。</p><div class="row" id="vf">${VEG_FILTERS.map(t => `<label style="flex:none"><input type="checkbox" value="${t}" style="width:auto;min-height:auto"> ${t}</label>`).join('')}</div><ul class="list" id="vl"></ul></section>`;
view.bind = () => {
  const draw = () => {
    const on = [...document.querySelectorAll('#vf input:checked')].map(i => i.value);
    const list = RECIPES.filter(r => on.every(t => r.tags.includes(t)));
    $('#vl').innerHTML = list.map(r => { const x = totals(recipeItems(r)); return `<li><details><summary><b>${esc(r.name)}</b> · ${r.min} 分钟 · 油 ${r.oil} g · ≈${Math.round(x.kcal)} kcal · ≈¥${r1(x.cost)} ${r.tags.map(t => `<span class="chip">${t}</span>`).join('')}</summary>
      <p class="mut">食材：${r.items.map(([id, g]) => `${food(id)?.name || id} ${g} g`).join('、')}${r.oil ? `、油 ${r.oil} g（≈${r1(r.oil / TSP_OIL_G)} 茶匙）` : ''}<br>整份：蛋白 ${r1(x.protein)} g · 脂肪 ${r1(x.fat)} g · 碳水 ${r1(x.carbs)} g · 纤维 ${r1(x.fiber)} g（约 2 人份或 1 天的蔬菜）</p>
      <ol>${r.steps.map(s => `<li>${esc(s.text)}${s.wristSafe ? '' : `<br><span class="warn">护腕：${esc(s.wristNote)}</span>`}</li>`).join('')}</ol><button class="sec" data-log="${r.id}" data-half="1">记入今日（半份）</button> <button class="sec" data-log="${r.id}">记入今日（整份）</button></details></li>`; }).join('') || '<li class="mut">没有符合全部条件的菜，少选一个筛选试试</li>';
    document.querySelectorAll('[data-log]').forEach(b => b.onclick = () => { const r = RECIPES.find(x => x.id === b.dataset.log); const k = b.dataset.half ? 0.5 : 1; const l = getLog(); l.items.push(...recipeItems(r).map(i => ({ id: i.id, g: i.g * k, t: Date.now() }))); setLog(l); b.textContent = '✓ 已记入'; });
  };
  $('#vf').onchange = draw; draw();
};

