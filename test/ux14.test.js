import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { RECIPES } from '../data/recipes.js';
import { TRAY_STEPS } from '../data/sauces.js';
const FORCE = /拍|剁|砸|颠锅/;
test('UX-14 every recipe/tray step has boolean wristSafe; unsafe ones carry a note', () => {
  for (const r of RECIPES) {
    assert.doesNotMatch(r.name, FORCE, r.name);
    for (const s of r.steps) {
      assert.equal(typeof s.wristSafe, 'boolean', r.id);
      if (FORCE.test(s.text)) assert.equal(s.wristSafe, false, `${r.id}: ${s.text}`);
      if (!s.wristSafe) assert.ok(s.wristNote, r.id);
    }
  }
  for (const s of TRAY_STEPS) assert.equal(typeof s.wristSafe, 'boolean');
});
test('UX-14 prep copy has no forceful cutting', () => {
  const s = readFileSync('js/plan-page.js', 'utf8').match(/周日备餐[^]*?<\/ol>/)[0];
  assert.doesNotMatch(s.replace(/不颠锅|不用力剁切/g, ''), FORCE); assert.doesNotMatch(s, /切好块/);
});
test('R9-9 firm-veg cutting / peeling steps carry a wrist note', () => {
  for (const r of RECIPES) for (const s of r.steps) if (/茭白切|削皮/.test(s.text)) assert.ok(!s.wristSafe && s.wristNote, `${r.id}: ${s.text}`);
});
