import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
// A60: an assertion pasted after a trailing `//` comment silently stops running.
test('A60 no assert hidden inside a trailing comment in test/*', () => {
  const dir = new URL('./', import.meta.url);
  for (const f of readdirSync(dir).filter(f => /\.m?js$/.test(f))) readFileSync(new URL(f, dir), 'utf8').split('\n').forEach((l, i) => assert.ok(!/;\s*\/\/.*\bassert\./.test(l), `${f}:${i + 1}`));
});
