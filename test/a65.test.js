import test from 'node:test';
import assert from 'node:assert/strict';
import { makeIndex, totals } from '../js/core/foods.js';
import { FOODS } from '../data/foods.js'; import { FOODS2 } from '../data/foods2.js'; import { FOODS3 } from '../data/foods3.js';
import { RECIPES } from '../data/recipes.js';
import { planWeek } from '../js/core/plan.js';
import { preAllocate, socialLevers, leverLines, socialCopy, BANNED_WORDS } from '../js/core/social.js';
const food = makeIndex(FOODS, FOODS2, FOODS3);
const day = items => ({ meals: [{ name: '早餐', items }, { name: '晚餐', items: [['thighRoasted', 150], ['oil', 8]] }] });
test('A65 lever fixtures (R13-1 table)', () => {
  const one = (id, g) => socialLevers(day([[id, g]]), 'dinner', food)[0];
  let l = one('eggUSDA', 100); assert.equal(l.to, 'eggWhite'); assert.equal(l.toG, 116); assert.ok(Math.abs(l.fatG - 9.3) < 0.1); assert.ok(Math.abs(l.kcalDelta + 83) < 1);
  l = one('milk', 250); assert.equal(l.toG, 250); assert.ok(Math.abs(l.fatG - 7.9) < 0.1);
  l = socialLevers(day([['thighRoasted', 150]]), 'lunch', food).find(x => x.meal === '早餐'); assert.equal(l.toG, 120); assert.ok(Math.abs(l.fatG - 7.9) < 0.1);
  l = one('qianzhang', 50); assert.equal(l.to, 'tofuFirm'); assert.equal(l.toG, 100); assert.ok(Math.abs(l.fatG - 3.2) < 0.1);
  assert.ok(!socialLevers(day([['egg', 50]]), 'dinner', food).some(x => x.meal === '晚餐'), 'no lever on the social meal');
});
test('A65 grid: reserve = Σ levers, protein per meal unchanged, copy neutral', () => {
  for (const [kcal, protein] of [[1800, 140], [1400, 110]]) {
    const means = [];
    for (let seed = 0; seed < 6; seed++) for (const d of planWeek({ kcal, protein }, food, RECIPES, { seed }).week) {
      const r = preAllocate({ kcal, protein }, { meal: 'dinner', day: d, food });
      assert.ok(Math.abs(r.reserveFatG - r.levers.reduce((s, l) => s + l.fatG, 0)) <= 0.5);
      for (const m of d.meals) {
        const ls = r.levers.filter(l => l.meal === m.name);
        const after = m.items.map(([id, g]) => { const l = ls.find(x => x.from === id && x.g === g); return l ? [l.to, l.toG] : [id, g]; });
        assert.ok(Math.abs(totals(after, food).protein - totals(m.items, food).protein) <= 1, `${m.name} protein`);
      }
      const txt = [...Object.values(socialCopy('hotpot', 'dinner', r.reserveFatG, r.freedKcal)), ...leverLines(r, food)].join('');
      for (const w of BANNED_WORDS) assert.ok(!txt.includes(w), w);
      means.push(r.reserveFatG);
    }
    console.log(`A65 ${kcal}/${protein} mean reserve ${(means.reduce((a, b) => a + b, 0) / means.length).toFixed(1)} g`);
  }
});
