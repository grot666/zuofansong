import test from 'node:test';
import assert from 'node:assert/strict';
import { generateWeek, meatNote, MEAT_NOTE_G } from '../js/core/plan.js';
import { makeIndex } from '../js/core/foods.js';
import { FOODS } from '../data/foods.js'; import { FOODS2 } from '../data/foods2.js'; import { FOODS3 } from '../data/foods3.js';
import { RECIPES } from '../data/recipes.js';
const food = makeIndex(FOODS, FOODS2, FOODS3);
test('R9-8 p160 seed 0: every >250 g meat meal carries a note', () => {
  for (const d of generateWeek({ kcal: 1617, protein: 160 }, food, RECIPES, { seed: 0 })) for (const m of d.meals.slice(1, 3)) {
    const [id, g] = m.items[1];
    if (id !== 'tofuFirm' && g > MEAT_NOTE_G) assert.match(meatNote(m), /偏多/); else assert.equal(meatNote(m), '');
  }
});
