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
import { bootStore, registerSW } from './boot.js';
bootStore();
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const r1 = n => Math.round(n * 10) / 10;
const today = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
const dayOffset = n => { const d = new Date(Date.now() + n * 86400000); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };

// Owner's plan doc: 1700-2000 kcal, protein 130-160 g, fat 50-70 g.
// Owner's sample day (research R4.2): ≈1782 kcal / 149 g P / 62 g F / 15 g fiber.
const PLAN_DAY = [['eggUSDA', 150], ['riceCooked', 400], ['thighRoasted', 360], ['tunaLight', 100], ['broccoliUSDA', 300], ['carrot', 200], ['oil', 15]];
// Preset templates (research R5.5).
const PRESET_TEMPLATES = [
  { id: 'p1', name: '计划早餐：3 蛋 + 燕麦粥', items: [['eggUSDA', 150], ['oatsDry', 40]] },
  { id: 'p2', name: '烤鸡腿饭', items: [['thighRoasted', 120], ['riceCooked', 200], ['broccoliUSDA', 250], ['oil', 5]] },
  { id: 'p3', name: '金枪鱼加餐', items: [['tunaLight', 100], ['cucumber', 150]] },
];
const profile = () => normalizeProfile(S.get('profile', {}));
const allFoods = () => [...FOODS, ...FOODS2, ...FOODS3, ...S.get('customFoods', [])];
const food = id => allFoods().find(f => f.id === id);
const logKey = d => 'log.' + d;
const getLog = (d = today()) => S.get(logKey(d), { items: [], water: 0 });
const setLog = (l, d = today()) => S.set(logKey(d), l);
const tplMult = () => (MULTS.includes(S.get('tplMult', 1)) ? S.get('tplMult', 1) : 1);
const templates = () => { const user = S.get('templates', []); const use = S.get('templateUse', {}); return [...user, ...PRESET_TEMPLATES].sort((a, b) => (use[b.id] || 0) - (use[a.id] || 0)); };

function totals(items) {
  const t = { kcal: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, powderProtein: 0, veg: 0, cost: 0 };
  for (const it of items) {
    const f = food(it.id); if (!f) continue;
    const k = it.g / 100;
    for (const key of ['kcal', 'protein', 'fat', 'carbs', 'fiber']) t[key] += f[key] * k;
    if (f.powder) t.powderProtein += f.protein * k;
    if (f.cat === '蔬菜') t.veg += it.g / 100;
    t.cost += (f.priceCNYPer500g || 0) * it.g / 500;
  }
  return t;
}
function bar(v, max) { const p = Math.min(100, (v / max) * 100); return `<div class="bar"><i class="${v > max * 1.05 ? 'over' : ''}" style="width:${p}%"></i></div>`; }
const approx = f => (f.verified ? '' : '≈');

const views = {};

