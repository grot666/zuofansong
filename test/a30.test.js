import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
test('A30 only core/foods.js imports food data or builds an index', () => {
  const files = [...readdirSync('js/views').map(f => 'js/views/' + f), 'js/app.js', 'js/plan-page.js', 'js/review-page.js', 'js/ui.js'];
  for (const f of files) {
    const s = readFileSync(f, 'utf8');
    assert.doesNotMatch(s, /data\/(foods\d?|prices)\.js/, f); assert.doesNotMatch(s, /makeIndex\(/, f);
  }
  assert.doesNotMatch(readFileSync('js/core/review.js', 'utf8'), /new Date\((todayStr|w\.date|s)\)/);
});
