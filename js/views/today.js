// View: today (A6). Browser-only.
import { computeTargets } from '../core/targets.js';
import { fatWallet } from '../core/fat.js';
import { proteinFill, proteinGap, gutRisk } from '../core/protein.js';
import { suggestFiber } from '../core/fiber.js';
import * as S from '../core/store.js';
import { paceCheck, onboardStep, saveOnboardStep, PACE_TEXT } from '../core/profile.js';
import { MULTS, scaleItems } from '../core/portion.js';
import { sleepNotes } from '../core/sleep.js';
import { quickChips, matchFoods, gramsFor } from '../core/foods.js';
import { addDays, backupDue } from '../core/dates.js';
import { reviewDue } from '../core/review.js';
import { rerender, $, esc, r1, today, dayOffset, PLAN_DAY, PRESET_TEMPLATES, profile, allFoods, food, getLog, setLog, tplMult, templates, totals, bar, approx } from '../ui.js';

function sleepHtml(l, p) {
  const hm = t => { const d = new Date(t); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
  const entries = l.items.filter(i => i.t && food(i.id)).map(i => ({ id: i.id, time: hm(i.t), kcal: food(i.id).kcal * i.g / 100 }));
  const n = sleepNotes(entries, p);
  if (!p.sleepNudges) return '';
  return `<p class="mut">睡前提醒：${n.dinnerBy} 前吃完晚饭，${n.caffeineBy} 后不喝咖啡/茶（按 ${p.bedtime} 睡觉）。</p>${n.lateMeal ? `<p class="warn">${n.lateMeal.time} 吃了约 ${Math.round(n.lateMeal.kcal)} kcal，离睡觉较近，可能影响睡眠。偶尔一次没关系。</p>` : ''}${n.lateCaffeine ? `<p class="warn">${n.lateCaffeine.time} 摄入咖啡因，可能影响今晚入睡。</p>` : ''}`;
}
// R-13: neutral slip recovery — show the 7-day average of logged days.
function slipNote(t) {
  const days = [0, 1, 2, 3, 4, 5, 6].map(i => getLog(dayOffset(-i))).filter(lg => lg.items.length);
  const avg = days.reduce((a, lg) => a + totals(lg.items).kcal, 0) / days.length;
  return `<p class="mut">没关系，继续。近 7 天有记录的 ${days.length} 天平均 <b>${Math.round(avg)} kcal</b>（目标 ${t.kcal}）${avg <= t.kcal * 1.05 ? '，整体仍在计划内' : ''}。明天照常吃，不用节食补救。</p>`;
}
export const view = () => {
  const p = profile(); const t = computeTargets(p); const l = getLog(); const x = totals(l.items);
  const fw = fatWallet(t.fat, l.items.map(i => { const f = food(i.id); return f ? { fat: f.fat * i.g / 100, fatClass: f.fatClass || 'neutral' } : { fat: 0 }; }));
  const wholeProtein = x.protein - x.powderProtein;
  const pg = proteinGap(t.protein, wholeProtein, p.scoopG, p.maxScoops);
  const gr = gutRisk({ fiber: x.fiber, water: l.water, weight: p.weight, powderShare: x.protein ? x.powderProtein / x.protein : 0, vegServings: x.veg, trainingDays: p.trainingDays });
  const chips = quickChips(S.get('recents', []), S.get('foodUse', {}), id => !!food(id));
  const lowItems = l.items.filter(i => food(i.id)?.fatClass === 'low');
  const hasTakeaway = l.items.some(i => food(i.id)?.cat === '外食');
  const swaps = l.items.length ? suggestFiber({ fiber: x.fiber, fiberTarget: 28, kcal: x.kcal, kcalTarget: t.kcal, riceG: l.items.filter(i => i.id === 'riceCooked').reduce((g, i) => g + i.g, 0), gutHigh: gr.level === 'high' }) : [];
  const undo = S.get('undo', null);
  const demo = S.get('profile', null) == null;
  const ob = onboardStep({ storedProfile: S.get('profile', null), onboardSeen: S.get('onboardSeen', false), savedStep: S.get('onboardStep', null) });
  const skip = '<button type="button" class="sec" id="obSkip">跳过，先看看</button>';
  const onboard = !ob ? '' : `<section class="card" id="onboard" aria-label="新手引导"><h2>开始使用 · 第 ${ob}/3 步</h2>${ob === 1 ? `<p class="mut">目前显示的是示例数据。填 4 项（1 分钟）即可算出你的每日目标。</p><form id="obf">
  <div class="row"><label>性别<select name="sex"><option value="male">男</option><option value="female">女</option></select></label><label>出生日期<input type="date" name="birth" required></label></div>
  <div class="row"><label>身高 cm<input type="number" step="0.1" name="height" required></label><label>体重 kg<input type="number" step="0.1" name="weight" required></label></div>
  <p id="obmsg" class="warn" role="status"></p><div class="row"><button>下一步</button>${skip}</div></form>` : ob === 2 ? `<form id="obf"><div class="row"><label>目标体重 kg<input type="number" step="0.1" name="goalWeight"></label><label>目标日期<input type="date" name="goalDate"></label></div>
  <p id="obpace" class="mut" role="status"></p><div class="row"><button>下一步</button>${skip}</div></form>` : `<p>记第一餐：点一个常见搭配，之后可在下方修改。</p><div class="row">${PRESET_TEMPLATES.map(tp => `<button class="sec" data-obtpl="${tp.id}">${esc(tp.name)}</button>`).join('')}</div><div class="row">${skip.replace('跳过，先看看', '完成')}</div>`}</section>`;
  const bk = backupDue({ lastExport: S.get('lastExport', null), snoozeUntil: S.get('backupSnooze', null), logDays: S.keys().filter(k => k.startsWith('log.')).length, today: today() }) ? `<section class="card" id="bkHint"><p>已记录多天，建议导出一次备份（数据只存在这台手机的浏览器里）。</p><div class="row"><a class="btn" href="#me">去“我的”导出</a><button class="sec" id="bkSnooze">7 天后再提醒</button></div></section>` : '';
  const rv = reviewDue(today(), S.get('reviews', {})) ? `<section class="card" id="rvHint"><p>新的一周：花 1 分钟看看上周，定一个小目标。</p><a class="btn" href="review.html">做本周回顾</a></section>` : '';
  return `${onboard}${bk}${rv}<section class="card"><h2>今日 ${today()}${demo ? ' <span class="chip">示例目标</span>' : ''}</h2>
  热量 ${Math.round(x.kcal)} / ${t.kcal} kcal（还剩 ${Math.round(t.kcal - x.kcal)}）${bar(x.kcal, t.kcal)}
  蛋白 ${r1(x.protein)} / ${t.protein} g${bar(x.protein, t.protein)}
  碳水 ${r1(x.carbs)} / ${t.carbs} g${bar(x.carbs, t.carbs)}
  纤维 ${r1(x.fiber)} / 28 g${bar(x.fiber, 28)}
  ${swaps.length ? `<p><b>纤维还差 ${Math.round(28 - x.fiber)} g，最划算的补法：</b></p><ul>${swaps.map(s => `<li>${s.text}${s.fiberGain ? `（纤维 +${s.fiberGain} g，热量 ${s.kcalDelta >= 0 ? '+' : ''}${s.kcalDelta} kcal）` : ''}${s.add ? ` <button class="sec" data-swap="${s.id}">+ 记入</button>` : ''}</li>`).join('')}</ul><p class="mut">数据来自 USDA FDC。</p>` : ''}
  ${l.items.length && x.kcal > t.kcal * 1.1 ? slipNote(t) : ''}
  ${sleepHtml(l, p)}
  <p class="mut">估算食材成本 ≈ ¥${r1(x.cost)}</p></section>
  <section class="card"><h2>常用餐</h2><p class="mut">点一下就记入。在“搭配”页可存自己的模板。</p><div class="row" role="group" aria-label="份量">份量 ${MULTS.map(m => `<button class="${m === tplMult() ? '' : 'sec'}" data-mult="${m}" aria-pressed="${m === tplMult()}">×${m}</button>`).join('')}</div><div>${templates().map(tp => { const k = totals(scaleItems(tp.items, tplMult()).map(([id, g]) => ({ id, g }))).kcal; return `<button class="sec" data-tpl="${tp.id}" style="margin:4px 4px 0 0">${esc(tp.name)} · ${Math.round(k)}</button>`; }).join('')}</div>
  ${undo && undo.date === today() ? `<p class="mut">已记入“${esc(undo.name)}” <button class="sec" id="undo">撤销</button></p>` : ''}</section>
  <section class="card"><h2>快速记录</h2><form id="af"><input list="fdl" name="f" placeholder="食材或外卖名称（如 生煎、黄焖鸡）" aria-label="食材"><datalist id="fdl">${allFoods().map(f => `<option value="${esc(f.name)}">`).join('')}</datalist>
  <div class="row"><input type="number" name="n" value="1" step="any" aria-label="数量"><select name="u" aria-label="单位"><option value="unit">个/碗/份（按食材单位）</option><option value="g">克</option><option value="bowl">碗（熟饭 150 g）</option></select><button>添加</button></div><p id="afmsg" class="mut" role="status" aria-live="polite"></p></form>
  <div role="group" aria-label="常用食材">${chips.map(id => `<button class="sec mini" data-r="${id}" style="margin:4px 4px 0 0">+ ${esc(food(id).name)}</button>`).join('')} <a href="#foods">全部食材 ›</a></div>
  <ul class="list">${l.items.map((i, n) => { const f = food(i.id); return f ? `<li>${esc(f.name)} ${Math.round(i.g)} g · ${approx(f)}${Math.round(f.kcal * i.g / 100)} kcal <button class="sec" data-del="${n}" aria-label="删除">✕</button></li>` : ''; }).join('') || '<li class="mut">还没有记录。可以点上面的常用餐，或一键记入你的计划日。</li>'}</ul>
  <div class="row" style="margin-top:8px"><button id="planDay" class="sec">记入我的计划日</button><button id="copyY" class="sec">复制昨天</button></div>
  <p class="mut">计划日 = 3 蛋 + 400 g 米饭 + 360 g 去皮鸡腿 + 1 罐水浸金枪鱼 + 300 g 西兰花 + 200 g 胡萝卜 + 15 g 油 ≈ 1780 kcal / 149 g 蛋白 / 62 g 脂肪 / 纤维仅 ≈15 g。</p>
  ${hasTakeaway ? '<p class="mut">点外卖：备注“少油少酱”，汤和红油不喝，麻酱/底油单独放，选蒸/煮/白灼优于炸/红烧。外卖热量是估算（≈）。</p>' : ''}</section>
  <section class="card"><h2>脂肪预算</h2>已用 ${fw.spent} / ${fw.budget} g（剩 ${fw.left} g）${bar(fw.spent, fw.budget)}<p>今日烹调油 <b>${Math.round(x.oil)} g</b> / 25–30 g（膳食指南）${x.oil > 30 ? ' <span class="warn">偏多</span>' : ''}</p>
  <p class="mut">值得花：${fw.high} g（炒菜油、鸡蛋、鱼、坚果） · 一般：${fw.neutral} g · <span class="${fw.low ? 'bad' : ''}">低价值：${fw.low} g</span></p>
  ${lowItems.length ? `<p class="warn">低价值脂肪来自：${[...new Set(lowItems.map(i => food(i.id).name))].join('、')}。换成瘦肉/去皮鸡腿/清蒸鱼，可省出油给蔬菜调味。</p>` : '<p class="mut">炒菜油 1 茶匙 ≈ 4.5 g。把脂肪花在让蔬菜好吃的油上，比花在五花肉、鸡皮、外卖油上更划算。</p>'}</section>
  <section class="card"><h2>蛋白补充</h2><p>天然食物蛋白 ${Math.round(wholeProtein)} g，目标 ${t.protein} g，缺口 <b>${pg.gap} g</b>${pg.gap ? ` → 可用蛋白粉 <b>${pg.scoops} 勺</b>（每勺 ${p.scoopG} g，上限 ${p.maxScoops} 勺）${pg.left ? `，仍差 ${pg.left} g：${proteinFill(pg.left).text}` : ''}` : ' ✓'}</p><p class="mut">优先天然食物，蛋白粉只补缺口。</p></section>
  <section class="card"><h2>饮水与如厕舒适度</h2><p>饮水 ${l.water} / ${t.water} ml</p>${bar(l.water, t.water)}<div class="row"><button id="w250">+1 杯 250 ml</button><button id="w500" class="sec">+500 ml</button><button id="wm" class="sec">−250</button></div>
  <p>如厕舒适度风险：<b class="${gr.level === 'high' ? 'bad' : gr.level === 'mid' ? 'warn' : ''}">${{ high: '高', mid: '中', low: '低' }[gr.level]}</b>（${gr.score}/10）</p>${gr.fixes.length ? `<ul>${gr.fixes.map(f => `<li>${f}</li>`).join('')}</ul>` : ''}<p class="mut">若长期便秘或不适，请就医。</p></section>`;
};
view.bind = () => {
  const bs = $('#bkSnooze'); if (bs) bs.onclick = () => { S.set('backupSnooze', addDays(today(), 7)); rerender(); };
  const obs = $('#obSkip'); if (obs) obs.onclick = () => { S.set('onboardSeen', true); S.remove('onboardStep'); rerender(); };
  const obf = $('#obf');
  if (obf) {
    const step = onboardStep({ storedProfile: S.get('profile', null), onboardSeen: false, savedStep: S.get('onboardStep', null) });
    const pace = () => { const p = profile(); const el = $('#obpace'); if (!el) return; const r = paceCheck({ currentKg: p.weight, goalKg: +obf.goalWeight.value, today: today(), goalDate: obf.goalDate.value }); el.textContent = PACE_TEXT[r.status] ? '减重速度：' + PACE_TEXT[r.status] + (r.kgPerWeek ? `（约 ${r1(r.kgPerWeek)} kg/周）` : '') : ''; };
    if (step === 2) { const p = profile(); obf.goalWeight.value = p.goalWeight; obf.goalDate.value = p.goalDate; obf.oninput = pace; pace(); }
    obf.onsubmit = e => { e.preventDefault(); const r = saveOnboardStep(S.get('profile', null), step, Object.fromEntries(new FormData(obf)));
      if (!r.ok) { const m = $('#obmsg'); if (m) m.textContent = r.errors.join('；'); return; }
      S.set('profile', r.profile); S.set('onboardStep', step + 1); rerender(); };
  }
  document.querySelectorAll('[data-obtpl]').forEach(b => b.onclick = () => { const tp = PRESET_TEMPLATES.find(x => x.id === b.dataset.obtpl); const l = getLog(); l.items.push(...tp.items.map(([id, g]) => ({ id, g, t: Date.now() }))); setLog(l); S.set('onboardSeen', true); S.remove('onboardStep'); rerender(); });
  const pushItems = (items, name) => { const l = getLog(); const n0 = l.items.length; l.items.push(...items.map(([id, g]) => ({ id, g, t: Date.now() }))); setLog(l); S.set('undo', { date: today(), from: n0, name }); rerender(); };
  const addItem = (id, g) => { const u = S.get('foodUse', {}); u[id] = (u[id] || 0) + 1; S.set('foodUse', u); S.set('recents', [id, ...S.get('recents', []).filter(x => x !== id)].slice(0, 12)); pushItems([[id, g]], food(id).name); };
  const afMsg = t => { $('#afmsg').innerHTML = t; };
  const logFood = (f, d) => {
    const n = +d.n.value || 1; const g = gramsFor(f, n, d.u.value);
    if (g == null) { afMsg(`“${esc(f.name)}”没有单位，按克记录：请把单位选“克”。`); d.u.value = 'g'; return; }
    afMsg(''); addItem(f.id, g);
  };
  $('#af').onsubmit = e => {
    e.preventDefault(); const d = e.target; const q = d.f.value.trim(); if (!q) return;
    const exact = allFoods().find(x => x.name === q); if (exact) return logFood(exact, d);
    const m = matchFoods(q, allFoods());
    if (m.length === 1) return logFood(m[0], d);
    if (!m.length) { afMsg(`没找到“${esc(q)}”。<a href="#foods">添加为自定义食材</a>`); return; }
    afMsg('选一个：' + m.map(f => `<button type="button" class="sec" data-pick="${f.id}" style="margin:4px 4px 0 0">${esc(f.name)}</button>`).join(''));
    document.querySelectorAll('[data-pick]').forEach(b => b.onclick = () => logFood(food(b.dataset.pick), d));
  };
  $('#af').f.onchange = e => { const f = allFoods().find(x => x.name === e.target.value); if (f && !f.unit && $('#af').u.value === 'unit') { $('#af').u.value = 'g'; afMsg('该食材无单位，按克记录'); } };
  document.querySelectorAll('[data-r]').forEach(b => b.onclick = () => { const f = food(b.dataset.r); addItem(f.id, f.unit?.g || 100); });
  document.querySelectorAll('[data-tpl]').forEach(b => b.onclick = () => { const tp = templates().find(x => x.id === b.dataset.tpl); const use = S.get('templateUse', {}); use[tp.id] = (use[tp.id] || 0) + 1; S.set('templateUse', use); pushItems(scaleItems(tp.items, tplMult()), tplMult() === 1 ? tp.name : `${tp.name} ×${tplMult()}`); });
  document.querySelectorAll('[data-mult]').forEach(b => b.onclick = () => { S.set('tplMult', +b.dataset.mult); rerender(); });
  document.querySelectorAll('[data-swap]').forEach(b => b.onclick = () => { const s = suggestFiber({ fiber: 0, kcal: 0, kcalTarget: 1e9 }, 99).find(x => x.id === b.dataset.swap); if (s) pushItems(s.add, s.text); });
  const u = $('#undo'); if (u) u.onclick = () => { const un = S.get('undo'); const l = getLog(); l.items = l.items.slice(0, un.from); setLog(l); S.set('undo', null); rerender(); };
  document.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { const l = getLog(); l.items.splice(+b.dataset.del, 1); setLog(l); S.set('undo', null); rerender(); });
  const water = d => { const l = getLog(); l.water = Math.max(0, l.water + d); setLog(l); rerender(); };
  $('#w250').onclick = () => water(250); $('#w500').onclick = () => water(500); $('#wm').onclick = () => water(-250);
  $('#planDay').onclick = () => pushItems(PLAN_DAY, '我的计划日');
  $('#copyY').onclick = () => { const yl = getLog(dayOffset(-1)); if (!yl.items.length) { afMsg('昨天没有记录，无法复制。'); return; } pushItems(yl.items.map(i => [i.id, i.g]), '昨天的饮食'); };
};

