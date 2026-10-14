import test from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../js/core/store.js';
import { backupDue } from '../js/core/dates.js';
S.useBackend(S.memoryBackend);
const T = '2026-10-15';
const logs = n => Object.fromEntries(Array.from({ length: n }, (_, i) => [`log.2026-09-${String(i + 10).padStart(2, '0')}`, { items: [] }]));
test('A41 importing an old backup resets the backup nag', () => {
  S.set('lastExport', '2026-10-14');
  S.importAll({ app: 'zuofansong', schema: 2, data: { version: 2, lastExport: '2026-09-25', ...logs(10) } }); S.afterImport(T);
  assert.equal(S.get('lastExport'), T);
  assert.equal(backupDue({ lastExport: S.get('lastExport'), snoozeUntil: null, logDays: 10, today: T }), false);
  S.undoImport(); assert.equal(S.get('lastExport'), '2026-10-14');
});
test('A41 backup without lastExport → today; future value kept', () => {
  S.importAll({ app: 'zuofansong', schema: 2, data: { version: 2 } }); S.afterImport(T); assert.equal(S.get('lastExport'), T);
  S.importAll({ app: 'zuofansong', schema: 2, data: { version: 2, lastExport: '2026-10-20' } }); S.afterImport(T); assert.equal(S.get('lastExport'), '2026-10-20');
});
