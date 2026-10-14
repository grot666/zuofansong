import test from 'node:test';
import assert from 'node:assert/strict';
import { rankProteins, proteinScore, PROTEINS, rankVeg, selectWeek, generateWeek, portionDay, planWeek, shoppingList } from '../js/core/plan.js';
import { mealScores } from '../js/core/scores.js';
import { makeIndex } from '../js/core/foods.js';
import { FOODS } from '../data/foods.js'; import { FOODS2 } from '../data/foods2.js'; import { FOODS3 } from '../data/foods3.js';
import { RECIPES } from '../data/recipes.js';
const food = makeIndex(FOODS, FOODS2, FOODS3);
const MSG = 'scores changed: update golden + DECISIONS';
test('A36 golden: protein ranking, top-14 veg, add-on food scores', () => {
  assert.deepEqual(rankProteins(PROTEINS, food).map(id => [id, proteinScore(id, food)]),
    [['thighRoasted', 19], ['tofuFirm', 19], ['porkLoin', 19], ['breastRoasted', 18], ['seabass', 18], ['basa', 18], ['sole', 18], ['shrimpCooked', 17], ['leanBeef', 17]], MSG);
  assert.deepEqual(rankVeg(RECIPES, food).slice(0, 14).map(r => r.id), ['r16', 'r5', 'r15', 'r7', 'r14', 'r18', 'r19', 'r23', 'r26', 'r27', 'r31', 'r32', 'r2', 'r3'], MSG);
  const four = m => { const { health, easy, cheap, tasty } = mealScores(m, food); return [health, easy, cheap, tasty]; };
  const exp = { shrimpCooked: [[100], [3, 4, 5, 4]], eggWhite: [[99], [3, 4, 5, 3]], yogurt: [[300], [3, 4, 5, 3]], tofuFirm: [[150], [3, 5, 5, 3]], eggBoiled: [[100], [3, 5, 5, 3]], tunaLight: [[100], [3, 5, 5, 3]] };
  for (const [id, [[g], s]] of Object.entries(exp)) assert.deepEqual(four([[id, g]]), s, `${MSG} (${id})`);
});
test('A38 selectWeek proteins independent of tasty flags', () => {
  const flat = makeIndex([...FOODS, ...FOODS2, ...FOODS3].map(f => ({ ...f, tasty: false })));
  for (let seed = 0; seed < 3; seed++) assert.deepEqual(selectWeek(flat, RECIPES, { seed }).map(d => d.pDinner), selectWeek(food, RECIPES, { seed }).map(d => d.pDinner));
});
test('A39 determinism and order sensitivity', () => {
  const t = { kcal: 1800, protein: 140 };
  const a = generateWeek(t, food, RECIPES, { seed: 0 });
  generateWeek({ kcal: 1400, protein: 160 }, food, RECIPES, { seed: 5 }); // unrelated call: no shared module state
  assert.deepEqual(generateWeek(t, food, RECIPES, { seed: 0 }), a);
  assert.deepEqual(portionDay(selectWeek(food, RECIPES, { seed: 0 })[0], t, food), a[0]); // (b) day 0 standalone == in-week
  const free = shoppingList(a, food).reduce((s, x) => s + x.cost, 0);
  const r = planWeek(t, food, RECIPES, { seed: 0, budget: 0.8 * free }); const c = {}; let tuna = 0;
  for (const d of r.week) { for (const id of new Set(d.addon.map(x => x[0]))) c[id] = (c[id] || 0) + 1; tuna += d.meals.flatMap(m => m.items).filter(([id]) => id === 'tunaLight').reduce((s, [, g]) => s + g, 0); }
  assert.ok(Math.max(0, ...Object.values(c)) <= 4); assert.ok(tuna <= 339); // (c)
  // (d) ADDON_REPEAT_W pinned via the 1800/140 seed 0 add-on sequence
  assert.deepEqual(a.map(d => d.addon.map(([id, g]) => id + g).join('+')), ['shrimpCooked100+tofuFirm150', 'eggWhite99', 'eggBoiled100', '', 'tunaLight100', '', 'shrimpCooked100+tofuFirm150']); // re-pinned v0.10.36 (VER-20 FDC data)
});
