// Old v1 question ids (g-<subject>-<topic>-<level>-<seed>) are stored in children's history and revision,
// so they must still rebuild exactly the same question. This compares today's generators with the
// generators from an older commit, read with `git show`, so no copy of the old files is kept in the repo.
// usage: node tests/gen/compat.js [commit] [--n 300]        (default commit: 38f76c4, the last one before the v2 generators)
'use strict';
const fs = require('fs'), os = require('os'), path = require('path'), { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..', '..'), R = path.join(ROOT, 'data') + path.sep;
const COMMIT = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '38f76c4';
const ni = process.argv.indexOf('--n'), N = ni > 0 ? +process.argv[ni + 1] : 300;
const SUBJ = ['maths', 'english', 'vr', 'nvr'];
let O;
try {
  O = fs.mkdtempSync(path.join(os.tmpdir(), 'oldgen-')) + path.sep;
  for (const f of ['gen-core.js'].concat(SUBJ.map(s => s + '-gen.js'))) {
    let src = ''; try { src = execFileSync('git', ['show', `${COMMIT}:data/${f}`], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { continue; }
    fs.writeFileSync(O + f, src);
  }
} catch (e) { console.log('compat: skipped, the old generators could not be read from git (' + e.message + ')'); process.exit(0); }
if (!fs.existsSync(O + 'gen-core.js')) { console.log(`compat: skipped, commit ${COMMIT} is not in this clone (a shallow clone? use fetch-depth: 0)`); process.exit(0); }
global.document = { createElement: () => ({}) };
function load(dir, files) {
  global.window = {};
  for (const s of SUBJ) { for (const f of [R + s + '.js', R + s + '-questions.js']) { delete require.cache[require.resolve(f)]; require(f); } }
  for (const f of files) { if (!fs.existsSync(dir + f)) continue; delete require.cache[require.resolve(dir + f)]; require(dir + f); }
  return window.GENS;
}
const old = load(O, ['gen-core.js'].concat(SUBJ.map(s => s + '-gen.js')));
const neu = load(R, ['gen-core.js', 'words.js'].concat(fs.readdirSync(R).filter(f => /^[a-z]+-gen\d*\.js$/.test(f)).sort()));
// The equal-value fix in choices() (no 2/6 beside 1/3) changed some old questions on purpose:
// an old question that offered two options of the same value is allowed to rebuild differently.
const val = o => { const t = String(o).trim(); let m = /^(\d+)\/(\d+)$/.exec(t); if (m && +m[2]) return +m[1] / +m[2]; m = /^-?\d+(\.\d+)?$/.exec(t); return m ? +t : null; };
const faulty = q => { const av = val(q.opts[q.a]); return (av !== null && q.opts.some((o, i) => i !== q.a && val(o) !== null && Math.abs(val(o) - av) < 1e-9)) || q.opts.some(o => /-£|£-|−£/.test(o)); };
let diff = 0;
for (const sid of SUBJ) {
  const a0 = old[sid], b0 = neu[sid]; if (!a0) { console.log(`${sid}: no generator at ${COMMIT}`); continue; }
  let n = 0, d0 = 0, fixed = 0;
  for (const t of a0.topics) for (let d = 1; d <= 3; d++) for (let s = 1; s <= N; s++) {
    const id = `g-${sid}-${t}-${d}-${s}`, a = a0.fromId(id), b = b0.fromId(id); n++;
    if (!a && !b) continue;
    if (!a || !b || a.q !== b.q || a.opts.join() !== b.opts.join() || a.a !== b.a) { if (a && faulty(a)) { fixed++; continue; } d0++; if (d0 < 4) console.log('  differs:', id, a && a.opts, b && b.opts); }
  }
  console.log(`${sid}: ${n} old ids checked, differences: ${d0}${fixed ? ` (and ${fixed} faulty old questions that were fixed on purpose)` : ''}`);
  diff += d0;
}
fs.rmSync(O, { recursive: true, force: true });
process.exit(diff ? 1 : 0);
