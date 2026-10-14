import { computeTargets, ACTIVITY, fastLossWarning, projectedBodyFat } from './core/targets.js';
import { blend } from './core/grains.js';
import { fatWallet, TSP_OIL_G } from './core/fat.js';
import { proteinGap, gutRisk } from './core/protein.js';
import * as S from './core/store.js';
import { FOODS } from '../data/foods.js';
import { FOODS2 } from '../data/foods2.js';
import { RECIPES } from '../data/recipes.js';

export const VERSION = '0.2.0';
const CHANGELOG = [
  ['0.2.0', '新增懒人蔬菜 32 道（含油克数、筛选）；食材增至约 100 种，22 种按 USDA FDC 核实；蛋白目标支持自定/去脂体重模式（默认按你的计划 140 g）；一键记入“我的计划日”；纤维不足提示；杂粮饭食品安全提示。'],
  ['0.1.0', '首个版本：我的目标、食材库、杂粮饭配比器、今日饮食、脂肪预算、蛋白补充、饮水纤维。'],
];
S.migrate();
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const r1 = n => Math.round(n * 10) / 10;
const today = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
const dayOffset = n => { const d = new Date(Date.now() + n * 86400000); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };

// Owner's plan doc: 1700-2000 kcal, protein 130-160 g, fat 50-70 g.
const DEFAULT_PROFILE = { sex: 'male', birth: '1997-07-31', height: 173.5, weight: 74, goalWeight: 58, goalDate: '2027-07-31', activity: 'sedentary', deficitPct: 20, proteinMode: 'fixed', proteinTarget: 140, proteinPerKg: 1.6, bodyFatPct: 27.5, proteinPerFfm: 2.5, fatPct: 25, scoopG: 24, maxScoops: 2, trainingDays: 2, usesPowder: false };
// Owner's sample day (research R4.2): ≈1782 kcal / 149 g P / 62 g F / 15 g fiber.
const PLAN_DAY = [['eggUSDA', 150], ['riceCooked', 400], ['thighRoasted', 360], ['tunaLight', 100], ['broccoliUSDA', 300], ['carrot', 200], ['oil', 15]];
const profile = () => ({ ...DEFAULT_PROFILE, ...S.get('profile', {}) });
const allFoods = () => [...FOODS, ...FOODS2, ...S.get('customFoods', [])];
const food = id => allFoods().find(f => f.id === id);
const logKey = d => 'log.' + d;
const getLog = (d = today()) => S.get(logKey(d), { items: [], water: 0 });
const setLog = (l, d = today()) => S.set(logKey(d), l);

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
  <section class="card"><h2>体重记录</h2><form id="wf" class="row"><input type="number" step="0.1" name="w" placeholder="今日体重 kg" aria-label="今日体重"><button>记录</button></form>
  ${weightAvg(weights)}
  <ul class="list">${weights.slice(-7).reverse().map(w => `<li>${w.date} · ${w.weight} kg</li>`).join('') || '<li class="mut">还没有记录</li>'}</ul></section>
  <section class="card"><h2>数据</h2><div class="row"><button id="exp" class="sec">导出备份</button><label style="margin:0">导入备份<input type="file" id="imp" accept="application/json"></label><button id="rst" class="sec">清空数据</button></div></section>
  <section class="card"><h2>更新日志</h2><ul class="list">${CHANGELOG.map(([v, d]) => `<li><b>v${v}</b> ${d}</li>`).join('')}</ul></section>`;
};
function weightAvg(ws) {
  if (ws.length < 2) return '';
  const last7 = ws.slice(-7); const avg = last7.reduce((s, w) => s + w.weight, 0) / last7.length;
  const prev = ws.slice(-14, -7); const pavg = prev.length ? prev.reduce((s, w) => s + w.weight, 0) / prev.length : null;
  return `<p>最近 7 次平均 <b>${r1(avg)} kg</b>${pavg ? `（上一组 ${r1(pavg)} kg，变化 ${r1(avg - pavg)} kg）` : ''}<br><span class="mut">看平均值，不看单日波动。</span></p>`;
}
function goalPace(p) {
  const weeks = (new Date(p.goalDate) - new Date()) / 604800000;
  if (!(weeks > 0)) return '';
  const perWeek = (p.weight - p.goalWeight) / weeks;
  const pct = perWeek / p.weight * 100;
  return `<p class="mut">距目标 ${r1(p.weight - p.goalWeight)} kg，约 ${Math.round(weeks)} 周，需每周减 ${r1(perWeek)} kg（${r1(pct)}%/周）${pct > 1 ? '<span class="warn">，偏快，可考虑延后目标日期</span>' : '，在 0.5–1%/周的合理范围内'}。</p>`;
}
views.me.bind = () => {
  const p = profile(); const f = $('#pf');
  for (const [k, v] of Object.entries(p)) { const el = f.elements[k]; if (!el) continue; if (el.type === 'checkbox') el.checked = !!v; else el.value = v; }
  f.onsubmit = e => { e.preventDefault(); const d = Object.fromEntries(new FormData(f)); for (const k in d) if (!['sex', 'activity', 'birth', 'goalDate', 'proteinMode'].includes(k)) d[k] = +d[k]; d.usesPowder = f.elements.usesPowder.checked; S.set('profile', { ...p, ...d }); render(); };
  $('#wf').onsubmit = e => { e.preventDefault(); const w = +e.target.w.value; if (!w) return; const ws = S.get('weights', []).filter(x => x.date !== today()); ws.push({ date: today(), weight: w }); ws.sort((a, b) => a.date.localeCompare(b.date)); S.set('weights', ws); S.set('profile', { ...p, weight: w }); render(); };
  $('#exp').onclick = () => { const blob = new Blob([JSON.stringify(S.exportAll(), null, 1)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `zuofansong-backup-${today()}.json`; a.click(); };
  $('#imp').onchange = async e => { try { const o = JSON.parse(await e.target.files[0].text()); S.importAll(o); alert('导入成功'); render(); } catch { alert('文件格式不正确'); } };
  $('#rst').onclick = () => { if (confirm('确定清空所有本地数据？建议先导出备份。')) { S.resetAll(); render(); } };
};

views.foods = () => `<section class="card"><h2>食材库（${allFoods().length}）</h2><input id="q" placeholder="搜索：中文 / 拼音 / 标签" aria-label="搜索食材"><p class="mut">每 100 g 可食部。名称带“熟”的为熟重，其余为生重。≈ 表示估算/未核实；✓ 表示已按 USDA FDC 核实。价格为上海估价。</p><ul class="list" id="fl"></ul></section>
<section class="card"><h3>添加自定义食材</h3><form id="cf"><input name="name" placeholder="名称" required aria-label="名称"><div class="row"><input name="kcal" type="number" step="any" placeholder="kcal" required aria-label="热量"><input name="protein" type="number" step="any" placeholder="蛋白 g" aria-label="蛋白"><input name="fat" type="number" step="any" placeholder="脂肪 g" aria-label="脂肪"><input name="carbs" type="number" step="any" placeholder="碳水 g" aria-label="碳水"><input name="fiber" type="number" step="any" placeholder="纤维 g" aria-label="纤维"></div><button>添加</button></form></section>`;
views.foods.bind = () => {
  const draw = () => {
    const q = $('#q').value.trim().toLowerCase();
    const list = allFoods().filter(f => !q || f.name.includes(q) || (f.py || '').includes(q) || (f.tags || []).some(t => t.includes(q)) || (f.cat || '').includes(q));
    $('#fl').innerHTML = list.map(f => `<li><b>${esc(f.name)}</b> ${f.verified ? '✓' : ''} <span class="chip">${esc(f.cat || '自定义')}</span>${(f.tags || []).map(t => `<span class="chip">${esc(t)}</span>`).join('')}<br><span class="mut">${approx(f)}${f.kcal} kcal · 蛋白 ${f.protein} · 脂肪 ${f.fat} · 碳水 ${f.carbs} · 纤维 ${f.fiber}${f.priceCNYPer500g ? ` · ≈¥${f.priceCNYPer500g}/斤` : ''}${f.unit ? ` · 1${f.unit.name}≈${f.unit.g}g` : ''} · 来源 ${esc(f.source || '用户')}${f.note ? ' · ' + esc(f.note) : ''}</span></li>`).join('') || '<li class="mut">没有匹配的食材，可在下方添加</li>';
  };
  $('#q').oninput = draw; draw();
  $('#cf').onsubmit = e => { e.preventDefault(); const d = Object.fromEntries(new FormData(e.target)); const f = { id: 'c' + Date.now(), name: d.name, cat: '自定义', tags: ['自定义'], source: '用户', verified: false }; for (const k of ['kcal', 'protein', 'fat', 'carbs', 'fiber']) f[k] = +d[k] || 0; S.set('customFoods', [...S.get('customFoods', []), f]); e.target.reset(); draw(); };
};

const GRAINS = ['rice', 'millet', 'cornGrits', 'oatRice', 'brownRice', 'blackRice', 'buckwheat'];
views.rice = () => `<section class="card"><h2>杂粮饭配比器</h2><form id="rf">${GRAINS.map(id => { const f = food(id); return `<label>${f.name}${f.soak ? '（需浸泡）' : ''} <span id="pv-${id}"></span>%<input type="range" min="0" max="100" step="5" name="${id}"></label>`; }).join('')}
<label>一碗熟饭（克）<input type="number" name="bowl" value="150"></label></form><div id="rout"></div><button id="rsave" class="sec">收藏这个配比</button>
<p class="mut">注意：杂粮饭每克热量和白米饭几乎一样，好处是纤维更多、升糖更慢、更抗饿。控制热量靠称重。</p>
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
  const opt = cat => allFoods().filter(f => f.cat === cat).map(f => `<option value="${f.id}">${f.name}</option>`).join('');
  return `<section class="card"><h2>一餐搭配</h2><form id="plf">
  <div class="row"><label>主食<select name="s">${opt('主食')}</select></label><label>克<input type="number" name="sg" value="150"></label></div>
  <div class="row"><label>蛋白<select name="p">${opt('蛋白')}</select></label><label>克<input type="number" name="pg" value="120"></label></div>
  <div class="row"><label>蔬菜<select name="v">${opt('蔬菜')}</select></label><label>克<input type="number" name="vg" value="250"></label></div>
  <label>炒菜油（茶匙，1 茶匙≈${TSP_OIL_G} g）<input type="number" step="0.5" name="oil" value="1.5"></label></form>
  <p class="mut">注意生重/熟重：名称带“熟”的按熟重称。每餐目标约 ${Math.round(per.kcal)} kcal / 蛋白 ${Math.round(per.protein)} g / 脂肪 ${Math.round(per.fat)} g。</p><div id="plout"></div><button id="pllog">记入今日</button></section>`;
};
function plateItems(f) { return [{ id: f.s.value, g: +f.sg.value }, { id: f.p.value, g: +f.pg.value }, { id: f.v.value, g: +f.vg.value }, { id: 'oil', g: +f.oil.value * TSP_OIL_G }].filter(i => i.g > 0); }
function plateScores(items) {
  const fs = items.map(i => food(i.id)).filter(Boolean);
  const tot = totals(items);
  const cost = tot.cost;
  const health = Math.max(1, Math.min(5, 1 + (tot.fiber >= 6 ? 1.5 : tot.fiber / 4) + (tot.protein >= 25 ? 1.5 : tot.protein / 17) + (tot.fat <= 20 ? 1 : 0) - (fs.some(f => f.fatClass === 'low') ? 1 : 0)));
  const easy = Math.round(fs.reduce((s, f) => s + (f.ease || 3), 0) / (fs.length || 1));
  const cheap = cost < 8 ? 5 : cost < 12 ? 4 : cost < 18 ? 3 : cost < 25 ? 2 : 1;
  const tasty = Math.min(5, 2 + ((items.find(i => i.id === 'oil')?.g || 0) >= 6 ? 1 : 0) + (fs.some(f => ['seabass', 'shrimp', 'shrimpCooked', 'leanBeef', 'chickenThigh', 'thighRoasted', 'egg', 'eggUSDA', 'porkLoin', 'salmon'].includes(f.id)) ? 1 : 0) + (fs.some(f => (f.tags || []).includes('杂粮')) ? 0.5 : 1));
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
  const fiberLow = l.items.length && x.fiber < 25;
  return `<section class="card"><h2>今日 ${today()}</h2>
  热量 ${Math.round(x.kcal)} / ${t.kcal} kcal（还剩 ${Math.round(t.kcal - x.kcal)}）${bar(x.kcal, t.kcal)}
  蛋白 ${r1(x.protein)} / ${t.protein} g${bar(x.protein, t.protein)}
  碳水 ${r1(x.carbs)} / ${t.carbs} g${bar(x.carbs, t.carbs)}
  纤维 ${r1(x.fiber)} / 28 g${bar(x.fiber, 28)}
  ${fiberLow ? `<p class="warn">纤维偏低（还差 ${Math.round(28 - x.fiber)} g）。最省事的补法：早餐加 40 g 燕麦（+4 g）、饭里拌 100 g 青豆（+6 g）、加一份绿叶菜或 2 个猕猴桃（+5 g）。</p>` : ''}
  <p class="mut">估算食材成本 ≈ ¥${r1(x.cost)}</p></section>
  <section class="card"><h2>快速记录</h2><form id="af"><input list="fdl" name="f" placeholder="食材名称" aria-label="食材"><datalist id="fdl">${allFoods().map(f => `<option value="${esc(f.name)}">`).join('')}</datalist>
  <div class="row"><input type="number" name="n" value="100" step="any" aria-label="数量"><select name="u" aria-label="单位"><option value="g">克</option><option value="unit">个/勺/份（按食材单位）</option><option value="bowl">碗（熟饭 150 g）</option></select><button>添加</button></div></form>
  <div>${recents.map(id => food(id) ? `<button class="sec" data-r="${id}" style="margin:4px 4px 0 0">+ ${esc(food(id).name)}</button>` : '').join('')}</div>
  <ul class="list">${l.items.map((i, n) => { const f = food(i.id); return f ? `<li>${esc(f.name)} ${Math.round(i.g)} g · ${Math.round(f.kcal * i.g / 100)} kcal <button class="sec" data-del="${n}" aria-label="删除">✕</button></li>` : ''; }).join('') || '<li class="mut">还没有记录。可以一键记入你的计划日，或去“搭配”“蔬菜”页添加。</li>'}</ul>
  <div class="row" style="margin-top:8px"><button id="planDay" class="sec">记入我的计划日</button><button id="copyY" class="sec">复制昨天</button></div>
  <p class="mut">计划日 = 3 蛋 + 400 g 米饭 + 360 g 去皮鸡腿 + 1 罐水浸金枪鱼 + 300 g 西兰花 + 200 g 胡萝卜 + 15 g 油 ≈ 1780 kcal / 149 g 蛋白 / 62 g 脂肪 / 纤维仅 ≈15 g。</p></section>
  <section class="card"><h2>脂肪预算</h2>已用 ${fw.spent} / ${fw.budget} g（剩 ${fw.left} g）${bar(fw.spent, fw.budget)}
  <p class="mut">值得花：${fw.high} g（炒菜油、鸡蛋、鱼、坚果） · 一般：${fw.neutral} g · <span class="${fw.low ? 'bad' : ''}">低价值：${fw.low} g</span></p>
  ${lowItems.length ? `<p class="warn">低价值脂肪来自：${[...new Set(lowItems.map(i => food(i.id).name))].join('、')}。换成瘦肉/去皮鸡腿/清蒸鱼，可省出油给蔬菜调味。</p>` : '<p class="mut">炒菜油 1 茶匙 ≈ 4.5 g。把脂肪花在让蔬菜好吃的油上，比花在五花肉、鸡皮、外卖油上更划算。</p>'}</section>
  <section class="card"><h2>蛋白补充</h2><p>天然食物蛋白 ${Math.round(wholeProtein)} g，目标 ${t.protein} g，缺口 <b>${pg.gap} g</b>${pg.gap ? ` → 可用蛋白粉 <b>${pg.scoops} 勺</b>（每勺 ${p.scoopG} g，上限 ${p.maxScoops} 勺）${pg.left ? `，仍差 ${pg.left} g，可加 ${Math.ceil(pg.left / 6.3)} 个鸡蛋或豆腐` : ''}` : ' ✓'}</p><p class="mut">优先天然食物，蛋白粉只补缺口。</p></section>
  <section class="card"><h2>饮水与如厕舒适度</h2><p>饮水 ${l.water} / ${t.water} ml</p>${bar(l.water, t.water)}<div class="row"><button id="w250">+1 杯 250 ml</button><button id="w500" class="sec">+500 ml</button><button id="wm" class="sec">−250</button></div>
  <p>如厕舒适度风险：<b class="${gr.level === 'high' ? 'bad' : gr.level === 'mid' ? 'warn' : ''}">${{ high: '高', mid: '中', low: '低' }[gr.level]}</b>（${gr.score}/10）</p>${gr.fixes.length ? `<ul>${gr.fixes.map(f => `<li>${f}</li>`).join('')}</ul>` : ''}<p class="mut">若长期便秘或不适，请就医。</p></section>`;
};
views.today.bind = () => {
  const addItem = (id, g) => { const l = getLog(); l.items.push({ id, g, t: Date.now() }); setLog(l); S.set('recents', [id, ...S.get('recents', []).filter(x => x !== id)].slice(0, 12)); render(); };
  $('#af').onsubmit = e => { e.preventDefault(); const d = e.target; const q = d.f.value.trim(); if (!q) return; const f = allFoods().find(x => x.name === q) || allFoods().find(x => x.name.includes(q) || (x.py || '') === q.toLowerCase()); if (!f) { alert('没找到这个食材，可在“食材”页添加'); return; } const n = +d.n.value; let g = n; if (d.u.value === 'unit') g = n * (f.unit?.g || 100); if (d.u.value === 'bowl') g = n * 150 / (f.yield || 1); addItem(f.id, g); };
  document.querySelectorAll('[data-r]').forEach(b => b.onclick = () => { const f = food(b.dataset.r); addItem(f.id, f.unit?.g || 100); });
  document.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { const l = getLog(); l.items.splice(+b.dataset.del, 1); setLog(l); render(); });
  const water = d => { const l = getLog(); l.water = Math.max(0, l.water + d); setLog(l); render(); };
  $('#w250').onclick = () => water(250); $('#w500').onclick = () => water(500); $('#wm').onclick = () => water(-250);
  $('#planDay').onclick = () => { const l = getLog(); l.items.push(...PLAN_DAY.map(([id, g]) => ({ id, g, t: Date.now() }))); setLog(l); render(); };
  $('#copyY').onclick = () => { const yl = getLog(dayOffset(-1)); if (!yl.items.length) { alert('昨天没有记录'); return; } const l = getLog(); l.items.push(...yl.items); setLog(l); render(); };
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
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
