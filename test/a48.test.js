import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
test('A48 npm test runs serially, same as CI', () => {
  const cmd = 'node --test --test-concurrency=1 test/';
  assert.equal(JSON.parse(readFileSync('package.json', 'utf8')).scripts.test, cmd);
  assert.ok(readFileSync('.github/workflows/ci.yml', 'utf8').includes(cmd));
});
