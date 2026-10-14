import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { weekFiber } from '../js/core/plan.js';
test('R10-F2 weekFiber averages days; plan header shows it', () => {
  assert.equal(weekFiber(Array.from({ length: 7 }, () => ({ tot: { fiber: 20 } }))), 20);
  assert.equal(weekFiber([{ tot: { fiber: 20 } }, { tot: { fiber: 30 } }]), 25); assert.equal(weekFiber([]), 0);
  assert.match(readFileSync('js/plan-page.js', 'utf8'), /id="fiberLine">膳食纤维 7 天平均 \$\{Math\.round\(weekFiber\(week\)\)\}/);
});
