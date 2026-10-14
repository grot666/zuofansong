#!/usr/bin/env node
// A57: release helper (replaces the out-of-repo rel.sh). Usage, on a clean tree with the feature already committed:
//   npm run release -- <version> "<中文更新说明>" "<English changelog line>" <BACKLOG id|-> "<commit message>"
// Fail-closed: refuses a dirty tree, aborts on pull conflicts or conflict markers, runs npm test before AND after
// editing (reverting all edits if red), then commits, pushes and waits for the CI run of the pushed commit.
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync, spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const commitSubject = (msg, v) => `${msg.replace(/\s*\(v[\d.]+\)\s*$/, '').trim()} (v${v})`;
export function bumpVersionSrc(src, v, cn) {
  if (!/VERSION = '[\d.]+'/.test(src)) throw new Error('version.js: VERSION not found');
  const out = src.replace(/VERSION = '[\d.]+'/, `VERSION = '${v}'`);
  return out.replace(/(export const CHANGELOG = \[\n)/, `$1  ['${v}', '${cn.replace(/'/g, '’')}'],\n`);
}
export const bumpSw = (src, v) => { if (!/zfs-[\d.]+/.test(src)) throw new Error('sw.js: CACHE not found'); return src.replace(/zfs-[\d.]+/, `zfs-${v}`); };
export function insertChangelog(md, v, en) { const i = md.indexOf('## '); return i < 0 ? `${md.trimEnd()}\n\n## v${v}\n- ${en}\n` : `${md.slice(0, i)}## v${v}\n- ${en}\n\n${md.slice(i)}`; }
// Newest-first log directly under the "# PROGRESS" header.
export function insertProgress(md, line) {
  const m = md.match(/^# PROGRESS\n\n?/); if (!m) return `# PROGRESS\n\n${line}\n${md}`;
  return `${m[0].endsWith('\n\n') ? m[0] : m[0] + '\n'}${line}\n${md.slice(m[0].length)}`;
}
export const progressLine = (date, time, v, en) => `- ${date} ${time} SGT — v${v}: ${en}`;
export function markBacklog(md, id) {
  if (!id || id === '-') return md;
  const esc = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`^- \\*\\*${esc}\\b`, 'm');
  if (!re.test(md)) throw new Error(`BACKLOG: no open item "- **${id} …"`);
  return md.replace(re, `- ✅ **${id}`);
}
export const hasConflictMarkers = text => /^(<<<<<<<|>>>>>>>) /m.test(text) || /^=======$/m.test(text) && /^<<<<<<< /m.test(text);

const sh = (cmd, opts = {}) => execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts }).trim();
const die = msg => { console.error(`release: ${msg}`); process.exit(1); };
const test = () => spawnSync('npm', ['test', '--silent'], { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
const FILES = ['js/core/version.js', 'sw.js', 'CHANGELOG.md', 'PROGRESS.md', 'BACKLOG.md'];

async function main([v, cn, en, id, msg]) {
  if (!v || !cn || !en || !id || !msg || !/^\d+\.\d+\.\d+$/.test(v)) die('usage: npm run release -- <x.y.z> "<cn>" "<en>" <ID|-> "<msg>"');
  if (sh('git status --porcelain')) die('dirty tree: commit the feature first');
  if (spawnSync('git', ['pull', '-q', '--rebase'], { stdio: 'inherit' }).status !== 0) { spawnSync('git', ['rebase', '--abort']); die('pull --rebase failed (conflict?); aborted, nothing changed'); }
  const marked = sh('git grep -lE "^(<<<<<<<|>>>>>>>) " || true'); if (marked) die(`conflict markers in: ${marked}`);
  const cur = readFileSync('js/core/version.js', 'utf8').match(/VERSION = '([\d.]+)'/)[1];
  if (cur === v) die(`VERSION is already ${v}`);
  let t = test(); if (t.status !== 0) die(`tests red before release; nothing changed\n${(t.stdout.match(/^not ok .*$/gm) || []).join('\n')}`);
  const now = new Date(), date = now.toLocaleDateString('sv-SE', { timeZone: 'Asia/Singapore' }), time = now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Singapore', hour: '2-digit', minute: '2-digit' });
  const ed = (f, fn) => writeFileSync(f, fn(readFileSync(f, 'utf8')));
  try {
    ed('js/core/version.js', s => bumpVersionSrc(s, v, cn)); ed('sw.js', s => bumpSw(s, v)); ed('CHANGELOG.md', s => insertChangelog(s, v, en));
    ed('PROGRESS.md', s => insertProgress(s, progressLine(date, time, v, en))); ed('BACKLOG.md', s => markBacklog(s, id));
  } catch (e) { spawnSync('git', ['checkout', '--', ...FILES]); die(e.message); }
  t = test(); if (t.status !== 0) { spawnSync('git', ['checkout', '--', ...FILES]); die(`tests red after bump; edits reverted\n${(t.stdout.match(/^not ok .*$/gm) || []).join('\n')}`); }
  sh(`git add ${FILES.join(' ')}`); sh(`git commit -q -m ${JSON.stringify(commitSubject(msg, v))}`);
  // Teammates push docs concurrently: on a rejected push, rebase once (fail-closed on conflicts/markers) and retry.
  if (spawnSync('git', ['push', '-q'], { stdio: 'inherit' }).status !== 0) {
    if (spawnSync('git', ['pull', '-q', '--rebase'], { stdio: 'inherit' }).status !== 0) { spawnSync('git', ['rebase', '--abort']); die('push rejected and rebase failed; release commit is local only'); }
    if (sh('git grep -lE "^(<<<<<<<|>>>>>>>) " || true')) die('conflict markers after rebase; not pushed');
    if (spawnSync('git', ['push', '-q'], { stdio: 'inherit' }).status !== 0) die('push failed twice; release commit is local only');
  }
  const sha = sh('git rev-parse HEAD'); console.log(sh('git log --oneline -1'));
  if (process.env.RELEASE_NO_CI === '1') return;
  for (let i = 0; i < 40; i++) { // wait up to ~4 min for the CI run of this commit
    await new Promise(r => setTimeout(r, 6000));
    let runs = []; try { runs = JSON.parse(sh(`gh run list --workflow ci --commit ${sha} --json status,conclusion,databaseId`)); } catch { continue; }
    const r = runs[0]; if (r && r.status === 'completed') { console.log(`CI ${r.conclusion} (run ${r.databaseId})`); if (r.conclusion !== 'success') process.exit(2); return; }
  }
  die('CI did not finish within 4 min; check `gh run list`');
}
if (import.meta.url === pathToFileURL(process.argv[1] || '').href) main(process.argv.slice(2));
