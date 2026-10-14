import test from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../js/core/store.js';
import { compactStore } from '../js/core/retention.js';
import { addDays } from '../js/core/dates.js';
import { makeIndex } from '../js/core/foods.js';
const food = makeIndex([{ id: 'egg', kcal: 143, protein: 12.6, fat: 9.5, carbs: 0.7, fiber: 0, priceCNYPer500g: 6 }]);
test('A11 400 synthetic days → 181 kept, rest archived, export has both', () => {
  S.useBackend(S.memoryBackend); S.resetAll(); S.migrate();
  const today = '2026-10-15';
  for (let i = 0; i < 400; i++) S.set('log.' + addDays(today, -i), { items: [{ id: 'egg', g: 100 }], water: 500 });
  assert.equal(compactStore(S, today, food), 219);
  const keys = S.keys();
  assert.equal(keys.filter(k => k.startsWith('log.')).length, 181);
  const arch = keys.filter(k => k.startsWith('logArchive.'));
  const n = arch.reduce((s, k) => s + Object.keys(S.get(k)).length, 0);
  assert.equal(n, 219);
  const day = S.get('logArchive.2025-09')['2025-09-20'];
  assert.deepEqual(day, { kcal: 143, protein: 12.6, fat: 9.5, carbs: 0.7, fiber: 0, cost: 1.2, water: 500, n: 1 });
  const ex = S.exportAll().data; assert.ok(ex['logArchive.2025-09'] && ex['log.2026-10-15']);
  assert.equal(compactStore(S, today, food), 0);
});

test('A26 import → compact (skipped) → undoImport round-trip', () => {
  S.useBackend(S.memoryBackend); S.resetAll(); S.migrate();
  const today = '2026-10-15';
  S.set('log.' + today, { items: [{ id: 'egg', g: 50 }] });
  const before = S.exportAll().data;
  const legacy = { version: 1 };
  for (let i = 0; i < 400; i++) legacy['log.' + addDays(today, -i)] = { items: [{ id: 'egg', g: 100 }] };
  S.importAll(legacy, { today });
  assert.equal(compactStore(S, today, food), 0);
  assert.ok(!S.keys().some(k => k.startsWith('logArchive.')));
  assert.equal(S.undoImport(), true);
  assert.deepEqual(S.exportAll().data, before);
  assert.ok(!S.keys().some(k => k.startsWith('logArchive.')));
});
