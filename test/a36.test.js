import test from 'node:test';
import assert from 'node:assert/strict';
import { rankProteins, proteinScore, PROTEINS, rankVeg, selectWeek, generateWeek, planWeek, portionDay } from '../js/core/plan.js';
import { mealScores } from '../js/core/scores.js';
import { makeIndex } from '../js/core/foods.js';
import { FOODS } from '../data/foods.js'; import { FOODS2 } from '../data/foods2.js'; import { FOODS3 } from '../data/foods3.js';
import { RECIPES } from '../data/recipes.js';
const food = makeIndex(FOODS, FOODS2, FOODS3);
const MSG = 'scores changed: update golden + DECISIONS';
const s4 = m => { const { health, easy, cheap, tasty } = mealScores(m, food); return { health, easy, cheap, tasty }; };
test('A36 golden: protein ranking, top-14 veg, add-on foods', () => {
  assert.deepEqual(rankProteins(PROTEINS, food).map(id => [id, proteinScore(id, food)]),
    [['thighRoasted', 19], ['tofuFirm', 19], ['porkLoin', 19], ['breastRoasted', 18], ['seabass', 18], ['basa', 18], ['shrimpCooked', 17], ['leanBeef', 17]], MSG);
  assert.deepEqual(rankVeg(RECIPES, food).slice(0, 14).map(r => r.id), ['r16', 'r5', 'r15', 'r14', 'r18', 'r19', 'r23', 'r26', 'r27', 'r31', 'r32', 'r2', 'r3', 'r6'], MSG);
  const g = { shrimpCooked: [3, 4, 5, 4], eggWhite: [3, 4, 5, 3], yogurt: [3, 4, 5, 3], tofuFirm: [3, 5, 5, 3], eggBoiled: [3, 5, 5, 3], tunaLight: [3, 5, 5, 3] };
  const grams = { shrimpCooked: 100, eggWhite: 99, yogurt: 300, tofuFirm: 150, eggBoiled: 100, tunaLight: 100 };
  for (const [id, [health, easy, cheap, tasty]] of Object.entries(g)) assert.deepEqual(s4([[id, grams[id]]]), { health, easy, cheap, tasty }, `${id}: ${MSG}`);
});
test('A38 base rotation is seed-only: independent of tasty flags', () => {
  const flipped = makeIndex(FOODS.map(f => ({ ...f, tasty: false })), FOODS2.map(f => ({ ...f, tasty: false })), FOODS3.map(f => ({ ...f, tasty: false })));
  for (let seed = 0; seed < 4; seed++) assert.deepEqual(selectWeek(flipped, RECIPES, { seed }).map(d => d.pDinner), selectWeek(food, RECIPES, { seed }).map(d => d.pDinner));
});
test('A39 determinism and order sensitivity', () => {
  const t = { kcal: 1800, protein: 140 };
  const a = generateWeek(t, food, RECIPES, { seed: 0 });
  generateWeek({ kcal: 1400, protein: 160 }, food, RECIPES, { seed: 5 });
  assert.deepEqual(generateWeek(t, food, RECIPES, { seed: 0 }), a); // (a) no shared module state
  assert.deepEqual(portionDay(selectWeek(food, RECIPES, { seed: 0 })[0], t, food), a[0]); // (b) standalone == in-week day 0
  for (const budget of [150, 170]) { // (c) caps hold after swaps
    const { week } = planWeek(t, food, RECIPES, { seed: 0, budget }); const c = {};
    for (const d of week) for (const id of new Set(d.addon.map(x => x[0]))) c[id] = (c[id] || 0) + 1;
    assert.ok(Math.max(0, ...Object.values(c)) <= 4);
    assert.ok(week.flatMap(d => d.meals.flatMap(m => m.items)).filter(([id]) => id === 'tunaLight').reduce((s, [, g]) => s + g, 0) <= 339);
  }
  assert.deepEqual(a.map(d => d.addon.map(([id, g]) => id + g).join('+')), SNAP, 'ADDON_REPEAT_W snapshot changed: update + DECISIONS'); // (d)
});
const SNAP = ['shrimpCooked100+tofuFirm150', 'yogurt150+eggBoiled100', 'eggWhite99', 'tunaLight100', 'eggWhite99', '', 'tofuFirm150'];