function weightChart(ws, goal) {
  if (ws.length < 2) return '<p class="mut">每周称 2–3 次，早上空腹、如厕后。至少 3 次记录后显示 7 日均线。</p>';
  const pts = ma7(ws.slice(-56));
  const W = 340, H = 140, P = 24;
  const vals = pts.flatMap(p => [p.weight, p.ma].filter(v => v != null));
  if (goal) vals.push(goal);
  const lo = Math.min(...vals) - 0.5, hi = Math.max(...vals) + 0.5;
  const t0 = new Date(pts[0].date).getTime(), t1 = new Date(pts[pts.length - 1].date).getTime() || t0 + 1;
  const x = d => P + (W - 2 * P) * ((new Date(d).getTime() - t0) / Math.max(1, t1 - t0));
  const y = v => H - P - (H - 2 * P) * ((v - lo) / (hi - lo));
  const dots = pts.map(p => `<circle cx="${x(p.date).toFixed(1)}" cy="${y(p.weight).toFixed(1)}" r="2.5" fill="currentColor" opacity=".35"><title>${p.date} ${p.weight} kg${p.ma ? ' · 均 ' + r1(p.ma) : ''}</title></circle>`).join('');
  const line = pts.filter(p => p.ma != null).map(p => `${x(p.date).toFixed(1)},${y(p.ma).toFixed(1)}`).join(' ');
  const goalLine = goal >= lo && goal <= hi ? `<line x1="${P}" x2="${W - P}" y1="${y(goal)}" y2="${y(goal)}" stroke="currentColor" stroke-dasharray="4 4" opacity=".5"/>` : '';
  const st = weeklyStatus(ws);
  const stText = st ? { fast: '<span class="warn">偏快</span>', ok: '正常', flat: '持平', up: '上升', slow: '偏慢' }[st.status] : '';
  const last = pts[pts.length - 1];
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="体重趋势：最新 ${last.weight} kg${last.ma ? '，7 日均 ' + r1(last.ma) + ' kg' : ''}" style="color:var(--acc)">${goalLine}${dots}${line ? `<polyline points="${line}" fill="none" stroke="currentColor" stroke-width="2.5"/>` : ''}<text x="${P}" y="12" font-size="10" fill="currentColor">${r1(hi)}</text><text x="${P}" y="${H - 4}" font-size="10" fill="currentColor">${r1(lo)}</text></svg>
  <p>${last.ma ? `7 日均 <b>${r1(last.ma)} kg</b>` : ''}${st ? ` · 每周 ${st.deltaKg > 0 ? '+' : ''}${r1(st.deltaKg)} kg（${r1(-st.pct)}%）· ${stText}` : ''}<br><span class="mut">点 = 每次称重，线 = 7 日均值，虚线 = 目标。看均值，不看单日波动。${st && st.status === 'flat' ? '连续 2–3 周持平可考虑热量再减 100–150 kcal 或增加步数。' : ''}</span></p>`;
}

views.me = () => {
  const p = profile(); const t = computeTargets(p);
  const weights = S.get('weights', []);
  const fl = fastLossWarning(weights.slice(-15));
  const pbf = projectedBodyFat(p.weight, p.bodyFatPct, p.goalWeight);
  return `<section class="card"><h2>我的目标</h2>
  <form id="pf">
  <div class="row"><label>性别<select name="sex"><option value="male">男</option><option value="female">女</option></select></label><label>出生日期<input type="date" name="birth"></label></div>
  <div class="row"><label>身高 cm<input type="number" step="0.1" name="height"></label><label>体重 kg<input type="number" step="0.1" name="weight"></label><label>估计体脂 %<input type="number" step="0.5" name="bodyFatPct"></label></div>
  <div class="row"><label>目标体重 kg<input type="number" step="0.1" name="goalWeight"></label><label>目标日期<input type="date" name="goalDate"></label></div>
  <label>活动水平<select name="activity">${ACTIVITY.map(a => `<option value="${a.id}">${a.label}</option>`).join('')}</select></label>
  <div class="row"><label>睡觉时间<input type="time" name="bedtime"></label><label><input type="checkbox" name="sleepNudges"> 睡前提醒</label></div>
  <div class="row"><label>热量缺口 %<input type="number" name="deficitPct" min="5" max="30"></label><label>脂肪 %<input type="number" min="20" max="35" name="fatPct"></label></div>
  <label>蛋白目标方式<select name="proteinMode"><option value="fixed">自定克数（你的计划 130–160 g）</option><option value="bw">按体重 g/kg</option><option value="ffm">按去脂体重 g/kg</option></select></label>
  <div class="row"><label>自定蛋白 g<input type="number" name="proteinTarget"></label><label>体重 g/kg<input type="number" step="0.1" min="1.2" max="2" name="proteinPerKg"></label><label>去脂 g/kg<input type="number" step="0.1" min="1.6" max="3.1" name="proteinPerFfm"></label></div>
  <div class="row"><label>每勺蛋白粉含蛋白 g<input type="number" name="scoopG"></label><label>每天最多几勺<input type="number" name="maxScoops"></label><label>每周力量训练天数<input type="number" name="trainingDays"></label></div>
  <label><input type="checkbox" name="usesPowder" style="width:auto;min-height:auto"> 我在喝蛋白粉（饮水目标提高）</label>
  <button>保存</button></form></section>
  <section class="card"><h2>每日目标</h2><table>
  <tr><td>基础代谢 BMR</td><td>${t.bmr} kcal</td><td class="mut">Mifflin–St Jeor 公式，${t.age} 岁</td></tr>
  <tr><td>每日消耗 TDEE</td><td>${t.tdee} kcal</td><td class="mut">BMR × 活动系数</td></tr>
  <tr><td><b>热量</b></td><td><b>${t.kcal} kcal</b></td><td class="mut">TDEE − ${p.deficitPct}% 缺口</td></tr>
  <tr><td>蛋白质</td><td>${t.protein} g</td><td class="mut">${t.proteinBasis}</td></tr>
  <tr><td>脂肪</td><td>${t.fat} g</td><td class="mut">热量的 ${t.fatPct}%（不低于 20%）</td></tr>
  <tr><td>碳水</td><td>${t.carbs} g</td><td class="mut">剩余热量，主要来自杂粮饭</td></tr>
  <tr><td>膳食纤维</td><td>25–30 g</td><td class="mut">帮助饱腹和排便</td></tr>
  <tr><td>饮水</td><td>${t.water} ml</td><td class="mut">约 ${p.usesPowder ? 35 : 30} ml/kg</td></tr>
  <tr><td>BMI</td><td>${t.bmi}</td><td></td></tr></table>
  ${t.warnings.map(w => `<p class="warn">⚠ ${w}</p>`).join('')}${fl ? `<p class="warn">⚠ ${fl}</p>` : ''}
  ${goalPace(p)}<p class="mut">若肌肉完全保留，${p.goalWeight} kg 时体脂约 ${r1(pbf)}%${pbf < 12 ? '，已非常精瘦；建议到 62–64 kg 时结合腰围/照片重新评估目标' : ''}。</p></section>
  <section class="card"><h2>体重记录</h2><form id="wf" class="row"><input type="number" step="0.1" name="w" inputmode="decimal" placeholder="今日体重 kg" aria-label="今日体重" value="${weights.length ? weights[weights.length - 1].weight : ''}"><input type="date" name="d" value="${today()}" aria-label="日期"><button>记录</button></form>
  ${weightChart(weights, p.goalWeight)}
  <ul class="list">${weights.slice(-5).reverse().map(w => `<li>${w.date} · ${w.weight} kg</li>`).join('') || '<li class="mut">还没有记录</li>'}</ul></section>
  <section class="card"><h2>数据</h2><div class="row"><button id="exp" class="sec">导出备份</button><label style="margin:0">导入备份<input type="file" id="imp" accept="application/json"></label><button id="rst" class="sec">清空数据</button></div></section>
  <section class="card"><h2>更新日志</h2><ul class="list">${CHANGELOG.map(([v, d]) => `<li><b>v${v}</b> ${d}</li>`).join('')}</ul></section>`;
};
function sleepHtml(l, p) {
  const hm = t => { const d = new Date(t); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
  const entries = l.items.filter(i => i.t && food(i.id)).map(i => ({ id: i.id, time: hm(i.t), kcal: food(i.id).kcal * i.g / 100 }));
  const n = sleepNotes(entries, p);
  if (!p.sleepNudges) return '';
  return `<p class="mut">睡前提醒：${n.dinnerBy} 前吃完晚饭，${n.caffeineBy} 后不喝咖啡/茶（按 ${p.bedtime} 睡觉）。</p>${n.lateMeal ? `<p class="warn">${n.lateMeal.time} 吃了约 ${Math.round(n.lateMeal.kcal)} kcal，离睡觉较近，可能影响睡眠。偶尔一次没关系。</p>` : ''}${n.lateCaffeine ? `<p class="warn">${n.lateCaffeine.time} 摄入咖啡因，可能影响今晚入睡。</p>` : ''}`;
}
function goalPace(p) {
  const r = paceCheck({ currentKg: p.weight, goalKg: p.goalWeight, today: today(), goalDate: p.goalDate });
  const msg = { incomplete: '填写目标体重和日期后显示节奏。', reached: '已达到目标体重 🎉 可以把热量缺口改为 0% 维持。', gain: '目标体重高于当前体重，本应用按减脂设计。', 'invalid-date': '<span class="warn">目标日期需晚于今天。</span>' }[r.status];
  if (msg) return `<p class="mut">${msg}</p>`;
  const tail = { fast: '<span class="warn">，偏快（>1%/周），建议延后目标日期</span>', slow: '，偏慢（<0.25%/周），可以更早达到', ok: '，在合理范围内' }[r.status];
  return `<p class="mut">距目标 ${r1(p.weight - p.goalWeight)} kg，${r.days} 天（约 ${r1(r.weeks)} 周），需每周减 ${r1(r.kgPerWeek)} kg（${r1(r.pctPerWeek)}%/周）${tail}。</p>`;
}
views.me.bind = () => {
  const p = profile(); const f = $('#pf');
  for (const [k, v] of Object.entries(p)) { const el = f.elements[k]; if (!el) continue; if (el.type === 'checkbox') el.checked = !!v; else el.value = v; }
  f.onsubmit = e => { e.preventDefault(); const d = Object.fromEntries(new FormData(f)); for (const k in d) if (!['sex', 'activity', 'birth', 'goalDate', 'proteinMode', 'bedtime'].includes(k)) d[k] = +d[k]; d.usesPowder = f.elements.usesPowder.checked; d.sleepNudges = f.elements.sleepNudges.checked; S.set('profile', { ...p, ...d }); render(); };
  $('#wf').onsubmit = e => {
    e.preventDefault(); const w = +e.target.w.value; const date = e.target.d.value || today(); if (!w) return;
    const old = S.get('weights', []); if (old.some(x => x.date === date) && !confirm(`${date} 已有记录，覆盖？`)) return;
    const ws = old.filter(x => x.date !== date); ws.push({ date, weight: w }); ws.sort((a, b) => a.date.localeCompare(b.date)); S.set('weights', ws);
    if (date === ws[ws.length - 1].date) S.set('profile', { ...p, weight: w });
    render();
  };
  $('#exp').onclick = () => { const blob = new Blob([JSON.stringify(S.exportAll(), null, 1)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `zuofansong-backup-${today()}.json`; a.click(); };
  $('#imp').onchange = async e => { try { const o = JSON.parse(await e.target.files[0].text()); const n = S.importAll(o); alert('导入成功：' + n + ' 项'); render(); } catch (err) { alert(err.message || '文件格式不正确'); } };
  $('#rst').onclick = () => { if (confirm('确定清空所有本地数据？建议先导出备份。')) { S.resetAll(); render(); } };
};

views.foods = () => `<section class="card"><h2>食材库（${allFoods().length}）</h2><input id="q" placeholder="搜索：中文 / 拼音 / 标签（如 外卖、高纤）" aria-label="搜索食材"><p class="mut">每 100 g 可食部。名称带“熟”的为熟重，其余为生重。≈ 表示估算/未核实；✓ 表示已按 USDA FDC 核实。价格为上海估价。外卖数据误差可达 10–20% 甚至更多。</p><ul class="list" id="fl"></ul></section>
<section class="card"><h3>添加自定义食材</h3><form id="cf"><input name="name" placeholder="名称" required aria-label="名称"><div class="row"><input name="kcal" type="number" step="any" placeholder="kcal" required aria-label="热量"><input name="protein" type="number" step="any" placeholder="蛋白 g" aria-label="蛋白"><input name="fat" type="number" step="any" placeholder="脂肪 g" aria-label="脂肪"><input name="carbs" type="number" step="any" placeholder="碳水 g" aria-label="碳水"><input name="fiber" type="number" step="any" placeholder="纤维 g" aria-label="纤维"></div><button>添加</button></form></section>`;
views.foods.bind = () => {
  const draw = () => {
    const q = $('#q').value.trim().toLowerCase();
    const list = allFoods().filter(f => !q || f.name.includes(q) || (f.py || '').includes(q) || (f.tags || []).some(t => t.includes(q)) || (f.cat || '').includes(q));
    $('#fl').innerHTML = list.map(f => `<li><b>${esc(f.name)}</b> ${f.verified ? '✓' : ''} <span class="chip">${esc(f.cat || '自定义')}</span>${(f.tags || []).map(t => `<span class="chip">${esc(t)}</span>`).join('')}<br><span class="mut">${approx(f)}${f.kcal} kcal · 蛋白 ${f.protein} · 脂肪 ${f.fat} · 碳水 ${f.carbs} · 纤维 ${f.fiberEst ? '≈' : ''}${f.fiber}${f.priceCNYPer500g ? ` · ≈¥${f.priceCNYPer500g}/斤` : ''}${f.unit ? ` · 1${f.unit.name}≈${f.unit.g}g≈${Math.round(f.kcal * f.unit.g / 100)} kcal` : ''} · 来源 ${esc(f.source || '用户')}${f.note ? ' · ' + esc(f.note) : ''}</span></li>`).join('') || '<li class="mut">没有匹配的食材，可在下方添加</li>';
  };
  $('#q').oninput = draw; draw();
  $('#cf').onsubmit = e => { e.preventDefault(); const d = Object.fromEntries(new FormData(e.target)); const f = { id: 'c' + Date.now(), name: d.name, cat: '自定义', tags: ['自定义'], source: '用户', verified: false }; for (const k of ['kcal', 'protein', 'fat', 'carbs', 'fiber']) f[k] = +d[k] || 0; S.set('customFoods', [...S.get('customFoods', []), f]); e.target.reset(); draw(); };
};

const GRAINS = ['rice', 'millet', 'cornGrits', 'oatRice', 'brownRice', 'blackRice', 'buckwheat'];
views.rice = () => `<section class="card"><h2>杂粮饭配比器</h2><form id="rf">${GRAINS.map(id => { const f = food(id); return `<label>${f.name}${f.soak ? '（需浸泡）' : ''} <span id="pv-${id}"></span>%<input type="range" min="0" max="100" step="5" name="${id}"></label>`; }).join('')}
<label>一碗熟饭（克）<input type="number" name="bowl" value="150"></label></form><div id="rout"></div><button id="rsave" class="sec">收藏这个配比</button>
<p class="mut">注意：杂粮饭每克热量和白米饭几乎一样（如 200 g 熟饭换成糙米饭：纤维 +2.4 g、热量 −14 kcal）。好处是纤维更多、升糖更慢；控制热量靠称重。</p>
<p class="mut">食品安全：煮好的饭 1 小时内摊开放凉并入冰箱，24 小时内吃完，只加热一次并热透（英国 FSA/NHS）。不要在电饭煲里保温过夜。</p></section><section class="card"><h3>我的配比</h3><ul class="list" id="rfav"></ul></section>`;
views.rice.bind = () => {
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
  const drawFav = () => { const favs = S.get('riceFavs', []); $('#rfav').innerHTML = favs.map((r, i) => `<li><a href="#rice" data-i="${i}">${GRAINS.filter(id => r[id] > 0).map(id => food(id).name + ' ' + r[id] + '%').join(' + ')}</a></li>`).join('') || '<li class="mut">暂无</li>'; $('#rfav').querySelectorAll('a').forEach(a => a.onclick = () => { S.set('riceCurrent', favs[a.dataset.i]); render(); }); };
  $('#rsave').onclick = () => { S.set('riceFavs', [...S.get('riceFavs', []), S.get('riceCurrent')]); drawFav(); };
  drawFav();
};

views.plate = () => {
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
function plateScores(items) {
  const fs = items.map(i => food(i.id)).filter(Boolean);
  const tot = totals(items);
  const cost = tot.cost;
  const health = Math.max(1, Math.min(5, 1 + (tot.fiber >= 6 ? 1.5 : tot.fiber / 4) + (tot.protein >= 25 ? 1.5 : tot.protein / 17) + (tot.fat <= 20 ? 1 : 0) - (fs.some(f => f.fatClass === 'low') ? 1 : 0)));
  const easy = Math.round(fs.reduce((s, f) => s + (f.ease || 3), 0) / (fs.length || 1));
  const cheap = cost < 8 ? 5 : cost < 12 ? 4 : cost < 18 ? 3 : cost < 25 ? 2 : 1;
  const tasty = Math.min(5, 2 + ((items.find(i => i.id === 'oil')?.g || 0) >= 6 ? 1 : 0) + (fs.some(f => ['seabass', 'shrimp', 'shrimpCooked', 'leanBeef', 'chickenThigh', 'thighRoasted', 'egg', 'eggUSDA', 'porkLoin', 'salmon', 'hairtail', 'pomfret'].includes(f.id)) ? 1 : 0) + (fs.some(f => (f.tags || []).includes('杂粮')) ? 0.5 : 1));
  return { health: Math.round(health), easy, cheap, tasty: Math.round(tasty), cost: r1(cost), tot };
}
views.plate.bind = () => {
  const f = $('#plf'); f.s.value = 'riceCooked'; f.p.value = 'thighRoasted'; f.v.value = 'shanghaiQing';
  const t = computeTargets(profile());
  const calc = () => { const sc = plateScores(plateItems(f)); const x = sc.tot; const per = { kcal: t.kcal / 3, protein: t.protein / 3, fat: t.fat / 3, fiber: 9 };
    $('#plout').innerHTML = `热量 ${Math.round(x.kcal)} kcal${bar(x.kcal, per.kcal)}蛋白 ${r1(x.protein)} g${bar(x.protein, per.protein)}脂肪 ${r1(x.fat)} g${bar(x.fat, per.fat)}纤维 ${r1(x.fiber)} g${bar(x.fiber, per.fiber)}
    <p>健康 ${'★'.repeat(sc.health)} · 好做 ${'★'.repeat(sc.easy)} · 便宜 ${'★'.repeat(sc.cheap)} · 好吃 ${'★'.repeat(sc.tasty)}<br><span class="mut">估算成本 ≈ ¥${sc.cost}</span></p>`; };
  f.oninput = calc; calc();
  $('#pllog').onclick = () => { const l = getLog(); l.items.push(...plateItems(f).map(i => ({ ...i, t: Date.now() }))); setLog(l); location.hash = '#today'; };
  $('#plsave').onclick = () => { const items = plateItems(f); const name = prompt('模板名称', items.filter(i => i.id !== 'oil').map(i => food(i.id).name).join(' + ')); if (!name) return; S.set('templates', [{ id: 'u' + Date.now(), name, items: items.map(i => [i.id, i.g]) }, ...S.get('templates', [])]); $('#plsave').textContent = '✓ 已保存'; };
};

const VEG_FILTERS = ['≤5分钟', '不开火', '微波', '护腕', '一锅'];
function recipeItems(r) { return [...r.items.map(([id, g]) => ({ id, g })), ...(r.oil ? [{ id: 'oil', g: r.oil }] : [])]; }
views.veg = () => `<section class="card"><h2>懒人蔬菜（${RECIPES.length} 道）</h2><p class="mut">全部 ≤10 分钟动手、≤5 种食材，每道标出用油克数。护腕 = 不颠锅、少用力。</p><div class="row" id="vf">${VEG_FILTERS.map(t => `<label style="flex:none"><input type="checkbox" value="${t}" style="width:auto;min-height:auto"> ${t}</label>`).join('')}</div><ul class="list" id="vl"></ul></section>`;
views.veg.bind = () => {
  const draw = () => {
    const on = [...document.querySelectorAll('#vf input:checked')].map(i => i.value);
    const list = RECIPES.filter(r => on.every(t => r.tags.includes(t)));
    $('#vl').innerHTML = list.map(r => { const x = totals(recipeItems(r)); return `<li><details><summary><b>${esc(r.name)}</b> · ${r.min} 分钟 · 油 ${r.oil} g · ≈${Math.round(x.kcal)} kcal · ≈¥${r1(x.cost)} ${r.tags.map(t => `<span class="chip">${t}</span>`).join('')}</summary>
      <p class="mut">食材：${r.items.map(([id, g]) => `${food(id)?.name || id} ${g} g`).join('、')}${r.oil ? `、油 ${r.oil} g（≈${r1(r.oil / TSP_OIL_G)} 茶匙）` : ''}<br>整份：蛋白 ${r1(x.protein)} g · 脂肪 ${r1(x.fat)} g · 碳水 ${r1(x.carbs)} g · 纤维 ${r1(x.fiber)} g（约 2 人份或 1 天的蔬菜）</p>
      <ol>${r.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol><button class="sec" data-log="${r.id}" data-half="1">记入今日（半份）</button> <button class="sec" data-log="${r.id}">记入今日（整份）</button></details></li>`; }).join('') || '<li class="mut">没有符合全部条件的菜，少选一个筛选试试</li>';
    document.querySelectorAll('[data-log]').forEach(b => b.onclick = () => { const r = RECIPES.find(x => x.id === b.dataset.log); const k = b.dataset.half ? 0.5 : 1; const l = getLog(); l.items.push(...recipeItems(r).map(i => ({ id: i.id, g: i.g * k, t: Date.now() }))); setLog(l); b.textContent = '✓ 已记入'; });
  };
  $('#vf').onchange = draw; draw();
};

views.today = () => {
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
views.today.bind = () => {
  const pushItems = (items, name) => { const l = getLog(); const n0 = l.items.length; l.items.push(...items.map(([id, g]) => ({ id, g, t: Date.now() }))); setLog(l); S.set('undo', { date: today(), from: n0, name }); render(); };
  const addItem = (id, g) => { S.set('recents', [id, ...S.get('recents', []).filter(x => x !== id)].slice(0, 12)); pushItems([[id, g]], food(id).name); };
  $('#af').onsubmit = e => { e.preventDefault(); const d = e.target; const q = d.f.value.trim(); if (!q) return; const f = allFoods().find(x => x.name === q) || allFoods().find(x => x.name.includes(q) || (x.py || '') === q.toLowerCase()); if (!f) { alert('没找到这个食材，可在“食材”页添加'); return; } const n = +d.n.value || 1; let g = n; if (d.u.value === 'unit') g = n * (f.unit?.g || 100); if (d.u.value === 'bowl') g = n * 150 / (f.yield || 1); addItem(f.id, g); };
  document.querySelectorAll('[data-r]').forEach(b => b.onclick = () => { const f = food(b.dataset.r); addItem(f.id, f.unit?.g || 100); });
  document.querySelectorAll('[data-tpl]').forEach(b => b.onclick = () => { const tp = templates().find(x => x.id === b.dataset.tpl); const use = S.get('templateUse', {}); use[tp.id] = (use[tp.id] || 0) + 1; S.set('templateUse', use); pushItems(scaleItems(tp.items, tplMult()), tplMult() === 1 ? tp.name : `${tp.name} ×${tplMult()}`); });
  document.querySelectorAll('[data-mult]').forEach(b => b.onclick = () => { S.set('tplMult', +b.dataset.mult); render(); });
  document.querySelectorAll('[data-swap]').forEach(b => b.onclick = () => { const s = suggestFiber({ fiber: 0, kcal: 0, kcalTarget: 1e9 }, 99).find(x => x.id === b.dataset.swap); if (s) pushItems(s.add, s.text); });
  const u = $('#undo'); if (u) u.onclick = () => { const un = S.get('undo'); const l = getLog(); l.items = l.items.slice(0, un.from); setLog(l); S.set('undo', null); render(); };
  document.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { const l = getLog(); l.items.splice(+b.dataset.del, 1); setLog(l); S.set('undo', null); render(); });
  const water = d => { const l = getLog(); l.water = Math.max(0, l.water + d); setLog(l); render(); };
  $('#w250').onclick = () => water(250); $('#w500').onclick = () => water(500); $('#wm').onclick = () => water(-250);
  $('#planDay').onclick = () => pushItems(PLAN_DAY, '我的计划日');
  $('#copyY').onclick = () => { const yl = getLog(dayOffset(-1)); if (!yl.items.length) { alert('昨天没有记录'); return; } pushItems(yl.items.map(i => [i.id, i.g]), '昨天的饮食'); };
};

function render() {
  const name = (location.hash || '#today').slice(1); const v = views[name] || views.today;
  try { $('#view').innerHTML = v(); v.bind && v.bind(); }
  catch (e) { console.error(e); $('#view').innerHTML = `<section class="card"><h2>出错了</h2><p class="mut">${esc(e.message)}</p><p>可以刷新重试，或在“我的”页导出备份。</p></section>`; }
  document.querySelectorAll('.tabs a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + name));
}
$('#ver').textContent = 'v' + VERSION;
window.addEventListener('hashchange', render);
render();
registerSW();
