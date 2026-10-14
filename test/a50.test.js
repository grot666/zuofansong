import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { TUNA } from '../js/core/tuna.js';
import { TUNA as T2 } from '../js/core/review.js';
test('A50 TUNA lives in core/tuna.js; plan/** never imports review.js', () => {
  assert.equal(TUNA, T2); assert.equal(TUNA.tunaLight.max, 339);
  for (const f of readdirSync('js/core/plan')) assert.doesNotMatch(readFileSync('js/core/plan/' + f, 'utf8'), /from ['"][^'"]*review\.js['"]/, f);
});
