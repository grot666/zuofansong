import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { KNOWN_KEYS } from '../js/core/store.js';
// A14: ARCHITECTURE §3 key table and KNOWN_KEYS must agree (patterns log.* / logArchive.* / backup.* handled separately).
test('A14 KNOWN_KEYS documented', () => {
  const md = readFileSync('docs/ARCHITECTURE.md', 'utf8');
  const doc = new Set(md.split('\n').filter(l => l.startsWith('| `')).flatMap(l => [...l.split('|')[1].matchAll(/`([^`]+)`/g)].map(m => m[1])));
  const missing = KNOWN_KEYS.filter(k => !doc.has(k));
  assert.deepEqual(missing, []);
});
