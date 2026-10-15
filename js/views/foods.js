// View: foods (A6). Browser-only.
import { toast } from '../boot.js';
import * as S from '../core/store.js';
import { proteinPerYuan, COOKED_TO_RAW } from '../core/foods.js';
import { $, esc, refreshFoods, allFoods, food, getLog, setLog, approx } from '../ui.js';

export const view = () => `<section class="card"><h2>食材库（${allFoods().length}）</h2><input id="q" placeholder="搜索：中文 / 拼音 / 标签（如 外卖、高纤）" aria-label="搜索食材"><p class="mut">每 100 g 可食部。名称带“熟”的为熟重，其余为生重。≈ 表示估算/未核实；✓ 表示已按 USDA FDC 核实。价格为上海估价。外卖数据误差可达 10–20% 甚至更多。</p><label style="display:inline-block"><input type="checkbox" id="pysort" style="width:auto;min-height:auto"> 按“每元蛋白”排序（估算，生重）</label><ul class="list" id="fl"></ul></section>
<section class="card"><h3>添加自定义食材</h3><form id="cf"><input name="name" placeholder="名称" required aria-label="名称"><div class="row"><input name="kcal" type="number" step="any" placeholder="kcal" required aria-label="热量"><input name="protein" type="number" step="any" placeholder="蛋白 g" aria-label="蛋白"><input name="fat" type="number" step="any" placeholder="脂肪 g" aria-label="脂肪"><input name="carbs" type="number" step="any" placeholder="碳水 g" aria-label="碳水"><input name="fiber" type="number" step="any" placeholder="纤维 g" aria-label="纤维"></div><button>添加</button></form></section>`;
view.bind = () => {
  const draw = () => {
    const q = $('#q').value.trim().toLowerCase();
    const sortPy = $('#pysort') && $('#pysort').checked;
    let list = allFoods().filter(f => !q || f.name.includes(q) || (f.py || '').includes(q) || (f.tags || []).some(t => t.includes(q)) || (f.cat || '').includes(q));
    if (sortPy) list = list.filter(f => f.protein >= 5 && proteinPerYuan(f)).sort((a, b) => proteinPerYuan(b) - proteinPerYuan(a));
    $('#fl').innerHTML = list.map(f => `<li><b>${esc(f.name)}</b> ${f.verified ? '✓' : ''} <span class="chip">${esc(f.cat || '自定义')}</span>${(f.tags || []).map(t => `<span class="chip">${esc(t)}</span>`).join('')}<br><span class="mut">${approx(f)}${f.kcal} kcal · 蛋白 ${f.protein} · 脂肪 ${f.fat} · 碳水 ${f.carbs} · 纤维 ${f.fiberEst ? '≈' : ''}${f.fiber}${f.priceCNYPer500g ? ` · ${f.priceUser ? '' : '≈'}¥${f.priceCNYPer500g}/斤${f.priceUser ? '（我的价格）' : f.priceSource ? `（${esc(f.priceSource)}）` : f.priceNote ? `（${esc(f.priceNote)}）` : '（估算）'}${COOKED_TO_RAW[f.id] ? '（按熟重）' : ''}` : ''} <button class="sec mini" data-price="${f.id}" aria-label="改价格">改价</button> <button class="sec mini" data-pack="${f.id}" aria-label="设置包装规格">包装${(S.get('packs', {}) || {})[f.id] ? ' ' + S.get('packs', {})[f.id] + ' g' : ''}</button> <button class="sec mini" data-add="${f.id}" aria-label="记入今日 ${esc(f.name)}">+ 记入</button>${f.protein >= 5 && proteinPerYuan(f) ? ` · 蛋白 ${Math.round(proteinPerYuan(f) * 10) / 10} g/¥` : ''}${f.unit ? ` · 1${f.unit.name}≈${f.unit.g}g≈${Math.round(f.kcal * f.unit.g / 100)} kcal` : ''} · 来源 ${esc(f.source || '用户')}${f.note ? ' · ' + esc(f.note) : ''}</span></li>`).join('') || '<li class="mut">没有匹配的食材，可在下方添加</li>';
  };
  $('#fl').onclick = e => {
    const add = e.target.dataset && e.target.dataset.add;
    if (add) { const f = food(add); const g = f.unit?.g || 100; const l = getLog(); l.items.push({ id: add, g, t: Date.now() }); setLog(l);
      const u = S.get('foodUse', {}); u[add] = (u[add] || 0) + 1; S.set('foodUse', u); S.set('recents', [add, ...S.get('recents', []).filter(x => x !== add)].slice(0, 12));
      toast(`已记入今日：${f.name} ${g} g`); return; }
    const pk = e.target.dataset && e.target.dataset.pack;
    if (pk) { // R11-4: user pack size (g) for leftover hints on the plan page
      const v = prompt(`${food(pk).name}：一包/一份多少克？（留空 = 不设置）`, (S.get('packs', {}) || {})[pk] || '');
      if (v === null) return; const packs = { ...S.get('packs', {}) }; if (Number(v) > 0) packs[pk] = Math.round(Number(v)); else delete packs[pk];
      S.set('packs', packs); draw(); return; }
    const id = e.target.dataset && e.target.dataset.price; if (!id) return;
    const v = prompt(`${food(id).name}：每斤（500 g）价格 ¥（留空 = 恢复估价）`, food(id).priceCNYPer500g || '');
    if (v === null) return;
    const prices = { ...S.get('prices', {}) }; if (Number(v) > 0) prices[id] = Number(v); else delete prices[id];
    S.set('prices', prices); refreshFoods(); draw();
  };
  $('#q').oninput = draw; $('#pysort').onchange = draw; draw();
  $('#cf').onsubmit = e => { e.preventDefault(); const d = Object.fromEntries(new FormData(e.target)); const f = { id: 'c' + Date.now(), name: d.name, cat: '自定义', tags: ['自定义'], source: '用户', verified: false }; for (const k of ['kcal', 'protein', 'fat', 'carbs', 'fiber']) f[k] = +d[k] || 0; S.set('customFoods', [...S.get('customFoods', []), f]); refreshFoods(); e.target.reset(); draw(); };
};

