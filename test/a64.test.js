import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fiberDayLine } from '../js/core/plan/fiber.js';
import { PEAS_SIDE_G } from '../js/core/fiber.js';
const food = id => ({ name: { rice: '米饭', brown: '糙米饭' }[id] || id });
test('A64 fiberDayLine interpolates the peas amount', () => {
  const s = fiberDayLine({ tot: { fiber: 24.6 }, fiberSide: true, vegMult: 1.5 }, food);
  assert.equal(s, `膳食纤维 25 g · 午晚餐各加青豆 ${PEAS_SIDE_G} g · 蔬菜按 1.5 份`);
  assert.ok(!s.includes('${'));
});
// Tiny scanner: tracks '…', "…", `…` and ${…} nesting; flags ${ inside a quoted (non-template) string.
export function quotedInterp(src) {
  const st = ['code']; const depth = [0]; let line = 1; const hits = [];
  for (let i = 0; i < src.length; i++) {
    const c = src[i], top = st[st.length - 1];
    if (c === '\n') line++;
    if (top === "'" || top === '"') {
      if (c === '\\') { i++; continue; }
      if (c === '$' && src[i + 1] === '{') hits.push(line);
      if (c === top || c === '\n') st.pop();
    } else if (top === '`') {
      if (c === '\\') { i++; continue; }
      if (c === '`') st.pop(); else if (c === '$' && src[i + 1] === '{') { st.push('code'); depth.push(0); i++; }
    } else if (top === 'lc') { if (c === '\n') st.pop(); }
    else if (top === 'bc') { if (c === '*' && src[i + 1] === '/') { st.pop(); i++; } }
    else {
      if (c === '/' && src[i + 1] === '/') st.push('lc');
      else if (c === '/' && src[i + 1] === '*') st.push('bc');
      else if (c === "'" || c === '"' || c === '`') st.push(c);
      else if (c === '{') depth[depth.length - 1]++;
      else if (c === '}') { if (depth[depth.length - 1] === 0 && st.length > 1) { st.pop(); depth.pop(); } else depth[depth.length - 1]--; }
    }
  }
  return hits;
}
test('A64 lint: no ${ inside single- or double-quoted strings in js/', () => {
  assert.deepEqual(quotedInterp("const a = 'x ${y}';"), [1]);
  assert.deepEqual(quotedInterp("const a = `${b ? 'q' : `${c}`}`;"), []);
  const walk = d => readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(`${d}/${e.name}`) : /\.js$/.test(e.name) ? [`${d}/${e.name}`] : []);
  const root = new URL('../js', import.meta.url).pathname;
  for (const f of walk(root)) assert.deepEqual(quotedInterp(readFileSync(f, 'utf8')), [], f);
});
