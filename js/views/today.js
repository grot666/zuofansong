// View: today (A6). Browser-only.
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

function sleepHtml(l, p) {
  const hm = t => { const d = new Date(t); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
  const entries = l.items.filter(i => i.t && food(i.id)).map(i => ({ id: i.id, time: hm(i.t), kcal: food(i.id).kcal * i.g / 100 }));
  const n = sleepNotes(entries, p);
  if (!p.sleepNudges) return '';
  return `<p class="mut">睡前提醒：${n.dinnerBy} 前吃完晚饭，${n.caffeineBy} 后不喝咖啡/茶（按 ${p.bedtime} 睡觉）。</p>${n.lateMeal ? `<p class="warn">${n.lateMeal.time} 吃了约 ${Math.round(n.lateMeal.kcal)} kcal，离睡觉较近，可能影响睡眠。偶尔一次没关系。</p>` : ''}${n.lateCaffeine ? `<p class="warn">${n.lateCaffeine.time} 摄入咖啡因，可能影响今晚入睡。</p>` : ''}`;
}
export const view = () => {
  const p = profile(); const t = computeTargets(p); const l = getLog(); const x = totals(l.items);
  const fw = fatWallet(t.fat, l.items.map(i => { const f = food(i.id); return f ? { fat: f.fat * i.g / 100, fatClass: f.fatClass || 'neutral' } : { fat: 0 }; }));
  const wholeProtein = x.protein - x.powderProtein;
  const pg = proteinGap(t.protein, wholeProtein, p.scoopG, p.maxScoops);
  const gr = gutRisk({ fiber: x.fiber, water: l.water, weight: p.weight, powderShare: x.protein ? x.powderProtein / x.protein : 0, vegServings: x.veg, trainingDays: p.trainingDays });
  const recents = [...new Set(S.get('recents', []))].slice(0, 8);
  const lowItems = l.items.filter(i => food(i.id)?.fatClass === 'low');
  const hasTakeaway = l.items.some(i => food(i.id)?.cat === '外食');
  const swaps = l.items.length ? suggestFiber({ fiber: x.fiber, fiberTarget: 28, kcal: x.kcal, kcalTarget: t.kcal, gutHigh: gr.level === 'high' }) : [];
  const undo = S.get('undo', null);
  return `<section class="card"><h2>今日 ${today()}</h2>
  热量 ${Math.round(x.kcal)} / ${t.kcal} kcal（还剩 ${Math.round(t.kcal - x.kcal)}）${bar(x.kcal, t.kcal)}
  蛋白 ${r1(x.protein)} / ${t.protein} g${bar(x.protein, t.protein)}
  碳水 ${r1(x.carbs)} / ${t.carbs} g${bar(x.carbs, t.carbs)}
  纤维 ${r1(x.fiber)} / 28 g${bar(x.fiber, 28)}
  ${swaps.length ? `<p><b>纤维还差 ${Math.round(28 - x.fiber)} g，最划算的补法：</b></p><ul>${swaps.map(s => `<li>${s.text}${s.fiberGain ? `（纤维 +${s.fiberGain} g，热量 ${s.kcalDelta >= 0 ? '+' : ''}${s.kcalDelta} kcal）` : ''}${s.add ? ` <button class="sec" data-swap="${s.id}">+ 记入</button>` : ''}</li>`).join('')}</ul><p class="mut">数据来自 USDA FDC。</p>` : ''}
  ${l.items.length && x.kcal > t.kcal * 1.1 ? '<p class="mut">今天超了也没关系，看一周平均。明天照常吃，不用节食补救。</p>' : ''}
  ${sleepHtml(l, p)}
  <p class="mut">估算食材成本 ≈ ¥${r1(x.cost)}</p></section>
  <section class="card"><h2>常用餐</h2><p class="mut">点一下就记入。在“搭配”页可存自己的模板。</p><div class="row" role="group" aria-label="份量">份量 ${MULTS.map(m => `<button class="${m === tplMult() ? '' : 'sec'}" data-mult="${m}" aria-pressed="${m === tplMult()}">×${m}</button>`).join('')}</div><div>${templates().map(tp => { const k = totals(scaleItems(tp.items, tplMult()).map(([id, g]) => ({ id, g }))).kcal; return `<button class="sec" data-tpl="${tp.id}" style="margin:4px 4px 0 0">${esc(tp.name)} · ${Math.round(k)}</button>`; }).join('')}</div>
  ${undo && undo.date === today() ? `<p class="mut">已记入“${esc(undo.name)}” <button class="sec" id="undo">撤销</button></p>` : ''}</section>
  <section class="card"><h2>快速记录</h2><form id="af"><input list="fdl" name="f" placeholder="食材或外卖名称（如 生煎、黄焖鸡）" aria-label="食材"><datalist id="fdl">${allFoods().map(f => `<option value="${esc(f.name)}">`).join('')}</datalist>
  <div class="row"><input type="number" name="n" value="1" step="any" aria-label="数量"><select name="u" aria-label="单位"><option value="unit">个/碗/份（按食材单位）</option><option value="g">克</option><option value="bowl">碗（熟饭 150 g）</option></select><button>添加</button></div></form>
  <div>${recents.map(id => food(id) ? `<button class="sec" data-r="${id}" style="margin:4px 4px 0 0">+ ${esc(food(id).name)}</button>` : '').join('')}</div>
  <ul class="list">${l.items.map((i, n) => { const f = food(i.id); return f ? `<li>${esc(f.name)} ${Math.round(i.g)} g · ${approx(f)}${Math.round(f.kcal * i.g / 100)} kcal <button class="sec" data-del="${n}" aria-label="删除">✕</button></li>` : ''; }).join('') || '<li class="mut">还没有记录。可以点上面的常用餐，或一键记入你的计划日。</li>'}</ul>
  <div class="row" style="margin-top:8px"><button id="planDay" class="sec">记入我的计划日</button><button id="copyY" class="sec">复制昨天</button></div>
  <p class="mut">计划日 = 3 蛋 + 400 g 米饭 + 360 g 去皮鸡腿 + 1 罐水浸金枪鱼 + 300 g 西兰花 + 200 g 胡萝卜 + 15 g 油 ≈ 1780 kcal / 149 g 蛋白 / 62 g 脂肪 / 纤维仅 ≈15 g。</p>
  ${hasTakeaway ? '<p class="mut">点外卖：备注“少油少酱”，汤和红油不喝，麻酱/底油单独放，选蒸/煮/白灼优于炸/红烧。外卖热量是估算（≈）。</p>' : ''}</section>
  <section class="card"><h2>脂肪预算</h2>已用 ${fw.spent} / ${fw.budget} g（剩 ${fw.left} g）${bar(fw.spent, fw.budget)}
  <p class="mut">值得花：${fw.high} g（炒菜油、鸡蛋、鱼、坚果） · 一般：${fw.neutral} g · <span class="${fw.low ? 'bad' : ''}">低价值：${fw.low} g</span></p>
  ${lowItems.length ? `<p class="warn">低价值脂肪来自：${[...new Set(lowItems.map(i => food(i.id).name))].join('、')}。换成瘦肉/去皮鸡腿/清蒸鱼，可省出油给蔬菜调味。</p>` : '<p class="mut">炒菜油 1 茶匙 ≈ 4.5 g。把脂肪花在让蔬菜好吃的油上，比花在五花肉、鸡皮、外卖油上更划算。</p>'}</section>
  <section class="card"><h2>蛋白补充</h2><p>天然食物蛋白 ${Math.round(wholeProtein)} g，目标 ${t.protein} g，缺口 <b>${pg.gap} g</b>${pg.gap ? ` → 可用蛋白粉 <b>${pg.scoops} 勺</b>（每勺 ${p.scoopG} g，上限 ${p.maxScoops} 勺）${pg.left ? `，仍差 ${pg.left} g，可加 ${Math.ceil(pg.left / 6.3)} 个鸡蛋或豆腐` : ''}` : ' ✓'}</p><p class="mut">优先天然食物，蛋白粉只补缺口。</p></section>
  <section class="card"><h2>饮水与如厕舒适度</h2><p>饮水 ${l.water} / ${t.water} ml</p>${bar(l.water, t.water)}<div class="row"><button id="w250">+1 杯 250 ml</button><button id="w500" class="sec">+500 ml</button><button id="wm" class="sec">−250</button></div>
  <p>如厕舒适度风险：<b class="${gr.level === 'high' ? 'bad' : gr.level === 'mid' ? 'warn' : ''}">${{ high: '高', mid: '中', low: '低' }[gr.level]}</b>（${gr.score}/10）</p>${gr.fixes.length ? `<ul>${gr.fixes.map(f => `<li>${f}</li>`).join('')}</ul>` : ''}<p class="mut">若长期便秘或不适，请就医。</p></section>`;
};
view.bind = () => {
  const pushItems = (items, name) => { const l = getLog(); const n0 = l.items.length; l.items.push(...items.map(([id, g]) => ({ id, g, t: Date.now() }))); setLog(l); S.set('undo', { date: today(), from: n0, name }); rerender(); };
  const addItem = (id, g) => { S.set('recents', [id, ...S.get('recents', []).filter(x => x !== id)].slice(0, 12)); pushItems([[id, g]], food(id).name); };
  $('#af').onsubmit = e => { e.preventDefault(); const d = e.target; const q = d.f.value.trim(); if (!q) return; const f = allFoods().find(x => x.name === q) || allFoods().find(x => x.name.includes(q) || (x.py || '') === q.toLowerCase()); if (!f) { alert('没找到这个食材，可在“食材”页添加'); return; } const n = +d.n.value || 1; let g = n; if (d.u.value === 'unit') g = n * (f.unit?.g || 100); if (d.u.value === 'bowl') g = n * 150 / (f.yield || 1); addItem(f.id, g); };
  document.querySelectorAll('[data-r]').forEach(b => b.onclick = () => { const f = food(b.dataset.r); addItem(f.id, f.unit?.g || 100); });
  document.querySelectorAll('[data-tpl]').forEach(b => b.onclick = () => { const tp = templates().find(x => x.id === b.dataset.tpl); const use = S.get('templateUse', {}); use[tp.id] = (use[tp.id] || 0) + 1; S.set('templateUse', use); pushItems(scaleItems(tp.items, tplMult()), tplMult() === 1 ? tp.name : `${tp.name} ×${tplMult()}`); });
  document.querySelectorAll('[data-mult]').forEach(b => b.onclick = () => { S.set('tplMult', +b.dataset.mult); rerender(); });
  document.querySelectorAll('[data-swap]').forEach(b => b.onclick = () => { const s = suggestFiber({ fiber: 0, kcal: 0, kcalTarget: 1e9 }, 99).find(x => x.id === b.dataset.swap); if (s) pushItems(s.add, s.text); });
  const u = $('#undo'); if (u) u.onclick = () => { const un = S.get('undo'); const l = getLog(); l.items = l.items.slice(0, un.from); setLog(l); S.set('undo', null); rerender(); };
  document.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { const l = getLog(); l.items.splice(+b.dataset.del, 1); setLog(l); S.set('undo', null); rerender(); });
  const water = d => { const l = getLog(); l.water = Math.max(0, l.water + d); setLog(l); rerender(); };
  $('#w250').onclick = () => water(250); $('#w500').onclick = () => water(500); $('#wm').onclick = () => water(-250);
  $('#planDay').onclick = () => pushItems(PLAN_DAY, '我的计划日');
  $('#copyY').onclick = () => { const yl = getLog(dayOffset(-1)); if (!yl.items.length) { alert('昨天没有记录'); return; } pushItems(yl.items.map(i => [i.id, i.g]), '昨天的饮食'); };
};

