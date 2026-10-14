import test from 'node:test';
import assert from 'node:assert/strict';
import { commitSubject, bumpVersionSrc, bumpSw, insertChangelog, insertProgress, progressLine, markBacklog, hasConflictMarkers } from '../scripts/release.mjs';
test('A57 commitSubject never doubles (vX)', () => {
  assert.equal(commitSubject('fix: x (v1.2.3)', '1.2.3'), 'fix: x (v1.2.3)');
  assert.equal(commitSubject('fix: x', '1.2.3'), 'fix: x (v1.2.3)');
  assert.equal(commitSubject('fix: x (v1.2.2) ', '1.2.3'), 'fix: x (v1.2.3)');
});
test('A57 version.js / sw.js bumps by regex, not line number', () => {
  const src = "// header\n// more\nexport const VERSION = '0.1.0';\nexport const CHANGELOG = [\n  ['0.1.0', 'a'],\n];\n";
  const out = bumpVersionSrc(src, '0.1.1', "新 'x'");
  assert.match(out, /VERSION = '0\.1\.1'/); assert.match(out, /CHANGELOG = \[\n  \['0\.1\.1', '新 ’x’'\],\n  \['0\.1\.0'/);
  assert.throws(() => bumpVersionSrc('nothing', '1.0.0', 'x'));
  assert.equal(bumpSw("const CACHE = 'zfs-0.1.0';", '0.1.1'), "const CACHE = 'zfs-0.1.1';");
});
test('A57 CHANGELOG newest first; PROGRESS line directly under the header (newest first)', () => {
  assert.equal(insertChangelog('# CHANGELOG\n\n## v0.1.0\n- a\n', '0.1.1', 'b'), '# CHANGELOG\n\n## v0.1.1\n- b\n\n## v0.1.0\n- a\n');
  const md = '# PROGRESS\n\n- 2026-10-15 05:00 SGT — v0.1.0: a\n\nCurrent state: x\n';
  const out = insertProgress(md, progressLine('2026-10-15', '07:40', '0.1.1', 'b'));
  assert.equal(out, '# PROGRESS\n\n- 2026-10-15 07:40 SGT — v0.1.1: b\n- 2026-10-15 05:00 SGT — v0.1.0: a\n\nCurrent state: x\n');
});
test('A57 BACKLOG mark is exact and fails closed on an unknown id', () => {
  assert.equal(markBacklog('- **A57 Move (P2)**\n- **A570 x**\n', 'A57'), '- ✅ **A57 Move (P2)**\n- **A570 x**\n');
  assert.throws(() => markBacklog('- ✅ **A57 done**\n', 'A57'));
  assert.equal(markBacklog('x', '-'), 'x');
});
test('A57 conflict markers detected', () => {
  assert.ok(hasConflictMarkers('a\n<<<<<<< Updated upstream\nb\n=======\nc\n>>>>>>> Stashed changes\n'));
  assert.ok(!hasConflictMarkers('a\n=======\nb\n'));
});
