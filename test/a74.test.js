import test from 'node:test';
import assert from 'node:assert/strict';
import { makeIndex, matchFoods, totals, priceOverrides, twinOf } from '../js/core/foods.js';
import { FOODS } from '../data/foods.js'; import { FOODS2 } from '../data/foods2.js'; import { FOODS3 } from '../data/foods3.js';
import * as S from '../js/core/store.js';
const idx = (prices = {}) => makeIndex({ base: [FOODS, FOODS2, FOODS3], partials: [priceOverrides(prices)] });
test('A74 search shows one 鸡蛋 / 西兰花 entry', () => {
  const all = idx().all();
  for (const q of ['鸡蛋', '西兰花']) {
    const hits = matchFoods(q, all, 20).filter(f => f.name === q || f.name === `${q}(USDA)`);
    assert.equal(hits.length, 1, q);
  }
  assert.ok(!all.some(f => f.id === 'eggUSDA' || f.id === 'broccoliUSDA'));
});
test('A74 alias totals equal canonical, incl. a price override on either id', () => {
  for (const p of [{}, { egg: 20 }, { eggUSDA: 20 }]) {
    const f = idx(p);
    assert.deepEqual(totals([['eggUSDA', 100]], f), totals([['egg', 100]], f), JSON.stringify(p));
  }
  assert.deepEqual(twinOf('broccoliUSDA', idx()), ['broccoli', 1]);
});
test('A74 migration v3 moves prices.eggUSDA', () => {
  S.useBackend(S.memoryBackend); S.resetAll(); S.set('version', 2);
  S.set('prices', { eggUSDA: 18, broccoli: 9, broccoliUSDA: 7 });
  S.migrate();
  assert.deepEqual(S.get('prices', {}), { egg: 18, broccoli: 9 });
});
