import test from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../js/core/store.js';
S.useBackend(S.memoryBackend);
test('migrate v1 -> v2 converts breakFrom and backs up', () => {
  S.resetAll(); S.set('version', 1); S.set('breakFrom', 20);
  assert.equal(S.migrate(), S.SCHEMA_VERSION);
  assert.equal(S.get('breakFrom', null), null); assert.equal(S.get('breakState').from, 20);
  assert.ok(S.get('backup.preMigration').data);
  assert.equal(S.migrate(), S.SCHEMA_VERSION);
});
test('export envelope + whitelist import + newer schema rejected', () => {
  S.resetAll(); S.migrate(); S.set('profile', { weight: 73 });
  const env = S.exportAll(); assert.equal(env.app, 'zuofansong'); assert.equal(env.schema, S.SCHEMA_VERSION);
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
test('A13 legacy import without version runs migration 2', () => {
  S.resetAll(); S.migrate();
  S.importAll({ profile: { deficitPct: 0 }, breakFrom: 20 }, { today: '2026-10-15' });
  assert.deepEqual(S.get('breakState'), { from: 20, until: '2026-10-15' });
  assert.equal(S.get('breakFrom', null), null); assert.equal(S.get('version'), S.SCHEMA_VERSION);
});
test('A13 migrate aborts without bump if backup write fails', () => {
  S.resetAll(); S.set('version', 1); S.set('breakFrom', 20);
  const real = S.memoryBackend.setItem;
  S.useBackend({ getItem: k => S.memoryBackend.getItem(k), removeItem: k => S.memoryBackend.removeItem(k), key: i => S.memoryBackend.key(i), get length() { return S.memoryBackend.length; }, setItem(k, v) { if (k.endsWith('backup.preMigration')) throw new Error('quota'); real(k, v); } });
  assert.equal(S.migrate(), 1); assert.equal(S.get('breakFrom'), 20);
  S.useBackend(S.memoryBackend);
  assert.equal(S.migrate({ today: '2026-01-02' }), S.SCHEMA_VERSION); assert.equal(S.get('breakState').until, '2026-01-02');
  assert.equal(S.keys().filter(k => k.startsWith('backup.')).length, 1);
});
test('A17 legacy version 99 rejected; import replaces; undo restores', () => {
  S.resetAll(); S.migrate();
  assert.throws(() => S.importAll({ version: 99, profile: {} }));
  S.set('log.2026-10-01', { items: [{ id: 'egg', g: 50 }], water: 0 });
  const env = { app: 'zuofansong', schema: 2, exportedAt: 'x', data: { profile: { weight: 70 }, weights: 'bad' } };
  const n = S.importAll(env);
  assert.equal(n, 1); assert.equal(S.get('log.2026-10-01', null), null); assert.equal(S.get('weights', null), null);
  assert.ok(S.undoImport()); assert.equal(S.get('log.2026-10-01').items.length, 1); assert.equal(S.get('backup.preImport', null), null);
});
test('A17 export -> import round trip', () => {
  S.resetAll(); S.migrate(); S.set('profile', { weight: 72 }); S.set('reviews', { a: 1 }); S.set('templates', [{ id: 't', items: [] }]);
  const a = S.exportAll(); S.importAll(a); const b = S.exportAll();
  assert.deepEqual(b.data, a.data);
});
test('A18 isPersistent false for memory/throwing backends; export works after abort', () => {
  S.useBackend(S.memoryBackend); assert.equal(S.isPersistent(), false);
  S.useBackend({ getItem: () => null, setItem() { throw new Error('x'); }, removeItem() {}, key: () => null, length: 0 });
  assert.equal(S.isPersistent(), false);
  S.useBackend(S.memoryBackend);
  S.resetAll(); S.set('version', 1); S.set('breakFrom', 20);
  const real = S.memoryBackend.setItem;
  S.useBackend({ getItem: k => S.memoryBackend.getItem(k), removeItem: k => S.memoryBackend.removeItem(k), key: i => S.memoryBackend.key(i), get length() { return S.memoryBackend.length; }, setItem(k, v) { if (k.includes('backup.')) throw new Error('quota'); real(k, v); } });
  assert.equal(S.migrate(), 1); assert.equal(S.exportAll().data.breakFrom, 20);
  S.useBackend(S.memoryBackend);
});
