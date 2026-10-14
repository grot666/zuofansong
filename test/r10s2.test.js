import test from 'node:test';
import assert from 'node:assert/strict';
import { planWeek, meatNote, MEAT_NOTE_G, MEAT_OVER_G } from '../js/core/plan.js';
import { makeIndex } from '../js/core/foods.js';
import { PRICE_REFS } from '../data/prices.js';
import { FOODS } from '../data/foods.js'; import { FOODS2 } from '../data/foods2.js'; import { FOODS3 } from '../data/foods3.js';
import { RECIPES } from '../data/recipes.js';
const food = makeIndex({ base: [FOODS, FOODS2, FOODS3], partials: [PRICE_REFS] });
test('R10-S2 p145/p160: ≤2% of meals over 250 g meat, each with a note', () => {
  assert.equal(MEAT_OVER_G, MEAT_NOTE_G); let n = 0, over = 0;
  for (const kcal of [1617, 1800]) for (const protein of [145, 160]) for (let seed = 0; seed < 6; seed++) for (const budget of [undefined, 200])
    for (const d of planWeek({ kcal, protein }, food, RECIPES, { seed, budget }).week) for (const m of d.meals.slice(1, 3)) {
      const [id, g] = m.items[1]; n++;
      if (id !== 'tofuFirm' && g > MEAT_NOTE_G) { over++; assert.match(meatNote(m), /偏多/); }
    }
  assert.ok(over / n <= 0.02, `${over}/${n}`);
});
