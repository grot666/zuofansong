// View: me (A6). Browser-only.
import { computeTargets, ACTIVITY, fastLossWarning, projectedBodyFat } from '../core/targets.js';
import { blend } from '../core/grains.js';
import { fatWallet, TSP_OIL_G } from '../core/fat.js';
import { proteinGap, gutRisk } from '../core/protein.js';
import { suggestFiber } from '../core/fiber.js';
import { ma7, weeklyStatus } from '../core/weight.js';
import * as S from '../core/store.js';
import { addDays } from '../core/dates.js';
import { FOODS } from '../../data/foods.js';
import { FOODS2 } from '../../data/foods2.js';
import { FOODS3 } from '../../data/foods3.js';
import { RECIPES } from '../../data/recipes.js';
import { VERSION, CHANGELOG } from '../core/version.js';
import { mergeProfileEdit, DEFAULT_PROFILE, normalizeProfile, paceCheck } from '../core/profile.js';
import { MULTS, scaleItems } from '../core/portion.js';
import { sleepNotes } from '../core/sleep.js';
import { makeIndex, totals as sumTotals, proteinPerYuan } from '../core/foods.js';
import { setRender, rerender, $, esc, r1, today, dayOffset, PLAN_DAY, PRESET_TEMPLATES, profile, refreshFoods, allFoods, food, logKey, getLog, setLog, tplMult, templates, totals, bar, approx } from '../ui.js';

const RANGES = [[4, '4周'], [8, '8周'], [12, '12周'], [0, '全部']];
function weightChart(ws, goal) {
  if (ws.length < 2) return '<p class="mut">每周称 2–3 次，早上空腹、如厕后。至少 3 次记录后显示 7 日均线。</p>';
  const wk = S.get('wRange', 8); const from = wk ? addDays(today(), -7 * wk) : '';
  let pts = ma7(ws).filter(p => p.date >= from); if (pts.length < 2) pts = ma7(ws).slice(-2);
  const chips = `<div class="row" role="group" aria-label="时间范围">${RANGES.map(([w, l]) => `<button class="${w === wk ? '' : 'sec'}" data-wr="${w}" aria-pressed="${w === wk}">${l}</button>`).join('')}</div>`;
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
  return chips + `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="体重趋势：最新 ${last.weight} kg${last.ma ? '，7 日均 ' + r1(last.ma) + ' kg' : ''}" style="color:var(--acc)">${goalLine}${dots}${line ? `<polyline points="${line}" fill="none" stroke="currentColor" stroke-width="2.5"/>` : ''}<text x="${P}" y="12" font-size="10" fill="currentColor">${r1(hi)}</text><text x="${P}" y="${H - 4}" font-size="10" fill="currentColor">${r1(lo)}</text></svg>
  <p>${last.ma ? `7 日均 <b>${r1(last.ma)} kg</b>` : ''}${st ? ` · 每周 ${st.deltaKg > 0 ? '+' : ''}${r1(st.deltaKg)} kg（${r1(-st.pct)}%）· ${stText}` : ''}<br><span class="mut">点 = 每次称重，线 = 7 日均值，虚线 = 目标。看均值，不看单日波动。${st && st.status === 'flat' ? '连续 2–3 周持平可考虑热量再减 100–150 kcal 或增加步数。' : ''}</span></p>`;
}

export const view = () => {
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
  <section class="card"><h2>数据</h2><div class="row"><button id="exp" class="sec">导出备份</button><label style="margin:0">导入备份<input type="file" id="imp" accept="application/json"></label>${S.get('backup.preImport', null) ? '<button id="undoImp" class="sec">撤销上次导入</button>' : ''}<button id="rst" class="sec">清空数据</button></div></section>
  <section class="card"><h2>更新日志</h2><ul class="list">${CHANGELOG.map(([v, d]) => `<li><b>v${v}</b> ${d}</li>`).join('')}</ul></section>`;
};
function goalPace(p) {
  const r = paceCheck({ currentKg: p.weight, goalKg: p.goalWeight, today: today(), goalDate: p.goalDate });
  const msg = { incomplete: '填写目标体重和日期后显示节奏。', reached: '已达到目标体重 🎉 可以把热量缺口改为 0% 维持。', gain: '目标体重高于当前体重，本应用按减脂设计。', 'invalid-date': '<span class="warn">目标日期需晚于今天。</span>' }[r.status];
  if (msg) return `<p class="mut">${msg}</p>`;
  const tail = { fast: '<span class="warn">，偏快（>1%/周），建议延后目标日期</span>', slow: '，偏慢（<0.25%/周），可以更早达到', ok: '，在合理范围内' }[r.status];
  return `<p class="mut">距目标 ${r1(p.weight - p.goalWeight)} kg，${r.days} 天（约 ${r1(r.weeks)} 周），需每周减 ${r1(r.kgPerWeek)} kg（${r1(r.pctPerWeek)}%/周）${tail}。</p>`;
}
view.bind = () => {
  document.querySelectorAll('[data-wr]').forEach(b => b.onclick = () => { S.set('wRange', +b.dataset.wr); rerender(); });
  const p = profile(); const f = $('#pf');
  for (const [k, v] of Object.entries(p)) { const el = f.elements[k]; if (!el) continue; if (el.type === 'checkbox') el.checked = !!v; else el.value = v; }
  f.onsubmit = e => { e.preventDefault(); const d = Object.fromEntries(new FormData(f)); for (const k in d) if (!['sex', 'activity', 'birth', 'goalDate', 'proteinMode', 'bedtime'].includes(k)) d[k] = +d[k]; d.usesPowder = f.elements.usesPowder.checked; d.sleepNudges = f.elements.sleepNudges.checked; S.set('profile', mergeProfileEdit(S.get('profile', {}), d)); rerender(); };
  $('#wf').onsubmit = e => {
    e.preventDefault(); const w = +e.target.w.value; const date = e.target.d.value || today(); if (!w) return;
    const old = S.get('weights', []); if (old.some(x => x.date === date) && !confirm(`${date} 已有记录，覆盖？`)) return;
    const ws = old.filter(x => x.date !== date); ws.push({ date, weight: w }); ws.sort((a, b) => a.date.localeCompare(b.date)); S.set('weights', ws);
    if (date === ws[ws.length - 1].date) S.set('profile', mergeProfileEdit(S.get('profile', {}), { weight: w }));
    rerender();
  };
  $('#exp').onclick = () => { const blob = new Blob([JSON.stringify(S.exportAll(), null, 1)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `zuofansong-backup-${today()}.json`; a.click(); };
  const ui = $('#undoImp'); if (ui) ui.onclick = () => { if (confirm('恢复到导入前的数据？')) { S.undoImport(); rerender(); } };
  $('#imp').onchange = async e => { try { const o = JSON.parse(await e.target.files[0].text()); if (!confirm('导入会替换当前全部数据（可撤销一次）。继续？')) return; const n = S.importAll(o); alert('导入成功：' + n + ' 项'); rerender(); } catch (err) { alert(err.message || '文件格式不正确'); } };
  $('#rst').onclick = () => { if (confirm('确定清空所有本地数据？建议先导出备份。')) { S.resetAll(); rerender(); } };
};

