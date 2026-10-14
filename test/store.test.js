import test from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../js/core/store.js';
S.useBackend(S.memoryBackend);
test('migrate v1 -> v2 converts breakFrom and backs up', () => {
  S.resetAll(); S.set('version', 1); S.set('breakFrom', 20);
  assert.equal(S.migrate(), 2);
  assert.equal(S.get('breakFrom', null), null); assert.equal(S.get('breakState').from, 20);
  assert.ok(S.get('backup.preMigration').data);
  assert.equal(S.migrate(), 2);
});
test('export envelope + whitelist import + newer schema rejected', () => {
  S.resetAll(); S.migrate(); S.set('profile', { weight: 73 });
  const env = S.exportAll(); assert.equal(env.app, 'zuofansong'); assert.equal(env.schema, 2);
  S.resetAll();
  const n = S.importAll({ ...env, data: { ...env.data, evil: 1, 'log.2026-10-15': { items: [] } } });
  assert.equal(S.get('profile').weight, 73); assert.equal(S.get('evil', null), null); assert.ok(n >= 2);
  assert.throws(() => S.importAll({ app: 'zuofansong', schema: 99, data: {} }));
});
test('set returns false on quota error', () => {
  S.useBackend({ ...S.memoryBackend, setItem() { throw new Error('quota'); }, getItem: () => null, key: () => null, length: 0 });
  assert.equal(S.set('x', 1), false);
  S.useBackend(S.memoryBackend);
});
