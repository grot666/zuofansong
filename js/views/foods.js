// View: foods (A6). Browser-only.
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

export const view = () => `<section class="card"><h2>食材库（${allFoods().length}）</h2><input id="q" placeholder="搜索：中文 / 拼音 / 标签（如 外卖、高纤）" aria-label="搜索食材"><p class="mut">每 100 g 可食部。名称带“熟”的为熟重，其余为生重。≈ 表示估算/未核实；✓ 表示已按 USDA FDC 核实。价格为上海估价。外卖数据误差可达 10–20% 甚至更多。</p><ul class="list" id="fl"></ul></section>
<section class="card"><h3>添加自定义食材</h3><form id="cf"><input name="name" placeholder="名称" required aria-label="名称"><div class="row"><input name="kcal" type="number" step="any" placeholder="kcal" required aria-label="热量"><input name="protein" type="number" step="any" placeholder="蛋白 g" aria-label="蛋白"><input name="fat" type="number" step="any" placeholder="脂肪 g" aria-label="脂肪"><input name="carbs" type="number" step="any" placeholder="碳水 g" aria-label="碳水"><input name="fiber" type="number" step="any" placeholder="纤维 g" aria-label="纤维"></div><button>添加</button></form></section>`;
view.bind = () => {
  const draw = () => {
    const q = $('#q').value.trim().toLowerCase();
    const list = allFoods().filter(f => !q || f.name.includes(q) || (f.py || '').includes(q) || (f.tags || []).some(t => t.includes(q)) || (f.cat || '').includes(q));
    $('#fl').innerHTML = list.map(f => `<li><b>${esc(f.name)}</b> ${f.verified ? '✓' : ''} <span class="chip">${esc(f.cat || '自定义')}</span>${(f.tags || []).map(t => `<span class="chip">${esc(t)}</span>`).join('')}<br><span class="mut">${approx(f)}${f.kcal} kcal · 蛋白 ${f.protein} · 脂肪 ${f.fat} · 碳水 ${f.carbs} · 纤维 ${f.fiberEst ? '≈' : ''}${f.fiber}${f.priceCNYPer500g ? ` · ≈¥${f.priceCNYPer500g}/斤` : ''}${f.protein >= 5 && proteinPerYuan(f) ? ` · 蛋白 ${Math.round(proteinPerYuan(f) * 10) / 10} g/¥` : ''}${f.unit ? ` · 1${f.unit.name}≈${f.unit.g}g≈${Math.round(f.kcal * f.unit.g / 100)} kcal` : ''} · 来源 ${esc(f.source || '用户')}${f.note ? ' · ' + esc(f.note) : ''}</span></li>`).join('') || '<li class="mut">没有匹配的食材，可在下方添加</li>';
  };
  $('#q').oninput = draw; draw();
  $('#cf').onsubmit = e => { e.preventDefault(); const d = Object.fromEntries(new FormData(e.target)); const f = { id: 'c' + Date.now(), name: d.name, cat: '自定义', tags: ['自定义'], source: '用户', verified: false }; for (const k of ['kcal', 'protein', 'fat', 'carbs', 'fiber']) f[k] = +d[k] || 0; S.set('customFoods', [...S.get('customFoods', []), f]); refreshFoods(); e.target.reset(); draw(); };
};

