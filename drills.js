/* 11+ Explorer: speed drills (times tables, mental maths, alphabet positions, number bonds).
   Loaded before app.js. app.js calls DRILLS.init(host) with the few helpers it needs, adds DRILLS.badges
   to its trophy list and sends the #drills routes to DRILLS.view(). Drill results are kept in st.drills,
   apart from the question history and topic accuracy. */
(function () {
'use strict';

let H = null;            // helpers from app.js (st, save, page, sfx ...)
let R = null;            // the drill that is running
let LAST = null;         // the result of the drill that just finished
let testDur = null;      // tests can shorten a drill; the app never sets this
let fbTimer = null;

const $ = s => document.querySelector(s);
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const AZ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const L = n => AZ[n - 1];
const fmt = n => { const s = String(Math.round(n * 1000) / 1000); return Math.abs(n) >= 1000 && Number.isInteger(n) ? n.toLocaleString('en-GB') : s; };
const frac = (a, b) => `<span class="frac"><span>${a}</span><span>${b}</span></span>`;
// q: question as HTML, say: the same as plain text (for the results list), a: the answer, k: 'num' or 'let'
const plain = q => q.replace(/<[^>]+>/g, '').replace(/\s*=\s*$/, '');
const N = (q, a, say) => ({ q, say: say || plain(q), a: String(a), k: 'num' });
const LET = (q, a, say) => ({ q, say: say || plain(q), a, k: 'let' });
// "7 × 8 = 56", "9 + 1 = 10", "E is letter number 5": the question with its answer filled in
const solved = q => q.say.indexOf('?') >= 0 ? q.say.replace('?', q.a) : q.say + ' = ' + q.a;

// ---------------------------------------------------------------- question makers
function tables(sub) {
  const t = sub === 'mix' ? ri(2, 12) : +sub, b = ri(2, 12);
  if (Math.random() < 0.35) return N(`${fmt(t * b)} ÷ ${t} =`, b, `${t * b} ÷ ${t}`);
  return Math.random() < 0.5 ? N(`${t} × ${b} =`, t * b, `${t} × ${b}`) : N(`${b} × ${t} =`, t * b, `${b} × ${t}`);
}
const MENTAL = {
  add100: () => { if (Math.random() < 0.5) { const a = ri(11, 89), b = ri(5, 100 - a); return N(`${a} + ${b} =`, a + b); } const a = ri(20, 100), b = ri(5, a - 1); return N(`${a} − ${b} =`, a - b); },
  add1000: () => {
    const big = ri(12, 89) * 10 + (Math.random() < 0.5 ? ri(0, 9) : 0), small = Math.random() < 0.5 ? ri(11, 99) : ri(1, 30) * 10;
    if (Math.random() < 0.5 && big + small <= 1000) return N(`${big} + ${small} =`, big + small);
    return N(`${Math.max(big, small)} − ${Math.min(big, small)} =`, Math.abs(big - small));
  },
  dbl: () => {
    const r = Math.random();
    if (r < 0.35) { const n = ri(6, 49); return N(`Double ${n}`, n * 2); }
    if (r < 0.5) { const n = ri(3, 45) * 10; return N(`Double ${n}`, n * 2); }
    if (r < 0.85) { const n = ri(6, 99) * 2; return N(`Half of ${n}`, n / 2); }
    const n = ri(3, 50) * 20; return N(`Half of ${fmt(n)}`, n / 2);
  },
  x10: () => {
    const r = Math.random();
    if (r < 0.25) { const n = ri(2, 99); return N(`${n} × 10 =`, n * 10); }
    if (r < 0.45) { const n = ri(2, 45); return N(`${n} × 100 =`, n * 100); }
    if (r < 0.65) { const n = ri(2, 99) * 10; return N(`${fmt(n)} ÷ 10 =`, n / 10); }
    if (r < 0.8) { const n = ri(2, 60) * 100; return N(`${fmt(n)} ÷ 100 =`, n / 100); }
    if (r < 0.9) { const n = ri(11, 99) / 10; return N(`${n} × 10 =`, Math.round(n * 100) / 10); }
    const n = ri(11, 99); return N(`${n} ÷ 10 =`, n / 10);
  },
  pct: () => {
    const k = pick([[10, 10], [50, 2], [25, 4], [20, 5], [5, 20], [1, 100], [75, 4]]), p = k[0];
    const amt = k[1] * (p === 1 ? ri(1, 9) : p === 5 ? ri(1, 12) : ri(2, k[1] === 2 ? 60 : k[1] === 4 ? 25 : 20));
    const money = Math.random() < 0.5 ? '£' : '';
    return N(`${p}% of ${money}${fmt(amt)}`, amt * p / 100);
  }
};
MENTAL.mix = () => MENTAL[pick(['add100', 'add1000', 'dbl', 'x10', 'pct'])]();
const ALPHA = {
  pos: () => { const n = ri(1, 26); return N(`<b class="dlet">${L(n)}</b> is letter number…`, n, `${L(n)} is letter number ?`); },
  let: () => { const n = ri(1, 26); return LET(`Letter number <b>${n}</b> is…`, L(n), `Letter number ${n} is ?`); },
  shift: () => {
    const n = ri(1, 6);
    if (Math.random() < 0.5) { const s = ri(1, 26 - n); return LET(`${n} letter${n > 1 ? 's' : ''} <b>after</b> <b class="dlet">${L(s)}</b>`, L(s + n)); }
    const s = ri(n + 1, 26); return LET(`${n} letter${n > 1 ? 's' : ''} <b>before</b> <b class="dlet">${L(s)}</b>`, L(s - n));
  },
  mirror: () => { const n = ri(1, 26); return LET(`Opposite (mirror) of <b class="dlet">${L(n)}</b>`, L(27 - n)); }
};
ALPHA.mix = () => ALPHA[pick(['pos', 'let', 'shift', 'mirror'])]();
const FDP = [[1, 2, 0.5], [1, 4, 0.25], [3, 4, 0.75], [1, 5, 0.2], [2, 5, 0.4], [3, 5, 0.6], [4, 5, 0.8], [1, 10, 0.1], [3, 10, 0.3], [7, 10, 0.7], [9, 10, 0.9], [1, 20, 0.05], [1, 100, 0.01], [1, 8, 0.125]];
const BONDS = {
  bond: () => {
    const r = Math.random();
    if (r < 0.2) { const a = ri(1, 9); return N(`${a} + ? = 10`, 10 - a); }
    if (r < 0.6) { const a = ri(3, 97); return N(`${a} + ? = 100`, 100 - a); }
    if (r < 0.85) { const a = ri(1, 19) * 50; return N(`${a} + ? = 1,000`, 1000 - a, `${a} + ? = 1000`); }
    const a = ri(1, 9) / 10; return N(`${a} + ? = 1`, Math.round((1 - a) * 10) / 10);
  },
  fdp: () => {
    const f = pick(FDP), r = Math.random();
    if (r < 0.3) return N(`${frac(f[0], f[1])} = ?%`, Math.round(f[2] * 1000) / 10, `${f[0]}/${f[1]} = ?%`);
    if (r < 0.55) return N(`${frac(f[0], f[1])} as a decimal`, f[2], `${f[0]}/${f[1]} as a decimal`);
    if (r < 0.8) return N(`${f[2]} = ?%`, Math.round(f[2] * 1000) / 10);
    return N(`${Math.round(f[2] * 1000) / 10}% as a decimal`, f[2]);
  }
};
BONDS.mix = () => BONDS[pick(['bond', 'fdp'])]();

const TYPES = {
  tables: { name: 'Times tables', icon: '✖️', c: '#3b5bdb', blurb: 'Multiply and divide facts, fast.', gen: tables,
    subs: [['mix', 'Mixed 2–12']].concat([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => [String(n), n + '×'])) },
  mental: { name: 'Mental maths', icon: '🧠', c: '#ae3ec9', blurb: 'Add, take away, doubles, halves, × ÷ 10 and 100, percentages.', gen: s => MENTAL[s](),
    subs: [['mix', 'Mixed'], ['add100', '+ − to 100'], ['add1000', '+ − to 1,000'], ['dbl', 'Doubles & halves'], ['x10', '× ÷ 10, 100'], ['pct', 'Percentages']] },
  alpha: { name: 'Alphabet positions', icon: '🔤', c: '#e8590c', blurb: 'Letter numbers, letters before and after, mirror letters.', gen: s => ALPHA[s](),
    subs: [['mix', 'Mixed'], ['pos', 'Letter → number'], ['let', 'Number → letter'], ['shift', 'Letters ± n'], ['mirror', 'Mirror letters']] },
  bonds: { name: 'Bonds & equivalents', icon: '🧩', c: '#0c8599', blurb: 'Number bonds to 10, 100, 1,000, and fractions, decimals, percentages.', gen: s => BONDS[s](),
    subs: [['mix', 'Mixed'], ['bond', 'Number bonds'], ['fdp', 'Fractions ↔ decimals ↔ %']] }
};
const DURS = [60, 120];
const subName = (t, s) => (TYPES[t].subs.find(x => x[0] === s) || ['', ''])[1];
const dkey = (t, s, d) => `${t}-${s}-${d}`;

// ---------------------------------------------------------------- saved results
const cfg = () => { const st = H.st; const c = st.drillCfg || (st.drillCfg = { t: 'tables', s: 'mix', d: 60 }); if (!TYPES[c.t]) c.t = 'tables'; if (!TYPES[c.t].subs.some(x => x[0] === c.s)) c.s = 'mix'; if (DURS.indexOf(c.d) < 0) c.d = 60; return c; };
const rec = k => (H.st.drills || {})[k];

const BADGES = [
  { id: 'drill1', icon: '🏃', name: 'Quick off the mark', how: 'Finish your first speed drill' },
  { id: 'drill30', icon: '⏩', name: 'Lightning brain', how: 'Get 30 right in one minute of a speed drill' },
  { id: 'drillpb', icon: '🆙', name: 'Personal best', how: 'Beat your own best score in a speed drill' },
  { id: 'drillall', icon: '🎡', name: 'Drill explorer', how: 'Try all four kinds of speed drill' }
];

// ---------------------------------------------------------------- setup page
function vSetup() {
  const c = cfg(), T = TYPES[c.t], k = dkey(c.t, c.s, c.d), r = rec(k);
  const esc = H.esc;
  const bests = Object.keys(H.st.drills || {}).filter(x => { const p = x.split('-'); return TYPES[p[0]] && H.st.drills[x].runs && H.st.drills[x].runs.length; })
    .sort((a, b) => (H.st.drills[b].at || 0) - (H.st.drills[a].at || 0));
  H.page(`<h1>⚡ Speed drills</h1>
    <div class="hero">${H.buddy('<b>Speed is a secret 11+ skill!</b> Quick facts leave more time for the tricky questions. Answer as many as you can before the timer runs out.')}</div>
    <div class="card">
      <h3>1. Pick a drill</h3>
      <div class="dtypes">${Object.keys(TYPES).map(t => `<button class="dtype ${t === c.t ? 'on' : ''}" data-dr="type" data-t="${t}" style="--c:${TYPES[t].c}" aria-pressed="${t === c.t}"><span class="ico">${TYPES[t].icon}</span><b>${esc(TYPES[t].name)}</b><span class="small muted">${esc(TYPES[t].blurb)}</span></button>`).join('')}</div>
      <h3 style="margin-top:1rem">2. Choose</h3>
      <div class="row dsubs">${T.subs.map(s => `<button class="btn ghost ${s[0] === c.s ? 'on' : ''}" data-dr="sub" data-s="${s[0]}" aria-pressed="${s[0] === c.s}">${esc(s[1])}</button>`).join('')}</div>
      <h3 style="margin-top:1rem">3. How long?</h3>
      <div class="row">${DURS.map(d => `<button class="btn ghost ${d === c.d ? 'on' : ''}" data-dr="dur" data-d="${d}" aria-pressed="${d === c.d}">${d / 60} minute${d > 60 ? 's' : ''}</button>`).join('')}</div>
      <div style="margin-top:1.1rem"><button class="btn big" data-dr="start">⚡ Start: ${esc(T.name)} · ${esc(subName(c.t, c.s))}</button></div>
      <p class="small muted" style="text-align:center">${r ? `Your best for this drill: <b>${r.best} right</b>` : 'No score yet for this drill. Set your first personal best!'} · Type on the keyboard or tap the buttons. Press Enter to send a number.</p>
    </div>
    ${c.t === 'alpha' ? `<div class="card tipcard"><h3>🔤 Alphabet tricks</h3>
      <p><b>EJOTY</b>: E = 5, J = 10, O = 15, T = 20, Y = 25. Jump to the nearest one and count on or back. R? T is 20, so R is 18.</p>
      <p><b>Mirror letters</b> add up to 27: A ↔ Z, B ↔ Y, M ↔ N. To find a mirror letter, take its number away from 27.</p>
      <p><b>Middle:</b> M is 13 and N is 14, so A–M is the first half and N–Z the second.</p></div>` : ''}
    ${c.t === 'tables' ? `<div class="card tipcard"><h3>✖️ Table tricks</h3><p>Division facts are times tables backwards: if 7 × 8 = 56, then 56 ÷ 8 = 7. The 9× table: the digits always add up to 9 (9 × 7 = 63).</p></div>` : ''}
    ${c.t === 'bonds' ? `<div class="card tipcard"><h3>🧩 Know these by heart</h3><p>${frac(1, 2)} = 0.5 = 50% · ${frac(1, 4)} = 0.25 = 25% · ${frac(3, 4)} = 0.75 = 75% · ${frac(1, 5)} = 0.2 = 20% · ${frac(1, 10)} = 0.1 = 10% · ${frac(1, 8)} = 0.125 = 12.5%</p></div>` : ''}
    ${bests.length ? `<div class="card"><h3>🏅 Your personal bests</h3><table class="dbest"><tbody>${bests.slice(0, 8).map(x => { const p = x.split('-'), d = H.st.drills[x]; return `<tr><td>${TYPES[p[0]].icon} ${esc(TYPES[p[0]].name)} · ${esc(subName(p[0], p[1]) || p[1])} <span class="muted small">(${+p[2] / 60} min)</span></td><td class="num"><b>${d.best}</b> right</td><td class="num muted small">${d.runs.length} go${d.runs.length > 1 ? 'es' : ''}</td></tr>`; }).join('')}</tbody></table></div>` : ''}`);
}

// ---------------------------------------------------------------- running a drill
function start() {
  stop();
  const c = cfg(), dur = testDur || c.d;
  R = { t: c.t, s: c.s, d: c.d, dur, key: dkey(c.t, c.s, c.d), start: Date.now(), deadline: Date.now() + dur * 1000, score: 0, n: 0, streak: 0, top: 0, wrong: [], typed: '', q: null, prev: '' };
  H.save();
  next();
  if (location.hash === '#drills/run') vRun(); else location.hash = '#drills/run';
}
function next() {
  let q, tries = 0;
  do { q = TYPES[R.t].gen(R.s); } while (q.say === R.prev && ++tries < 8);
  R.q = q; R.prev = q.say; R.typed = '';
}
const numPad = () => `<div class="dpad num">${['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0'].map(k => `<button class="dk" data-dr="key" data-k="${k}" aria-label="${k === '.' ? 'decimal point' : k}">${k}</button>`).join('')}<button class="dk del" data-dr="key" data-k="del" aria-label="Delete">⌫</button><button class="dk go" data-dr="key" data-k="enter">✓ Enter</button></div>`;
const letPad = () => `<div class="dpad let">${AZ.split('').map(k => `<button class="dk" data-dr="key" data-k="${k}">${k}</button>`).join('')}</div>`;
function vRun() {
  if (!R) { location.replace('#drills'); return; }
  const T = TYPES[R.t];
  H.page(`<div class="drun" id="drill" style="--c:${T.c}">
    <div class="row spread dtop"><span class="pill">${T.icon} ${H.esc(T.name)} · ${H.esc(subName(R.t, R.s))}</span>
      <span class="row" style="gap:.4rem"><span class="pill gold" id="dscore" aria-label="Right answers">✓ ${R.score}</span><span class="pill" id="dstreak">🔥 ${R.streak}</span><button class="btn ghost" data-dr="stop">✕ Stop</button></span></div>
    <div class="dtime" role="timer" aria-label="Time left"><div class="dbar"><i id="dbar"></i></div><b id="dsecs">${R.dur}</b></div>
    <div class="card dq" id="dq" aria-live="polite"><div class="dqt" id="dqt"></div><div class="dans" id="dans" aria-label="Your answer"></div></div>
    <div class="dfb" id="dfb" aria-live="polite">&nbsp;</div>
    <div id="dpad"></div></div>`);
  showQ(); tick();
  if (!R) return;
  if (R.timer) clearInterval(R.timer);
  R.timer = setInterval(tick, 100);
}
function showQ() {
  const qt = $('#dqt'), pad = $('#dpad');
  if (!qt || !pad) return;
  qt.innerHTML = R.q.q;
  if (pad.dataset.k !== R.q.k) { pad.innerHTML = R.q.k === 'let' ? letPad() : numPad(); pad.dataset.k = R.q.k; }
  showTyped();
}
function showTyped() { const a = $('#dans'); if (a) { a.textContent = R.q.k === 'let' ? '?' : (R.typed || '?'); a.classList.toggle('empty', !R.typed); } }
function tick() {
  if (!R) return;
  if (!$('#drill')) { discard(); return; }
  const left = Math.max(0, R.deadline - Date.now());
  const b = $('#dbar'), s = $('#dsecs');
  if (b) { b.style.width = (100 * left / (R.dur * 1000)).toFixed(1) + '%'; b.parentNode.classList.toggle('low', left < 10000); }
  if (s) s.textContent = Math.ceil(left / 1000);
  if (left <= 0) end();
}
function press(k) {
  if (!R || !R.q || Date.now() >= R.deadline) return;
  if (R.q.k === 'let') { if (/^[A-Z]$/.test(k)) answer(k); return; }
  if (k === 'enter') { if (R.typed) answer(R.typed); return; }
  if (k === 'del') R.typed = R.typed.slice(0, -1);
  else if (/^[0-9]$/.test(k) && R.typed.length < 7) R.typed += k;
  else if (k === '.' && R.typed.indexOf('.') < 0 && R.typed.length < 6) R.typed += k;
  showTyped();
}
const same = (given, a) => given === a || (given !== '' && given !== '.' && Math.abs(parseFloat(given) - parseFloat(a)) < 1e-9);
function answer(given) {
  const ok = same(given, R.q.a);
  R.n++;
  if (ok) { R.score++; R.streak++; R.top = Math.max(R.top, R.streak); }
  else { R.streak = 0; R.wrong.push({ q: R.q.say, g: given, a: R.q.a }); }
  H.sfx(ok ? 'right' : 'wrong');
  const box = $('#dq'), fb = $('#dfb');
  if (box) { box.classList.remove('ok', 'no'); void box.offsetWidth; box.classList.add(ok ? 'ok' : 'no'); }
  if (fb) { fb.className = 'dfb ' + (ok ? 'ok' : 'no'); fb.textContent = ok ? (R.streak >= 5 && R.streak % 5 === 0 ? `🔥 ${R.streak} in a row!` : '✓ Right') : `✗ ${solved(R.q)}`; }
  clearTimeout(fbTimer); fbTimer = setTimeout(() => { const b = $('#dq'); if (b) b.classList.remove('ok', 'no'); }, 260);
  const sc = $('#dscore'), sk = $('#dstreak');
  if (sc) sc.textContent = '✓ ' + R.score;
  if (sk) sk.textContent = '🔥 ' + R.streak;
  next(); showQ();
}
function stop() { if (R && R.timer) clearInterval(R.timer); clearTimeout(fbTimer); }
// Leaving, stopping or hiding the app part-way through throws the drill away, so a half drill never counts.
function discard(msg) {
  if (!R) return;
  stop(); R = null;
  if (msg) H.toast(msg);
}
function end() {
  const r = R; stop(); R = null;
  const st = H.st, secs = r.dur;
  st.drills = st.drills || {};
  const d = st.drills[r.key] || (st.drills[r.key] = { best: 0, at: 0, runs: [] });
  const prevBest = d.runs.length ? d.best : null;
  const res = { ts: Date.now(), score: r.score, n: r.n, secs };
  d.runs.push(res); if (d.runs.length > 10) d.runs = d.runs.slice(-10);
  const pb = prevBest !== null && r.score > prevBest;
  if (r.score > d.best || prevBest === null) d.best = Math.max(d.best, r.score);
  d.at = res.ts;
  H.practised(Math.round((Math.min(Date.now(), r.deadline) - r.start) / 1000));
  const ids = ['drill1'];
  if (r.score >= 30 * r.d / 60) ids.push('drill30');
  if (pb) ids.push('drillpb');
  const kinds = new Set(Object.keys(st.drills).map(k => k.split('-')[0]).filter(t => TYPES[t]));
  if (Object.keys(TYPES).every(t => kinds.has(t))) ids.push('drillall');
  const won = H.win(ids);   // saves
  LAST = Object.assign({ t: r.t, s: r.s, d: r.d, key: r.key, top: r.top, wrong: r.wrong, pb, prevBest, awards: won, shown: false }, res);
  location.hash = '#drills/done';
}

// ---------------------------------------------------------------- results
function vDone() {
  if (!LAST) { location.replace('#drills'); return; }
  const x = LAST, T = TYPES[x.t], esc = H.esc, d = rec(x.key) || { best: x.score, runs: [] };
  const acc = x.n ? Math.round(100 * x.score / x.n) : 0, qpm = Math.round(10 * x.n * 60 / x.secs) / 10;
  const runs = d.runs.slice(-10), mx = Math.max(1, ...runs.map(u => u.score));
  const say = x.pb ? `<b>New personal best!</b> You beat your old best of ${x.prevBest}. Brilliant!`
    : x.prevBest === null ? `<b>Your first ${esc(T.name.toLowerCase())} drill!</b> ${x.score} is your score to beat next time.`
    : x.score === d.best ? `<b>You matched your best!</b> One more next time?`
    : acc >= 90 ? `<b>Super accurate!</b> Now try to go a little faster.`
    : x.n && acc < 70 ? `<b>Good effort!</b> Slow down a little. Getting them right matters more than speed.`
    : `<b>Well done!</b> Your best is ${d.best}. Keep practising and it will grow.`;
  H.page(`<p><a href="#drills">← Speed drills</a></p><h1>⏱ Time's up!</h1>
    <p class="muted">${T.icon} ${esc(T.name)} · ${esc(subName(x.t, x.s))} · ${x.d / 60} minute${x.d > 60 ? 's' : ''}</p>
    <div class="hero">${H.buddy(say, x.pb || acc >= 90 ? 'happy' : '')}</div>
    <div class="tiles four dres">
      <div class="tile"><b>${x.score}</b><span>right</span></div>
      <div class="tile"><b>${acc}%</b><span>accuracy (${x.score} of ${x.n})</span></div>
      <div class="tile"><b>${qpm}</b><span>answers a minute</span></div>
      <div class="tile ${x.pb ? 'pbt' : ''}"><b>${x.pb ? '🎉 ' : ''}${d.best}</b><span>personal best</span></div>
    </div>
    ${x.top >= 3 ? `<p class="small muted" style="text-align:center">🔥 Longest run of right answers: <b>${x.top}</b></p>` : ''}
    <div class="row" style="margin:1rem 0"><button class="btn" data-dr="again">⚡ Go again</button><a class="btn alt" href="#drills">Choose another drill</a></div>
    <div class="card"><h3>Your last ${runs.length} go${runs.length > 1 ? 'es' : ''} at this drill</h3>
      <div class="dbars" style="--n:${Math.max(runs.length, 5)}">${runs.map((u, i) => `<div title="${u.score} right"><span>${u.score}</span><i class="${i === runs.length - 1 ? 'now' : ''} ${u.score === d.best ? 'best' : ''}" style="height:${Math.max(3, Math.round(100 * u.score / mx))}%"></i></div>`).join('')}</div>
      <p class="small muted">The newest is on the right${runs.some(u => u.score === d.best) ? ' · gold = personal best' : ''}.</p></div>
    <div class="card"><h3>${x.wrong.length ? `To practise: ${x.wrong.length} slip${x.wrong.length > 1 ? 's' : ''}` : 'No mistakes at all! 🌟'}</h3>
      ${x.wrong.length ? `<table class="dwrong"><thead><tr><th>Question</th><th>You said</th><th>Answer</th></tr></thead><tbody>${x.wrong.map(w => `<tr><td>${esc(w.q)}</td><td class="no">${esc(w.g)}</td><td class="ok"><b>${esc(w.a)}</b></td></tr>`).join('')}</tbody></table>` : '<p class="muted small">Every answer was right. Try going for more next time, or pick a harder drill.</p>'}</div>`);
  if (!x.shown) { x.shown = true; if (x.awards && x.awards.length) setTimeout(() => { if (location.hash === '#drills/done') H.celebrate(x.awards); }, 350); else if (x.pb) H.confetti(60); }
}

function view(sub) {
  if (sub === 'run') return vRun();
  if (R) discard();
  if (sub === 'done') return vDone();
  vSetup();
}

// ---------------------------------------------------------------- input
document.addEventListener('click', e => {
  const el = e.target.closest('[data-dr]');
  if (!el || !H) return;
  const a = el.dataset.dr, c = cfg();
  e.preventDefault();
  if (a === 'key') return press(el.dataset.k);
  if (a === 'type') { c.t = el.dataset.t; c.s = 'mix'; H.save(); vSetup(); }
  else if (a === 'sub') { c.s = el.dataset.s; H.save(); vSetup(); }
  else if (a === 'dur') { c.d = +el.dataset.d; H.save(); vSetup(); }
  else if (a === 'start') start();
  else if (a === 'again') { if (LAST) { c.t = LAST.t; c.s = LAST.s; c.d = LAST.d; } start(); }
  else if (a === 'stop') { discard('Drill stopped. It was not counted.'); location.hash = '#drills'; }
});
// Taps on the pad should not move focus (so Enter on the keyboard never presses a pad button by accident).
document.addEventListener('mousedown', e => { if (e.target.closest && e.target.closest('.dk')) e.preventDefault(); });
document.addEventListener('keydown', e => {
  if (!R || !$('#drill') || $('#pop') || e.ctrlKey || e.metaKey || e.altKey) return;
  let k = e.key;
  if (k === 'Enter') k = 'enter'; else if (k === 'Backspace' || k === 'Delete') k = 'del'; else if (k === ',') k = '.';
  else if (k.length === 1) k = k.toUpperCase();
  else return;
  if (!/^(enter|del|[0-9.]|[A-Z])$/.test(k)) return;
  e.preventDefault();
  press(k);
  const b = document.querySelector(`.dk[data-k="${k}"]`);
  if (b) { b.classList.add('hit'); setTimeout(() => b.classList.remove('hit'), 120); }
});
window.addEventListener('hashchange', () => { if (R && location.hash !== '#drills/run') discard(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && R) { discard('The drill stopped because the app was hidden. It was not counted.'); if (location.hash === '#drills/run') location.replace('#drills'); } });

window.DRILLS = {
  badges: BADGES,
  init: host => { H = host; },
  view,
  running: () => !!R,
  // for the automated tests only: shorten the drills (seconds), or null for the normal length
  setTestDuration: s => { testDur = s || null; },
  _state: () => R && { q: R.q, typed: R.typed, score: R.score, n: R.n, streak: R.streak, left: R.deadline - Date.now() }
};
})();
