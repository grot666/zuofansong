// View: plate (A6). Browser-only.
import { computeTargets } from '../core/targets.js';
import { TSP_OIL_G } from '../core/fat.js';
import * as S from '../core/store.js';
import { mealScores } from '../core/scores.js';
import { $, esc, r1, today, profile, allFoods, food, getLog, setLog, templates, bar } from '../ui.js';

export const view = () => {
  const t = computeTargets(profile()); const per = { kcal: t.kcal / 3, protein: t.protein / 3, fat: t.fat / 3 };
  const opt = cat => allFoods().filter(f => f.cat === cat).map(f => `<option value="${f.id}">${esc(f.name)}</option>`).join('');
  return `<section class="card"><h2>一餐搭配</h2><form id="plf">
  <div class="row"><label>主食<select name="s">${opt('主食')}</select></label><label>克<input type="number" name="sg" value="150"></label></div>
  <div class="row"><label>蛋白<select name="p">${opt('蛋白')}</select></label><label>克<input type="number" name="pg" value="120"></label></div>
  <div class="row"><label>蔬菜<select name="v">${opt('蔬菜')}</select></label><label>克<input type="number" name="vg" value="250"></label></div>
  <label>炒菜油（茶匙，1 茶匙≈${TSP_OIL_G} g）<input type="number" step="0.5" name="oil" value="1.5"></label></form>
  <p class="mut">注意生重/熟重：名称带“熟”的按熟重称。每餐目标约 ${Math.round(per.kcal)} kcal / 蛋白 ${Math.round(per.protein)} g / 脂肪 ${Math.round(per.fat)} g。</p><div id="plout"></div><div class="row"><button id="pllog">记入今日</button><button id="plsave" class="sec">存为模板</button></div></section>`;
};
function plateItems(f) { return [{ id: f.s.value, g: +f.sg.value }, { id: f.p.value, g: +f.pg.value }, { id: f.v.value, g: +f.vg.value }, { id: 'oil', g: +f.oil.value * TSP_OIL_G }].filter(i => i.g > 0); }
const plateScores = items => mealScores(items, food);
view.bind = () => {
  const f = $('#plf'); f.s.value = 'riceCooked'; f.p.value = 'thighRoasted'; f.v.value = 'shanghaiQing';
  const t = computeTargets(profile());
  const calc = () => { const sc = plateScores(plateItems(f)); const x = sc.tot; const per = { kcal: t.kcal / 3, protein: t.protein / 3, fat: t.fat / 3, fiber: 9 };
    $('#plout').innerHTML = `热量 ${Math.round(x.kcal)} kcal${bar(x.kcal, per.kcal)}蛋白 ${r1(x.protein)} g${bar(x.protein, per.protein)}脂肪 ${r1(x.fat)} g${bar(x.fat, per.fat)}纤维 ${r1(x.fiber)} g${bar(x.fiber, per.fiber)}
    <p>健康 ${'★'.repeat(sc.health)} · 好做 ${'★'.repeat(sc.easy)} · 便宜 ${'★'.repeat(sc.cheap)} · 好吃 ${'★'.repeat(sc.tasty)}<br><span class="mut">估算成本 ≈ ¥${sc.cost}</span></p>`; };
  f.oninput = calc; calc();
  $('#pllog').onclick = () => { const l = getLog(); l.items.push(...plateItems(f).map(i => ({ ...i, t: Date.now() }))); setLog(l); location.hash = '#today'; };
  $('#plsave').onclick = () => { const items = plateItems(f); const name = prompt('模板名称', items.filter(i => i.id !== 'oil').map(i => food(i.id).name).join(' + ')); if (!name) return; S.set('templates', [{ id: 'u' + Date.now(), name, items: items.map(i => [i.id, i.g]) }, ...S.get('templates', [])]); $('#plsave').textContent = '✓ 已保存'; };
};

