import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { NAV, navHtml } from '../js/nav.js';
import { reviewDue } from '../js/core/review.js';
const pages = [['index.html', 'index', 'today'], ['plan.html', 'plan', 'plan'], ['review.html', 'review', 'review']];
test('UX-4/11 one shared nav, ≤5 items, review 1 tap from every page', () => {
  assert.ok(NAV.length <= 5);
  for (const [f, page, key] of pages) {
    const s = readFileSync(f, 'utf8');
    assert.ok(s.includes(navHtml(page, key)), f + ' nav out of sync with js/nav.js');
    assert.match(s, /<nav class="tabs"[^]*href="review\.html"/);
    assert.match(s, /viewport-fit=cover/);
  }
});
test('UX-5/11 nav height var, safe area, 44px targets', () => {
  const css = readFileSync('css/app.css', 'utf8');
  assert.match(css, /--nav-h:/);
  assert.match(css, /body\{[^}]*padding-bottom:calc\(var\(--nav-h\) \+ env\(safe-area-inset-bottom\)/);
  assert.match(css, /\.tabs a\{[^}]*min-height:44px;min-width:44px/);
});
test('UX-4 reviewDue', () => {
  assert.equal(reviewDue('2026-10-18', {}), true); // Sunday
  assert.equal(reviewDue('2026-10-19', {}), true); // Monday
  assert.equal(reviewDue('2026-10-17', {}), false);
  assert.equal(reviewDue('2026-10-18', { '2026-10-18': { decision: 'keep' } }), false);
  assert.equal(reviewDue('2026-10-19', { '2026-10-18': { decision: 'keep' } }), false);
  assert.equal(reviewDue('2026-10-18', { '2026-10-11': { decision: 'keep' } }), true);
});
