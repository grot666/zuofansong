// Shared UI helpers for index views (A6). Browser-only.
import * as S from './core/store.js';
import { normalizeProfile } from './core/profile.js';
import { MULTS } from './core/portion.js';
import { makeIndex, totals as sumTotals } from './core/foods.js';
import { FOODS } from '../data/foods.js';
import { FOODS2 } from '../data/foods2.js';
import { FOODS3 } from '../data/foods3.js';
let renderFn = () => {};
export const setRender = f => { renderFn = f; };
export const rerender = () => renderFn();
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
let foodIdx = null;
const refreshFoods = () => { foodIdx = makeIndex(FOODS, FOODS2, FOODS3, S.get('customFoods', [])); };
const allFoods = () => (foodIdx || refreshFoods(), foodIdx.all());
const food = id => (foodIdx || refreshFoods(), foodIdx(id));
const logKey = d => 'log.' + d;
const getLog = (d = today()) => S.get(logKey(d), { items: [], water: 0 });
const setLog = (l, d = today()) => S.set(logKey(d), l);
const tplMult = () => (MULTS.includes(S.get('tplMult', 1)) ? S.get('tplMult', 1) : 1);
const templates = () => { const user = S.get('templates', []); const use = S.get('templateUse', {}); return [...user, ...PRESET_TEMPLATES].sort((a, b) => (use[b.id] || 0) - (use[a.id] || 0)); };

const totals = items => sumTotals(items, food);
function bar(v, max) { const p = Math.min(100, (v / max) * 100); return `<div class="bar"><i class="${v > max * 1.05 ? 'over' : ''}" style="width:${p}%"></i></div>`; }
const approx = f => (f.verified ? '' : '≈');

export { $, esc, r1, today, dayOffset, PLAN_DAY, PRESET_TEMPLATES, profile, refreshFoods, allFoods, food, logKey, getLog, setLog, tplMult, templates, totals, bar, approx };
