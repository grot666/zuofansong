import test from 'node:test';
import assert from 'node:assert/strict';
import { generateWeek, ADDONS } from '../js/core/plan.js';
import { makeIndex } from '../js/core/foods.js';
import { FOODS } from '../data/foods.js'; import { FOODS2 } from '../data/foods2.js'; import { FOODS3 } from '../data/foods3.js';
import { RECIPES } from '../data/recipes.js';
import { CHANGELOG } from '../js/core/version.js';
const food = makeIndex(FOODS, FOODS2, FOODS3);
test('R9-7 every add-on item named in the 0.9.4 changelog is actually used at owner targets', () => {
  const c = {};
  for (const [k, p] of [[1617, 160], [1800, 130], [1800, 140], [1800, 160]]) for (let seed = 0; seed < 4; seed++)
    for (const d of generateWeek({ kcal: k, protein: p }, food, RECIPES, { seed })) for (const [id] of d.addon) c[id] = (c[id] || 0) + 1;
  const names = { 蛋清: 'eggWhite', 豆腐: 'tofuFirm', 酸奶: 'yogurt', 鸡蛋: 'eggBoiled', 虾: 'shrimpCooked', 金枪鱼: 'tunaLight' };
  const copy = CHANGELOG.find(([v]) => v === '0.9.4')[1];
  for (const [zh, id] of Object.entries(names)) if (copy.includes(zh)) assert.ok(c[id] >= 1, zh);
  for (const id of ['milk', 'qianzhang', 'doufugan']) assert.ok(!ADDONS.flat().some(([x]) => x === id));
});
