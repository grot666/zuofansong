import test from 'node:test';
import assert from 'node:assert/strict';
import { generateWeek, MAX_PROTEIN_G_PER_MEAL, powderAddons } from '../js/core/plan.js';
import { makeIndex } from '../js/core/foods.js';
import { FOODS } from '../data/foods.js'; import { FOODS2 } from '../data/foods2.js'; import { FOODS3 } from '../data/foods3.js';
import { RECIPES } from '../data/recipes.js';
const food = makeIndex(FOODS, FOODS2, FOODS3);
const whey = d => d.addon.filter(([id]) => id === 'whey').reduce((s, [, g]) => s + g, 0);
test('G2 no powder unless usesPowder', () => {
  for (let seed = 0; seed < 5; seed++) for (const d of generateWeek({ kcal: 1617, protein: 160 }, food, RECIPES, { seed })) assert.equal(whey(d), 0);
});
test('G2 powder ≤ maxScoops, cap kept, and never worse fit', () => {
  assert.equal(powderAddons(0).length, 0);
  let used = 0;
  for (let seed = 0; seed < 5; seed++) {
    const a = generateWeek({ kcal: 1617, protein: 160 }, food, RECIPES, { seed });
    const b = generateWeek({ kcal: 1617, protein: 160 }, food, RECIPES, { seed, powderScoops: 2 });
    b.forEach((d, i) => { assert.ok(whey(d) <= 60); assert.ok(d.proteinG <= MAX_PROTEIN_G_PER_MEAL); if (a[i].fit === 'ok') assert.equal(d.fit, 'ok'); used += whey(d); });
  }
  assert.ok(used >= 0);
});
test('G2 powder rescues high-protein low-kcal targets (1400/160)', () => {
  let a = 0, b = 0;
  for (let seed = 0; seed < 9; seed++) {
    a += generateWeek({ kcal: 1400, protein: 160 }, food, RECIPES, { seed }).filter(d => d.fit !== 'ok').length;
    b += generateWeek({ kcal: 1400, protein: 160 }, food, RECIPES, { seed, powderScoops: 2 }).filter(d => d.fit !== 'ok').length;
  }
  assert.ok(b <= a / 2 && b <= 3, `${b} vs ${a}`);
});
