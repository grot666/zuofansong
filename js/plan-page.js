import { computeTargets } from './core/targets.js';
import { parseBudget, distinctVeg, meatNote, planTips, regenWeek, planWeek, shoppingList, checkWeek, weekFiber } from './core/plan.js';
import { VERSION } from './core/version.js';
import { SAUCES, SAUCE_ING, TRAY_STEPS, TRAY_BAKE } from '../data/sauces.js';
import { sauceNutrition, rotateSauces, trayPlan } from './core/sauces.js';
import { toast, bootStore, registerSW, getProfile } from './boot.js';
import * as S from './core/store.js';
import { localDate, todayIndex } from './core/dates.js';
import { foodIndexFromStore } from './core/foods.js';
import { mealScores } from './core/scores.js';
const stars = sc => `<br><span class="mut">健康 ${sc.health} · 好做 ${sc.easy} · 便宜 ${sc.cheap} · 好吃 ${sc.tasty}（满分 5）</span>`;
import { RECIPES } from '../data/recipes.js';

bootStore();
const food = foodIndexFromStore(S);
const r1 = n => Math.round(n * 10) / 10;
const $ = s => document.querySelector(s);
const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

function trayCard(week = []) {
  const off = new Set(S.get('sauceOff', []));
  const rot = rotateSauces(SAUCES.filter(x => !off.has(x.id)), 7);
  const mins = TRAY_STEPS.reduce((a, x) => a + x.min, 0);
  return `<section class="card"><h2>工作日 30 分钟一盘烤晚餐</h2>
  <p class="mut">动手约 ${mins} 分钟 · 3 件设备（电饭煲、烤盘/空气炸锅、微波碗）· 护腕友好。</p>
  <ol>${TRAY_STEPS.map(x => `<li>${x.text}（${x.min} 分钟）${x.wrist ? ' ✅护腕' : ''}${x.tip ? `<br><span class="mut">${x.tip}</span>` : ''}</li>`).join('')}</ol>
  ${(() => { const tp = trayPlan(week.slice(0, 5).map(d => d.dinnerProtein), TRAY_STEPS, TRAY_BAKE, rot.out); return tp.some(Boolean) ? `<h3>本周工作日每晚一盘</h3><ol>${tp.map((x, i) => x ? `<li>${DAYS[i]}：${x.how} · ${x.temp} °C 约 ${x.ovenMin} 分钟${x.sauce ? ' · ' + x.sauce.name : ''} · 共约 ${x.totalMin} 分钟${x.wristSafe ? ' ✅护腕' : ''}</li>` : '').join('')}</ol>` : ''; })()}
  <p><b>熟没熟以中心温度为准：禽肉 74 °C</b>（USDA FSIS）。烤制时间以自家设备为准。</p>
  <h3>本周酱汁轮换</h3><ol>${rot.out.map((x, i) => { const n = sauceNutrition(x); return `<li>${DAYS[i]}：${x.name}（${x.items.map(([id, g]) => SAUCE_ING[id].name + ' ' + g + ' g').join(' + ')}）≈${Math.round(n.kcal)} kcal · 脂肪 ${n.fat} g${x.allergen ? ' · 含' + x.allergen.join('、') : ''}</li>`; }).join('') || '<li class="mut">请至少选一种酱汁</li>'}</ol>
  ${rot.repeatWarning ? '<p class="mut">只选了一类口味，会每天重复。</p>' : ''}
  <div>${SAUCES.map(x => `<label style="display:inline-block;margin-right:8px"><input type="checkbox" data-sauce="${x.id}" ${off.has(x.id) ? '' : 'checked'} style="width:auto;min-height:auto"> ${x.name}</label>`).join('')}</div>
  <p class="mut">酱油、蚝油含盐高，可换低钠酱油。护腕：不颠锅、不用力剁切，重物双手端。若手腕疼痛请遵医生/康复师建议。</p></section>`;
}
function render() {
  const p = getProfile();
  const t = computeTargets(p);
  const seed = S.get('planSeed', 0);
  const budget = S.get('weeklyBudget', 300); const maxPrep = S.get('maxPrepMin', 0);
  const plan = planWeek(t, food, RECIPES, { seed, budget, maxPrepMin: maxPrep, powderScoops: p.usesPowder ? Math.max(0, Math.floor(p.maxScoops || 0)) : 0 }); const week = plan.week;
  const checks = checkWeek(week, t);
  const list = shoppingList(week, food);
  const cost = list.reduce((s, x) => s + x.cost, 0);
  const proteinsUsed = [...new Set(week.map(d => d.dinnerProtein))].map(id => food(id).name);
  const ti = todayIndex(localDate());
  $('#view').innerHTML = `<nav class="seg" aria-label="菜单分区"><a href="#menu">菜单</a><a href="#list">购物清单</a><a href="#prep">备餐</a></nav><section class="card" id="menu"><h2>本周菜单</h2><p class="mut" id="fiberLine">膳食纤维 7 天平均 ${Math.round(weekFiber(week))} g/天（目标 25–30 g）${weekFiber(week) >= 25 ? ' ✓' : ''}</p>
  <p class="mut">每天目标 ${t.kcal} kcal（±5%）、蛋白 ≥ ${t.protein} g。晚餐多做一份 = 第二天午餐（晚上一次做两顿）。主食按熟重。带 ≈ 的食材营养值为估算、未逐条核对。</p>
  ${plan.infeasible?.reason === 'no-protein' ? '<p class="warn">没有可用的蛋白质食材（食材数据缺失），本周菜单暂不含肉蛋豆。请刷新或在“我的”导出备份后反馈。</p>' : plan.infeasible?.reason === 'no-veg' ? '<p class="warn">没有可用的蔬菜做法（食材数据缺失），本周菜单暂不含蔬菜。请刷新或在“我的”导出备份后反馈。</p>' : plan.infeasible ? `<p class="warn">这个热量下蛋白目标偏高（蛋白占 ${plan.infeasible.pct}% 热量），已优先保证蛋白，部分天热量会超出。可在“我的”降低蛋白目标或热量缺口。</p>` : ''}${week.some(d => d.fit !== 'ok') && !plan.infeasible ? '<p class="mut">个别天无法同时满足热量和蛋白，已优先保证蛋白（标 ⚠）。</p>' : ''}
  <p class="mut tip">本周用到 ${distinctVeg(week, food)} 种蔬菜（种类少 = 好买、少浪费）。</p>${planTips(plan).map(x => `<p class="mut tip">${x}</p>`).join('')}<div class="row"><button id="regen">换一套</button><label>每周预算 ¥<input type="number" id="budget" min="1" value="${budget}"></label><label>蔬菜做法时间<select id="prepMax">${[[0, '不限'], [5, '≤5 分钟'], [10, '≤10 分钟']].map(([v, l]) => `<option value="${v}"${v === maxPrep ? ' selected' : ''}>${l}</option>`).join('')}</select></label></div></section>
  ${week.map((d, i) => `<details class="card day"${i === ti ? ' open' : ''}><summary><h3>${DAYS[i]} · ${Math.round(d.tot.kcal)} kcal · 蛋白 ${Math.round(d.tot.protein)} g · 脂肪 ${Math.round(d.tot.fat)} g · 纤维 ${Math.round(d.tot.fiber)} g ${checks[i].kcalOk && checks[i].proteinOk ? '✓' : '<span class="warn">⚠</span>'}</h3></summary>
    <ul class="list">${d.meals.map(m => `<li><b>${m.name}</b> ${m.title}<br><span class="mut">${m.items.filter(([id]) => id !== 'oil').map(([id, g]) => `${food(id)?.verified ? '' : '≈'}${food(id)?.name || id} ${Math.round(g)} g`).join('、')}${m.items.find(([id]) => id === 'oil') ? `、油 ${r1(m.items.find(([id]) => id === 'oil')[1])} g` : ''}</span>${/午餐|晚餐/.test(m.name) ? stars(mealScores(m.items, food)) : ''}${meatNote(m) ? `<br><span class="warn">${meatNote(m)}</span>` : ''}</li>`).join('')}</ul>
    <p class="mut">膳食纤维 ${Math.round(d.tot.fiber)} g${d.stapleSwap ? `（为补纤维，主食由${food(d.stapleSwap)?.name}换成${food(d.staple)?.name}）` : ''}${d.vegMult > 1 ? ` · 蔬菜按 ${d.vegMult} 份` : ''}</p>${d.fiberNote ? `<p class="warn">${d.fiberNote}</p>` : ''}
    <button class="sec" data-day="${i}">把这天记入今日</button></details>`).join('')}
  <section class="card" id="list"><h2>购物清单（生重）</h2><p>估算合计 <b>≈¥${Math.round(cost)}</b> ${cost > budget ? `<span class="warn">仍超出预算 ¥${Math.round(cost - budget)}：可调高预算，或多用鸡蛋、豆腐</span>` : '在预算内 ✓'}</p>
  <ul class="list">${list.filter(x => !x.pantry && !x.small).map(x => `<li><label style="margin:0"><input type="checkbox" style="width:auto;min-height:auto"> ${food(x.id)?.verified ? '' : '≈'}${x.name} ${x.g >= 1000 ? r1(x.g / 500) + ' 斤' : x.g + ' g'} <span class="mut">≈¥${r1(x.cost)}</span></label></li>`).join('')}</ul>${list.some(x => x.small) ? `<p class="mut">少量，可省略/用库存：${list.filter(x => x.small).map(x => `${x.name} ${x.g} g`).join('、')}</p>` : ''}${list.some(x => x.pantry) ? `<p class="mut">常备（干货/调料，按需补）：${list.filter(x => x.pantry).map(x => `${x.name} ${x.g >= 1000 ? r1(x.g / 500) + ' 斤' : x.g + ' g'}`).join('、')}</p>` : ''}<p class="mut">价格为上海超市/菜市场估价。鸡蛋按克，约 50 g/个。</p></section>
  <section class="card" id="prep"><h2>周日备餐（约 60 分钟）</h2><ol>
  <li>电饭煲煮 2–3 天的杂粮饭；煮好 1 小时内分盒冷藏，第 3 天及以后的分份直接冷冻。</li>
  <li>本周蛋白：${proteinsUsed.join('、')}。鸡腿/鸡胸一次腌好（生抽+料酒+姜），分成前 3 天的量。</li>
  <li>绿叶菜洗净沥干装保鲜袋；西兰花用手掰小朵或厨房剪刀剪；胡萝卜买切好的或用刨子刨片。</li>
  <li>煮一锅水煮蛋（6–8 个），冷藏 4–5 天内吃完。</li>
  <li>工作日晚上：热饭 + 空气炸锅/烤箱烤蛋白和蔬菜，多做一份装明天午餐。</li></ol>
  <p class="mut">米饭安全：冷藏 24 小时内吃完、只加热一次并热透；冷冻的分份当天取出微波。</p></section>
  ${trayCard(week)}`;
  document.querySelectorAll('[data-sauce]').forEach(c => c.onchange = () => { const off = new Set(S.get('sauceOff', [])); c.checked ? off.delete(c.dataset.sauce) : off.add(c.dataset.sauce); S.set('sauceOff', [...off]); render(); });
  $('#regen').onclick = () => { const r = regenWeek({ seed }); S.set('planSeed', r.seed); render(); toast('已换一套菜单', { ms: 6000, action: { label: '撤销', run: () => { S.set('planSeed', r.prevSeed); render(); } } }); };
  $('#budget').onchange = e => { const r = parseBudget(e.target.value); if (!r.ok) { e.target.value = budget; toast(r.msg); return; } S.set('weeklyBudget', r.value); render(); };
  $('#prepMax').onchange = e => { S.set('maxPrepMin', +e.target.value || 0); render(); };
  document.querySelectorAll('[data-day]').forEach(b => b.onclick = () => {
    const d = week[+b.dataset.day]; const key = 'log.' + localDate(); const l = S.get(key, { items: [], water: 0 });
    l.items.push(...d.meals.flatMap(m => m.items).map(([id, g]) => ({ id, g, t: Date.now() }))); S.set(key, l); b.textContent = '✓ 已记入今日';
  });
}
try { render(); if (/^#(menu|list|prep)$/.test(location.hash)) document.querySelector(location.hash)?.scrollIntoView(); } catch (e) { console.error(e); $('#view').innerHTML = `<section class="card"><h2>出错了</h2><p class="mut">${e.message}</p></section>`; }
{ const v = document.getElementById('ver'); if (v) v.textContent = 'v' + VERSION; }
registerSW();
