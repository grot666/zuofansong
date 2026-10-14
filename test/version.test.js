import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { VERSION, CHANGELOG } from '../js/core/version.js';

test('sw CACHE matches VERSION', () => {
  const m = readFileSync('sw.js', 'utf8').match(/const CACHE = '([^']+)'/);
  assert.equal(m[1], 'zfs-' + VERSION);
});
test('changelog head is VERSION', () => assert.equal(CHANGELOG[0][0], VERSION));
test('no literal v0.x.y outside version.js/sw.js', () => {
  const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
  const files = [...walk('js'), 'index.html', 'plan.html', 'review.html'].filter(f => !f.endsWith('version.js'));
  for (const f of files) assert.doesNotMatch(readFileSync(f, 'utf8'), /v0\.\d+\.\d+/, f);
});
test('every page entry boots store and registers SW', () => {
  for (const f of ['js/app.js', 'js/plan-page.js', 'js/review-page.js']) {
    const s = readFileSync(f, 'utf8');
    assert.ok(s.indexOf('bootStore()') >= 0 && s.lastIndexOf('registerSW()') > s.indexOf('bootStore()'), f);
  }
});
test('SW index fallback only for navigations; all ASSETS exist', () => {
  const s = readFileSync('sw.js', 'utf8');
  const nav = s.indexOf("req.mode === 'navigate'"), fb = s.indexOf("caches.match('index.html')"), ret = s.indexOf('return;', nav);
  assert.ok(nav > 0 && fb > nav && fb < ret);
  assert.equal(s.split("caches.match('index.html')").length, 2);
  const assets = JSON.parse(s.match(/const ASSETS = (\[[^\]]+\])/)[1].replace(/'/g, '"'));
  for (const a of assets) if (a !== './') assert.ok(statSync(a).isFile(), a);
});
