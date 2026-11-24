// Simulates a very heavy year of use and reports how big each child's saved progress gets.
// It follows the shapes app.js saves (history entries with items, per-question stats in q,
// the revision queue, minutes per day, AI questions and passages) and the limits the app already
// applies when it records an activity (history 400, AI questions 400, AI passages 20, reports 100).
//
// usage: node tests/storage/heavy-year.js [out.json] [--children 3] [--days 365] [--sessions 4] [--per 20]
// The optional out.json gets {key: stateJSON} for every child, for tests/test_storage.py to load in a browser.
'use strict';
const fs = require('fs');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? +process.argv[i + 1] : d; };
const out = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null;
const CHILDREN = arg('children', 3), DAYS = arg('days', 365), SESSIONS = arg('sessions', 4), PER = arg('per', 20);
// A tiny seeded random generator so every run gives the same sizes.
let seed = 12345; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const pick = a => a[Math.floor(rnd() * a.length)];
const dstr = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
// Real topics and bank question ids from the data files, so the sizes match what the app saves.
const R = require('path').join(__dirname, '..', '..', 'data') + require('path').sep;
global.window = {}; global.document = { createElement: () => ({}) };
for (const s of ['maths', 'english', 'vr', 'nvr']) { require(R + s + '.js'); require(R + s + '-questions.js'); }
const TOPICS = {}, BANKIDS = {};
for (const s of ['maths', 'english', 'vr', 'nvr']) { TOPICS[s] = window.BANK[s].topics.map(t => t.id); window.BANK[s].questions.forEach(q => { (BANKIDS[s + '/' + q.topic] = BANKIDS[s + '/' + q.topic] || []).push(q.id); }); }
const SIDS = Object.keys(TOPICS), INTERVALS = [1, 3, 7];
const MODES = ['exercise', 'quiz', 'test', 'revision'];
function genId(sid, tid) {
  const bank = BANKIDS[sid + '/' + tid] || [];
  if (rnd() < 0.7 || !bank.length) return `g${rnd() < 0.5 ? '2' : ''}-${sid}-${tid}-${1 + Math.floor(rnd() * 3)}-${Math.floor(rnd() * 1e9)}`;
  return pick(bank);
}
function aiQuestion(sid, tid, ts, i) {
  const opts = [0, 1, 2, 3, 4].map(k => String(100 + i * 7 + k * 3));
  return { id: `ai-${sid}-${ts.toString(36)}-${i}-${Math.floor(rnd() * 1e5)}`, subject: sid, topic: tid, d: 2, q: `Sam has ${opts[2]} stickers and gives some away. How many are left if ...? (an AI-written word problem of a typical length)`, opts, a: 2, hint: 'Write down what you know first, then take away.', steps: ['Start with what you know.', 'Take away the stickers he gave away.', `The answer is ${opts[2]}.`], ai: true };
}
function simulate(name) {
  const st = { v: 1, settings: { board: 'kent', name, examDate: '2027-09-10' }, stars: 0, streak: 0, lastDay: null, badges: { first: '2025-12-01', streak3: '2025-12-03' }, topic: {}, q: {}, review: {}, history: [], last: null, time: {}, lessons: {}, plan: null, flashDay: null, aiq: {}, aip: {}, hidden: {}, reports: [] };
  const now = Date.now(), full = [];
  for (let day = DAYS - 1; day >= 0; day--) {
    const d = new Date(now - day * 864e5); d.setHours(16, 0, 0, 0); const ds = dstr(d);
    for (let s = 0; s < SESSIONS; s++) {
      const ts = d.getTime() + s * 1800e3, sid = pick(SIDS), tid = pick(TOPICS[sid]);
      let mode = MODES[s % MODES.length], n = PER, label = null, cfg = null, parts = null;
      if (day % 7 === 0 && s === 3) { mode = 'mock'; n = 80; label = 'Kent-style full mock'; cfg = { k: 'mock', kind: 'full' }; parts = [{ name: 'English', from: 0, to: 25 }, { name: 'Maths', from: 25, to: 50 }, { name: 'Reasoning', from: 50, to: 80 }]; }
      if (mode === 'test') { label = '10-minute test'; cfg = { k: 'test', sid }; }
      const items = [];
      const ai = day % 3 === 0 && s === 1 && sid !== 'nvr';
      const due = Object.keys(st.review).filter(id => st.review[id].due <= ds);
      for (let i = 0; i < n; i++) {
        let id;
        if (mode === 'revision' && due.length) id = due.shift();
        else if (ai) { const q = aiQuestion(sid, tid, ts, i); st.aiq[q.id] = q; id = q.id; }
        else id = genId(mode === 'mock' ? pick(SIDS) : sid, tid);
        const ok = rnd() < 0.75, c = ok ? 2 : Math.floor(rnd() * 5);
        items.push({ id, c, t: 10 + Math.floor(rnd() * 60) });
        const t = st.topic[sid + '/' + tid] || (st.topic[sid + '/' + tid] = { level: 1, up: 0, down: 0, seen: 0, correct: 0, recent: [] });
        t.seen++; if (ok) t.correct++; t.recent.push(ok ? 1 : 0); if (t.recent.length > 20) t.recent.shift();
        const qs = st.q[id] || (st.q[id] = { s: 0, c: 0 }); qs.s++; if (ok) qs.c++; qs.t = ts;
        if (ok) { st.stars++; const r = st.review[id]; if (mode === 'revision' && r) { r.stage++; if (r.stage >= INTERVALS.length) delete st.review[id]; else r.due = dstr(new Date(d.getTime() + INTERVALS[r.stage] * 864e5)); } }
        else st.review[id] = { stage: 0, due: dstr(new Date(d.getTime() + 864e5)) };
      }
      if (ai) { const ids = Object.keys(st.aiq); if (ids.length > 400) ids.slice(0, ids.length - 400).forEach(k => delete st.aiq[k]); }
      if (ai && sid === 'english') { st.aip.english = st.aip.english || {}; st.aip.english['aip-' + ts.toString(36)] = { title: 'The Lost Kite', kind: 'prose', text: 'Mia ran up the hill with her kite. '.repeat(60) }; const ids = Object.keys(st.aip.english); if (ids.length > 20) delete st.aip.english[ids[0]]; }
      const score = items.filter(x => x.c === 2).length, secs = items.reduce((a, x) => a + x.t, 0);
      const e = { id: 'h' + ts, ts, day: ds, mode, subject: sid, topic: mode === 'exercise' || mode === 'quiz' ? tid : undefined, score, total: items.length, secs, stars: score, items };
      if (label) e.label = label; if (cfg) e.cfg = cfg; if (parts) { e.parts = parts; e.mins = 75; }
      st.history.unshift(e); full.unshift(e); if (st.history.length > 400) st.history.length = 400;   // the limit the app had before the tidy-up
      st.time[ds] = (st.time[ds] || 0) + secs;
      st.lessons[sid + '/' + tid] = ds; st.last = { subject: sid, topic: tid };
    }
    st.lastDay = ds; st.streak++;
  }
  st.savedAt = now;
  return { st, full };
}
const kb = n => (n / 1024).toFixed(0) + ' KB';
const states = {}; let total = 0;
for (let c = 0; c < CHILDREN; c++) {
  const { st, full } = simulate(['Arjun', 'Riya', 'Dev'][c] || 'Child' + c), json = JSON.stringify(st);
  const key = c === 0 ? 'elevenplus.v1' : 'elevenplus.v1.p' + c; total += json.length;
  // the file for the browser test has the whole year of history (the app now keeps summaries beyond the old 400)
  states[key] = JSON.stringify(Object.assign({}, st, { history: full }));
  console.log(`${key}: ${full.length} activities in the year`);
  const part = k => JSON.stringify(st[k] || {}).length;
  console.log(`${key}: ${kb(json.length)}  (history ${st.history.length} entries ${kb(part('history'))}, q ${Object.keys(st.q).length} ids ${kb(part('q'))}, review ${Object.keys(st.review).length} ${kb(part('review'))}, aiq ${kb(part('aiq'))}, aip ${kb(part('aip'))}, time ${kb(part('time'))})`);
}
console.log(`all children (as saved before the tidy-up): ${kb(total)} (browser storage is about 5 MB shared by every app on the same site; a Firestore document is at most 1 MB)`);
if (out) fs.writeFileSync(out, JSON.stringify(states));
