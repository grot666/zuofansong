import { computeTargets } from './core/targets.js';
import { planWeek, shoppingList, checkWeek } from './core/plan.js';
import { VERSION } from './core/version.js';
import { bootStore, registerSW, getProfile } from './boot.js';
import * as S from './core/store.js';
import { FOODS } from '../data/foods.js';
import { FOODS2 } from '../data/foods2.js';
import { FOODS3 } from '../data/foods3.js';
import { RECIPES } from '../data/recipes.js';

bootStore();
const all = [...FOODS, ...FOODS2, ...FOODS3, ...S.get('customFoods', [])];
const food = id => all.find(f => f.id === id);
const r1 = n => Math.round(n * 10) / 10;
const $ = s => document.querySelector(s);
const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const localDate = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };

function render() {
  const p = getProfile();
  const t = computeTargets(p);
  const seed = S.get('planSeed', 0);
  const budget = S.get('weeklyBudget', 300);
  const plan = planWeek(t, food, RECIPES, { seed, budget }); const week = plan.week;
  const checks = checkWeek(week, t);
  const list = shoppingList(week, food);
  const cost = list.reduce((s, x) => s + x.cost, 0);
  const proteinsUsed = [...new Set(week.map(d => d.dinnerProtein))].map(id => food(id).name);
  $('#view').innerHTML = `<section class="card"><h2>本周菜单 <small class="mut">v${VERSION}</small></h2>
  <p class="mut">每天目标 ${t.kcal} kcal（±5%）、蛋白 ≥ ${t.protein} g。晚餐多做一份 = 第二天午餐（晚上一次做两顿）。主食按熟重。</p>
  <div class="row"><button id="regen">换一套</button><label>每周预算 ¥<input type="number" id="budget" value="${budget}"></label></div></section>
  ${week.map((d, i) => `<section class="card"><h3>${DAYS[i]} · ${Math.round(d.tot.kcal)} kcal · 蛋白 ${Math.round(d.tot.protein)} g · 脂肪 ${Math.round(d.tot.fat)} g · 纤维 ${Math.round(d.tot.fiber)} g ${checks[i].kcalOk && checks[i].proteinOk ? '✓' : '<span class="warn">⚠</span>'}</h3>
    <ul class="list">${d.meals.map(m => `<li><b>${m.name}</b> ${m.title}<br><span class="mut">${m.items.filter(([id]) => id !== 'oil').map(([id, g]) => `${food(id)?.name || id} ${Math.round(g)} g`).join('、')}${m.items.find(([id]) => id === 'oil') ? `、油 ${r1(m.items.find(([id]) => id === 'oil')[1])} g` : ''}</span></li>`).join('')}</ul>
    <button class="sec" data-day="${i}">把这天记入今日</button></section>`).join('')}
  <section class="card"><h2>购物清单（生重）</h2><p>估算合计 <b>≈¥${Math.round(cost)}</b> ${plan.swaps ? `<span class="mut">已为预算换了 ${plan.swaps} 次更便宜的蛋白（晚餐和第二天午餐一起换）。</span> ` : ''}${cost > budget ? `<span class="warn">仍超出预算 ¥${Math.round(cost - budget)}：可调高预算，或多用鸡蛋、豆腐</span>` : '在预算内 ✓'}</p>
  <ul class="list">${list.map(x => `<li><label style="margin:0"><input type="checkbox" style="width:auto;min-height:auto"> ${x.name} ${x.g >= 1000 ? r1(x.g / 500) + ' 斤' : x.g + ' g'} <span class="mut">≈¥${r1(x.cost)}</span></label></li>`).join('')}</ul><p class="mut">价格为上海超市/菜市场估价。鸡蛋按克，约 50 g/个。</p></section>
  <section class="card"><h2>周日备餐（约 60 分钟）</h2><ol>
  <li>电饭煲煮 2–3 天的杂粮饭；煮好 1 小时内分盒冷藏，第 3 天及以后的分份直接冷冻。</li>
  <li>本周蛋白：${proteinsUsed.join('、')}。鸡腿/鸡胸一次腼好（生抽+料酒+姜），分成前 3 天的量。</li>
  <li>绿叶菜洗净沥干装保鲜袋；西兰花/胡萝卜切好块。</li>
  <li>煮一锅水煮蛋（6–8 个），冷藏 4–5 天内吃完。</li>
  <li>工作日晚上：热饭 + 空气炸锅/烤箱烤蛋白和蔬菜，多做一份装明天午餐。</li></ol>
  <p class="mut">米饭安全：冷藏 24 小时内吃完、只加热一次并热透；冷冻的分份当天取出微波。</p></section>`;
  $('#regen').onclick = () => { S.set('planSeed', seed + 1); render(); };
  $('#budget').onchange = e => { S.set('weeklyBudget', +e.target.value || 300); render(); };
  document.querySelectorAll('[data-day]').forEach(b => b.onclick = () => {
    const d = week[+b.dataset.day]; const key = 'log.' + localDate(); const l = S.get(key, { items: [], water: 0 });
    l.items.push(...d.meals.flatMap(m => m.items).map(([id, g]) => ({ id, g, t: Date.now() }))); S.set(key, l); b.textContent = '✓ 已记入今日';
  });
}
try { render(); } catch (e) { console.error(e); $('#view').innerHTML = `<section class="card"><h2>出错了</h2><p class="mut">${e.message}</p></section>`; }
registerSW();
