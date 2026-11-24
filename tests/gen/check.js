// Checks every question generator: five different options, the last step names the answer,
// no two options of equal value (such as 1/2 and 2/4), no broken text, and the id rebuilds the same question.
// usage: node tests/gen/check.js [subject ...] [--n 600]      (default: every subject, 600 seeds per topic and level)
'use strict';
const fs = require('fs'), path = require('path');
const R = path.join(__dirname, '..', '..', 'data') + path.sep;
const ni = process.argv.indexOf('--n'), N = ni > 0 ? +process.argv[ni + 1] : 600;
const SUBJ = ['maths', 'english', 'vr', 'nvr'];
const want = process.argv.slice(2).filter((a, i, all) => !a.startsWith('--') && all[i - 1] !== '--n');
global.window = {}; global.document = { createElement: () => ({}) };
for (const s of SUBJ) { require(R + s + '.js'); require(R + s + '-questions.js'); }
require(R + 'gen-core.js'); require(R + 'words.js');
for (const f of fs.readdirSync(R).filter(f => /^[a-z]+-gen\d*\.js$/.test(f)).sort()) require(R + f);
let total = 0;
for (const sid of want.length ? want : SUBJ) {
  const G = window.GENS[sid]; if (!G) { console.log(sid, 'has no generator'); continue; }
  const topics = window.BANK[sid].topics.map(t => t.id).filter(t => G.table[t]);
  let bad = 0, made = 0; const probs = {};
  const note = (t, m, q) => { bad++; const k = t + ': ' + m; probs[k] = probs[k] || { n: 0, ex: q }; probs[k].n++; };
  const val = o => { o = String(o).trim(); let m = /^(\d+)\/(\d+)$/.exec(o); if (m) return +m[1] / +m[2]; m = /^-?\d+(\.\d+)?$/.exec(o); return m ? +o : null; };
  for (const t of topics) {
    let fails = 0;
    for (let d = 1; d <= 3; d++) for (let s = 1; s <= N; s++) {
      const q = G.make(t, d, s * 7 + d); if (!q) { fails++; continue; }
      made++;
      const all = [q.q, q.hint, ...q.steps, ...q.opts, q.svg || ''].join(' | ');
      if (/undefined|NaN|null|\[object|Infinity/.test(all.replace(/aria-label="[^"]*"/g, ''))) note(t, 'bad text', all.slice(0, 300));
      if (q.opts.length !== 5 || new Set(q.opts.map(String)).size !== 5) note(t, 'not five different options', q.opts);
      if (q.opts.some(o => String(o).trim() === '')) note(t, 'empty option', q.opts);
      const last = q.steps[q.steps.length - 1];
      if (!last.includes(String(q.opts[q.a]))) note(t, 'last step does not match the answer', [last, q.opts[q.a]]);
      if (q.opts.some(o => /-0\b|−0\b/.test(o))) note(t, 'negative zero', q.opts);
      const av = val(q.opts[q.a]); if (av !== null && q.opts.some((o, i) => i !== q.a && val(o) !== null && Math.abs(val(o) - av) < 1e-9)) note(t, 'equal-value option', q.opts);
      const again = G.fromId(q.id); if (!again || again.q !== q.q || again.opts.join() !== q.opts.join() || again.a !== q.a) note(t, 'rebuild from id differs', q.id);
    }
    if (fails > N * 0.02) note(t, 'too many failed seeds ' + fails, '');
  }
  console.log(`${sid}: ${topics.length} topics, ${made} questions, problems: ${bad}`);
  for (const [k, v] of Object.entries(probs)) console.log('  -', k, 'x' + v.n, JSON.stringify(v.ex).slice(0, 300));
  total += bad;
}
process.exit(total ? 1 : 0);
