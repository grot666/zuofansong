import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as P from '../js/core/plan.js';
import { makeIndex } from '../js/core/foods.js';
import { FOODS } from '../data/foods.js'; import { FOODS2 } from '../data/foods2.js'; import { FOODS3 } from '../data/foods3.js';
const ALL = [...FOODS, ...FOODS2, ...FOODS3]; const food = makeIndex(FOODS, FOODS2, FOODS3);
const genIds = [...new Set([...P.PROTEINS, ...P.STAPLES, ...P.BREAKFASTS.flatMap(b => b.items.map(i => i[0])), ...P.ADDONS.flat().map(a => a[0]), 'kiwiUSDA', 'whey'])];
test('R9-4 generator foods: verified with a table+id source, or shown with ≈ on the plan', () => {
  const page = readFileSync('js/plan-page.js', 'utf8');
  assert.match(page, /food\(id\)\?\.verified \? '' : '≈'/); assert.match(page, /food\(x\.id\)\?\.verified \? '' : '≈'/);
  for (const id of genIds) { const f = food(id); assert.ok(f, id); if (f.verified) assert.match(f.source, /USDA FDC \d+|CFCT .+|营养所查询平台 #\d+/, id); }
  for (const f of ALL) if (f.verified) assert.match(String(f.source), /USDA FDC \d+|CFCT .+|营养所查询平台 #\d+|上海|label/, f.id);
  for (const id of ['tofuFirm', 'qianzhang', 'doufugan', 'basa', 'yogurt']) assert.doesNotMatch(String(food(id).source), /USDA/, id);
  assert.equal(food('milk').source, 'USDA FDC 171265'); assert.equal(food('seabass').source, 'USDA FDC 175142');
});
export function fdcGaps(foods) {
  return foods.filter(f => f.fdcCompare && !f.fdcCompare.note && (Math.abs(f.kcal - f.fdcCompare.kcal) / f.fdcCompare.kcal > 0.10 || Math.abs(f.protein - f.fdcCompare.protein) > 1)).map(f => f.id);
}
test('R9-5 FDC discrepancy needs a note', () => {
  assert.deepEqual(fdcGaps(ALL), []);
  assert.deepEqual(fdcGaps([{ id: 'x', kcal: 120, protein: 10, fdcCompare: { id: 1, kcal: 100, protein: 10 } }]), ['x']);
  for (const id of ['porkLoin', 'corn', 'tofuFirm']) assert.ok(food(id).fdcCompare?.note, id);
});
