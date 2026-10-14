import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
// A46: every while/for(;;) in js/core must state its bound in a "// bounded:" comment on the line above (or use an explicit max-iteration constant in the condition).
const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : p.endsWith('.js') ? [p] : []; });
test('A46 bounded loops in js/core', () => {
  const bad = [];
  for (const f of walk('js/core')) {
    const L = readFileSync(f, 'utf8').split('\n');
    L.forEach((l, i) => { if (/\bwhile \(|for \(\s*;\s*;/.test(l) && !/\/\/ bounded:/.test(L[i - 1] || '') && !/_MAX_ITER|maxSteps/.test(l)) bad.push(`${f}:${i + 1}`); });
  }
  assert.deepEqual(bad, []);
});
