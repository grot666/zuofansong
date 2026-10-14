import test from 'node:test';
import assert from 'node:assert/strict';
import { backupDue } from '../js/core/dates.js';
const t = '2026-10-15';
test('G3 backupDue', () => {
  assert.equal(backupDue({ logDays: 6, today: t }), false);
  assert.equal(backupDue({ logDays: 7, today: t }), true);
  assert.equal(backupDue({ logDays: 30, lastExport: '2026-10-02', today: t }), false);
  assert.equal(backupDue({ logDays: 30, lastExport: '2026-10-01', today: t }), true);
  assert.equal(backupDue({ logDays: 30, snoozeUntil: '2026-10-16', today: t }), false);
  assert.equal(backupDue({ logDays: 30, snoozeUntil: '2026-10-15', today: t }), true);
});
