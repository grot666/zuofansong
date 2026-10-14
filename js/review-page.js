import { computeTargets } from './core/targets.js';
import { weekReview, plateau, lastNDates } from './core/review.js';
import { weeklyStatus } from './core/weight.js';
import * as S from './core/store.js';
import { FOODS } from '../data/foods.js';
import { FOODS2 } from '../data/foods2.js';
import { FOODS3 } from '../data/foods3.js';

const DEFAULT_PROFILE = { sex: 'male', birth: '1997-07-31', height: 173.5, weight: 74, goalWeight: 58, activity: 'sedentary', deficitPct: 20, proteinMode: 'fixed', proteinTarget: 140, fatPct: 25 };
const all = [...FOODS, ...FOODS2, ...FOODS3, ...S.get('customFoods', [])];
const food = id => all.find(f => f.id === id);
const r1 = n => Math.round(n * 10) / 10;
const $ = s => document.querySelector(s);
const localDate = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
const fmt = (v, unit, digits = 0) => v == null ? '<span class="mut">未记录</span>' : `${digits ? r1(v) : Math.round(v)} ${unit}`;

const DECISIONS = [
  ['keep', '保持当前计划'],
  ['minus', '热量再减约 125 kcal（缺口 +5%）'],
  ['steps', '每天多走 2000 步'],
  ['break', '下周做“维持周”（热量 = TDEE）'],
  ['sauce', '换一种调味轮换，防止吃腻'],
];

function render() {
  const p = { ...DEFAULT_PROFILE, ...S.get('profile', {}) };
  const t = computeTargets(p);
  const today = localDate();
  const dates = lastNDates(today, 7);
  const logs = Object.fromEntries(dates.map(d => [d, S.get('log.' + d, null)]));
  const r = weekReview(dates, logs, food, t);
  const ws = S.get('weights', []);
  const st = weeklyStatus(ws);
  const pl = plateau(ws, today);
  const saved = S.get('reviews', {})[today];
  const oilWarn = r.avgOil != null && r.avgOil > 30;
  $('#view').innerHTML = `<section class="card"><h2>最近 7 天 <small class="mut">${dates[0]} – ${dates[6]}</small></h2>
  <p class="mut">自动从记录里统计。没记的显示“未记录”，不算失败。</p>
  <table>
  <tr><td>1 体重</td><td>${st ? `每周 ${st.deltaKg > 0 ? '+' : ''}${r1(st.deltaKg)} kg（${r1(-st.pct)}%）` : '<span class="mut">数据不足</span>'}</td><td class="mut">${st ? { fast: '偏快', ok: '正常', flat: '持平', up: '上升', slow: '偏慢' }[st.status] : '每周称 ≥3 次'}</td></tr>
  <tr><td>2 热量</td><td>记录 ${r.logged}/7 天</td><td class="mut">±10% 内 ${r.kcalOkDays} 天；均 ${fmt(r.avgKcal, 'kcal')}</td></tr>
  <tr><td>3 蛋白</td><td>${fmt(r.avgProtein, 'g')}</td><td class="mut">目标 ${t.protein} g；达标 ${r.proteinOkDays} 天</td></tr>
  <tr><td>4 纤维</td><td>${fmt(r.avgFiber, 'g', 1)}</td><td class="mut">目标 25–30 g</td></tr>
  <tr><td>5 脂肪</td><td>${fmt(r.avgFat, 'g')}</td><td class="mut">低价值来源 ${Math.round(r.lowFatPct)}%</td></tr>
  <tr><td>用油</td><td>${fmt(r.avgOil, 'g', 1)}/天</td><td class="mut ${oilWarn ? 'warn' : ''}">膳食指南 ≤ 25–30 g</td></tr>
  <tr><td>6 饮水</td><td>${fmt(r.avgWater, 'ml')}</td><td class="mut">目标 ${t.water} ml</td></tr>
  <tr><td>7 花费</td><td>≈¥${Math.round(r.cost)}</td><td class="mut">外卖 ${r.takeaway} 次（外卖价格未计入）</td></tr>
  <tr><td>金枪鱼</td><td>淡 ${Math.round(r.tuna.light)} g · 白 ${Math.round(r.tuna.albacore)} g</td><td class="mut">保守参考：淡 ≤339 g/周，白 ≤113 g/周</td></tr>
  </table>
  ${r.tunaNotes.map(x => `<p class="warn">${x}。可换成虾、三文鱼、鲳鱼等低汞鱼类（FDA/EPA 对敏感人群的建议，作保守参考）。</p>`).join('')}
  ${pl.plateau ? '<p class="warn">最近 2 周体重均值基本持平，且记录充分。可以选“热量再减约 125 kcal”、“多走步”或 1–2 周“维持周”。</p>' : ''}</section>
  <section class="card"><h2>下周只做一个决定</h2><form id="df">${DECISIONS.map(([id, label]) => `<label><input type="radio" name="d" value="${id}" style="width:auto;min-height:auto" ${saved?.decision === id ? 'checked' : ''}> ${label}</label>`).join('')}
  <label>备注<input name="note" value="${saved?.note ? String(saved.note).replace(/"/g, '&quot;') : ''}"></label><button>保存</button></form><p id="dmsg" class="mut"></p></section>`;
  $('#df').onsubmit = e => {
    e.preventDefault(); const d = e.target.d.value; if (!d) return;
    const reviews = S.get('reviews', {}); reviews[today] = { decision: d, note: e.target.note.value }; S.set('reviews', reviews);
    let msg = '已保存。';
    if (d === 'minus' && confirm('把热量缺口提高 5%？（可在“我的”页改回）')) { const prof = S.get('profile', {}); prof.deficitPct = Math.min(30, (prof.deficitPct ?? 20) + 5); S.set('profile', prof); msg += '缺口已调整为 ' + prof.deficitPct + '%。'; }
    if (d === 'break' && confirm('下周把热量设为 TDEE（缺口 0%）？记得一周后改回。')) { const prof = S.get('profile', {}); S.set('breakFrom', prof.deficitPct ?? 20); prof.deficitPct = 0; S.set('profile', prof); msg += '已设为维持热量。'; }
    $('#dmsg').textContent = msg;
  };
}
try { render(); } catch (e) { console.error(e); $('#view').innerHTML = `<section class="card"><h2>出错了</h2><p class="mut">${e.message}</p></section>`; }
