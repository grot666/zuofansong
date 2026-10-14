import test from 'node:test';
import assert from 'node:assert/strict';
import { makeIndex } from '../js/core/foods.js';
import { FOODS } from '../data/foods.js'; import { FOODS2 } from '../data/foods2.js'; import { FOODS3 } from '../data/foods3.js';
const food = makeIndex(FOODS, FOODS2, FOODS3);
// 10 most-used unverified generator foods (grams over 3 targets × 10 seeds, v0.10.13): each is now FDC-verified or carries an FDC comparison note (stays ≈).
const TOP10 = ['yogurt', 'tofuFirm', 'corn', 'basa', 'porkLoin', 'leanBeef', 'sole', 'wwBread', 'tomato', 'lettuce'];
test('verify batch: top-10 generator foods verified with FDC id, or ≈ with an explained FDC comparison', () => {
  for (const id of TOP10) { const f = food(id); assert.ok((f.verified && /FDC \d+|营养所查询平台 #\d+/.test(f.source)) || (!f.verified && f.fdcCompare?.note), id); }
  assert.equal(food('tomato').kcal, 18); assert.equal(food('wwBread').kcal, 252); assert.equal(food('lettuce').protein, 1.36);
});
