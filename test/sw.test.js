import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
const s = readFileSync('sw.js', 'utf8');
const ASSETS = JSON.parse(s.match(/const ASSETS = (\[[^\]]+\])/)[1].replace(/'/g, '"'));
const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
test('A15 ASSETS covers every shipped file, no dups, all exist', () => {
  const need = [...readdirSync('.').filter(f => f.endsWith('.html')), ...walk('js'), ...walk('data'), ...walk('css'), 'manifest.webmanifest', 'icon.svg'];
  for (const f of need) assert.ok(ASSETS.includes(f), 'missing ' + f);
  assert.equal(new Set(ASSETS).size, ASSETS.length);
  for (const a of ASSETS) if (a !== './') assert.ok(statSync(a).isFile(), a);
});
test('SW revalidation kept alive with waitUntil', () => assert.match(s, /e\.waitUntil\(net/));
