// View: rice (A6). Browser-only.
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

const GRAINS = ['rice', 'millet', 'cornGrits', 'oatRice', 'brownRice', 'blackRice', 'buckwheat'];
export const view = () => `<section class="card"><h2>杂粮饭配比器</h2><form id="rf">${GRAINS.map(id => { const f = food(id); return `<label>${f.name}${f.soak ? '（需浸泡）' : ''} <span id="pv-${id}"></span>%<input type="range" min="0" max="100" step="5" name="${id}"></label>`; }).join('')}
<label>一碗熟饭（克）<input type="number" name="bowl" value="150"></label></form><div id="rout"></div><button id="rsave" class="sec">收藏这个配比</button>
<p class="mut">注意：杂粮饭每克热量和白米饭几乎一样（如 200 g 熟饭换成糙米饭：纤维 +2.4 g、热量 −14 kcal）。好处是纤维更多、升糖更慢；控制热量靠称重。</p>
<p class="mut">食品安全：煮好的饭 1 小时内摊开放凉并入冰箱，24 小时内吃完，只加热一次并热透（英国 FSA/NHS）。不要在电饭煲里保温过夜。</p></section><section class="card"><h3>我的配比</h3><ul class="list" id="rfav"></ul></section>`;
view.bind = () => {
  const f = $('#rf'); const cur = S.get('riceCurrent', { rice: 60, millet: 20, cornGrits: 20 });
  GRAINS.forEach(id => f.elements[id].value = cur[id] || 0);
  const calc = () => {
    const ratios = Object.fromEntries(GRAINS.map(id => [id, +f.elements[id].value]));
    GRAINS.forEach(id => $('#pv-' + id).textContent = ratios[id]);
    S.set('riceCurrent', ratios);
    const parts = GRAINS.filter(id => ratios[id] > 0).map(id => ({ food: food(id), pct: ratios[id] }));
    if (!parts.length) { $('#rout').innerHTML = '<p class="mut">请至少选择一种谷物</p>'; return; }
    const b = blend(parts); const bowl = +f.elements.bowl.value || 150; const rawPerBowl = bowl / b.yield; const k = bowl / 100;
    const sum = parts.reduce((s, p) => s + p.pct, 0);
    $('#rout').innerHTML = `<p><b>一碗 ≈ ${bowl} g 熟饭 ≈ ${Math.round(rawPerBowl)} g 生米 ≈ ${Math.round(b.cooked.kcal * k)} kcal</b><br>蛋白 ${r1(b.cooked.protein * k)} g · 脂肪 ${r1(b.cooked.fat * k)} g · 碳水 ${r1(b.cooked.carbs * k)} g · 纤维 ${r1(b.cooked.fiber * k)} g</p>
    <p class="mut">每 100 g 生：${Math.round(b.raw.kcal)} kcal；每 100 g 熟：≈${Math.round(b.cooked.kcal)} kcal（熟重系数≈${b.yield}，估算）</p>
    <h3>电饭煲步骤</h3><ol><li>${b.needsSoak.length ? `${b.needsSoak.join('、')} 提前浸泡 2–4 小时（或早上泡上，晚上煮）` : '无需浸泡，小米/玉米糁可直接下锅'}</li><li>所有米混合淘洗 1–2 次</li><li>加水：米的体积 × ${b.waterRatio}（或水面高出米约 1 指节）</li><li>${b.needsSoak.length ? '选“杂粮饭/糙米饭”模式' : '选“标准煮饭”模式'}，煮好焖 10 分钟</li><li>分装：每碗称 ${bowl} g，摊开放凉后冷藏，多余的冷冻</li></ol>${sum !== 100 ? `<p class="mut">当前比例合计 ${sum}%，已按比例换算。</p>` : ''}`;
  };
  f.oninput = calc; calc();
  const drawFav = () => { const favs = S.get('riceFavs', []); $('#rfav').innerHTML = favs.map((r, i) => `<li><a href="#rice" data-i="${i}">${GRAINS.filter(id => r[id] > 0).map(id => food(id).name + ' ' + r[id] + '%').join(' + ')}</a></li>`).join('') || '<li class="mut">还没有收藏。调好比例后点“收藏这个配比”。</li>'; $('#rfav').querySelectorAll('a').forEach(a => a.onclick = () => { S.set('riceCurrent', favs[a.dataset.i]); rerender(); }); };
  $('#rsave').onclick = () => { S.set('riceFavs', [...S.get('riceFavs', []), S.get('riceCurrent')]); drawFav(); };
  drawFav();
};

